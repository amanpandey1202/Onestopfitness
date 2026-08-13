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
import { encryptField, decryptField } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim();
    const status = url.searchParams.get("status"); // active | suspended | expired | all

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

    const members = await prisma.user.findMany({
      where,
      include: {
        memberProfile: true,
        memberships: { include: { plan: true }, orderBy: { endDate: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Never send password hashes to the client; decrypt PII for display.
    return ok({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      members: members.map(({ passwordHash, ...member }) => ({
        ...member,
        memberProfile: member.memberProfile
          ? {
              ...member.memberProfile,
              aadhaarNumber: decryptField(member.memberProfile.aadhaarNumber),
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

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        phone: data.phone,
        memberCode: await nextMemberCode(prisma),
        passwordHash: await hashPassword(data.password),
        role: Role.MEMBER,
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
          },
        },
      },
      include: { memberProfile: true },
    });

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
