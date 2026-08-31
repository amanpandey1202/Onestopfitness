import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok, created } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { trainerCreateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireAdmin();
    const trainers = await prisma.user.findMany({
      // Include the founder (an ADMIN account with a trainer profile) so their
      // founder note/titles can be edited from this same screen.
      where: {
        OR: [{ role: Role.TRAINER }, { trainerProfile: { isNot: null } }],
      },
      include: { trainerProfile: true },
      orderBy: { createdAt: "desc" },
    });
    // Never send password hashes to the client.
    return ok({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      trainers: trainers.map(({ passwordHash, ...trainer }) => trainer),
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const data = trainerCreateSchema.parse(body);
    const email = data.email.toLowerCase();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const trainer = await prisma.user.create({
      data: {
        name: data.name,
        email,
        phone: data.phone,
        passwordHash: await hashPassword(data.password),
        role: Role.TRAINER,
        // Admin-added trainers are onboarded in person — mark verified so the
        // system never expects an email-verification click from them.
        emailVerified: new Date(),
        trainerProfile: {
          create: {
            specialization: data.specialization,
            bio: data.bio,
            experience: data.experience,
            instagram: data.instagram,
            profileImageUrl: data.profileImageUrl,
            founderNote: data.founderNote,
            founderTitles:
              data.founderTitles === undefined
                ? undefined
                : JSON.stringify(data.founderTitles),
            isFounder: data.isFounder,
          },
        },
      },
      include: { trainerProfile: true },
    });

    await logAudit(admin.id, "CREATE_TRAINER", "User", trainer.id, { email });
    return created({ id: trainer.id, name: trainer.name, email: trainer.email });
  } catch (error) {
    return fail(error);
  }
}
