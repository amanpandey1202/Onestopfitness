import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import MemberShell from "@/components/member/MemberShell";

/**
 * Member layout: server-side role guard. The API layer is still the source
 * of truth — this just keeps the shell correct per role.
 *
 * Exceptions: the receipt pages under /member/pay are also viewable by
 * admins/trainers (e.g. from the admin Payments "Receipt" link), so those
 * staff roles are allowed through on that path without the member shell.
 */
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (user.role !== Role.MEMBER) {
    const pathname = (await headers()).get("x-pathname") ?? "";
    const isReceiptPath = pathname.startsWith("/member/pay/success");
    if (isReceiptPath) {
      // Allow admin/trainer to open receipts; page renders standalone.
      return <>{children}</>;
    }
    redirect(user.role === Role.ADMIN ? "/admin/dashboard" : "/trainer");
  }

  return <MemberShell>{children}</MemberShell>;
}
