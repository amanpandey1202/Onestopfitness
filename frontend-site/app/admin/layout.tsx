import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

/**
 * Admin layout: server-side role guard (the API layer is still the source of
 * truth). The login page renders standalone so it never inherits the shell.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== Role.ADMIN) {
    redirect(user.role === Role.TRAINER ? "/trainer" : "/member");
  }

  return <AdminShell>{children}</AdminShell>;
}
