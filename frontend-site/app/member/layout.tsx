import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import MemberShell from "@/components/member/MemberShell";

/**
 * Member layout: server-side role guard. The API layer is still the source
 * of truth — this just keeps the shell correct per role.
 */
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== Role.MEMBER) {
    redirect(user.role === Role.ADMIN ? "/admin/dashboard" : "/trainer");
  }

  return <MemberShell>{children}</MemberShell>;
}
