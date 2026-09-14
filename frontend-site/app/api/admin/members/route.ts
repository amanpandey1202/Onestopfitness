import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Role, type Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok, created } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { memberCreateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { syncMemberToAirtable } from "@/lib/airtable";
import { nextMemberCode } from "@/lib/memberCode";
import { computeMembershipEndDate } from "@/lib/format";
import { encryptField, maskAadhaar } from "@/lib/crypto";
import { resumeExpiredFreezes } from "@/lib/membership";
import { isMemberVerified } from "@/lib/memberVerification";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await resumeExpiredFreezes(prisma);
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim();
    const status = url.searchParams.get("status"); // active | suspended | expired | all
    const category = url.searchParams.get("category"); // member | new | all

    const now = new Date();
    const where: Prisma.UserWhereInput = { role: Role.MEMBER };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { memberCode: { contains: search } },
      ];
    }
    if (status === "suspended") where.isActive = false;
    if (status === "active") where.isActive = true;
    if (status === "expired") {
      where.isActive = true;
      where.memberships = { some: { status: "ACTIVE", endDate: { lt: now } } };
    }
    if (status === "absentee") {
      where.createdAt = { lte: new Date(Date.now() - 14 * 86_400_000) };
      where.attendance = { none: { checkIn: { gte: new Date(Date.now() - 14 * 86_400_000) } } };
    }

    // Category is derived from whether they've ever been given access (a paid
    // membership or a PAID payment). "New registrations" are accounts that
    // signed up but never paid, so they're not counted as real members yet.
    if (category === "member") {
      where.OR = [
        ...(where.OR ?? []),
        { memberships: { some: {} } },
        { payments: { some: { status: "PAID" } } },
      ];
    } else if (category === "new") {
      where.AND = [
        { memberships: { none: {} } },
        { payments: { none: { status: "PAID" } } },
      ];
    }

    const members = await prisma.user.findMany({
      where,
      include: {
        memberProfile: true,
        memberships: { include: { plan: true }, orderBy: { endDate: "desc" } },
        payments: {
          where: { status: "PAID" },
          select: { id: true },
          take: 1,
        },
        attendance: {
          orderBy: { checkIn: "desc" },
          take: 1,
          select: { checkIn: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Never send password hashes to the client; decrypt PII for display.
    return ok({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      members: members.map(({ passwordHash, payments, ...member }) => ({
        ...member,
        // A "paid member" — never just a signup.
        category: member.memberships.length > 0 || payments.length > 0 ? "member" : "new",
        // Whether the front desk has captured Aadhaar + address + a contact.
        isVerified: isMemberVerified(member.memberProfile),
        memberProfile: member.memberProfile
          ? {
              ...member.memberProfile,
              aadhaarNumber: maskAadhaar(member.memberProfile.aadhaarNumber),
            }
          : member.memberProfile,
      })),
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const data = memberCreateSchema.parse(body);
    const email = data.email.toLowerCase();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    // nextMemberCode is an O(n) max+1 scan; two concurrent creates can both get
    // the same code. Retry the create a couple of times if a memberCode
    // collision sneaks in (same pattern the CSV import uses).
    let user: Awaited<ReturnType<typeof prisma.user.create>> | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        user = await prisma.user.create({
          data: {
            name: data.name,
            email,
            phone: data.phone,
            memberCode: await nextMemberCode(prisma),
            passwordHash: await hashPassword(data.password),
            role: Role.MEMBER,
            // Admin-added members are onboarded in person — mark verified so the
            // system never expects an email-verification click from them.
            emailVerified: new Date(),
            memberProfile: {
              create: {
                fitnessGoal: data.fitnessGoal,
                notes: data.notes,
                joiningDate: data.joiningDate ?? new Date(),
                alternatePhone: data.alternatePhone,
                aadhaarNumber: data.aadhaarNumber ? encryptField(data.aadhaarNumber) : undefined,
                address: data.address,
                parentName: data.parentName,
                parentPhone: data.parentPhone,
                emergencyContact: data.emergencyContact,
              },
            },
          },
          include: { memberProfile: true },
        });
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("Unique constraint") && msg.includes("memberCode") && attempt < 2) {
          continue;
        }
        throw err;
      }
    }
    if (!user) throw new Error("Failed to create member");

    if (data.planId) {
      const plan = await prisma.membershipPlan.findUnique({ where: { id: data.planId } });
      if (plan) {
        const start = new Date();
        const end = computeMembershipEndDate(start, plan.durationDays);
        await prisma.membership.create({
          data: { memberId: user.id, planId: plan.id, startDate: start, endDate: end },
        });
        await syncMemberToAirtable({
          name: user.name,
          phone: user.phone,
          email: user.email,
          planName: plan.name,
          amount: plan.price,
          startDate: start,
          endDate: end,
        });
      }
    }

    await logAudit(admin.id, "CREATE_MEMBER", "User", user.id, { email });
    return created({ id: user.id, name: user.name, email: user.email });
  } catch (error) {
    return fail(error);
  }
}
