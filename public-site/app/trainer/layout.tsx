import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import TrainerShell from "@/components/trainer/TrainerShell";

/** Trainer layout: server-side role guard (API layer remains the source of truth). */
export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== Role.TRAINER) {
    redirect(user.role === Role.ADMIN ? "/admin/dashboard" : "/member");
  }

  return <TrainerShell>{children}</TrainerShell>;
}
