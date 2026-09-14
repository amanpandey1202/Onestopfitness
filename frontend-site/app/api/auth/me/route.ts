import crypto from "node:crypto";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();

    // Auto-provision QR token on first login if not yet set.
    // This means every member automatically gets a QR code — no manual step.
    let qrToken = user.qrToken;
    if (!qrToken) {
      qrToken = crypto.randomBytes(32).toString("hex");
      await prisma.user.update({ where: { id: user.id }, data: { qrToken } });
    }

    const [memberProfile, trainerProfile] = await Promise.all([
      prisma.memberProfile.findUnique({ where: { userId: user.id } }),
      prisma.trainerProfile.findUnique({ where: { userId: user.id } }),
    ]);

    return ok({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      memberCode: user.memberCode,
      profileImageUrl: user.profileImageUrl,
      emailVerified: user.emailVerified,
      qrToken,
      memberProfile,
      trainerProfile,
    });
  } catch (error) {
    return fail(error);
  }
}
