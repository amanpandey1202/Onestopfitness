import { getAdminAnnouncements, safeAdmin } from "@/lib/services/admin";
import AnnouncementsClient from "@/components/admin/announcements/AnnouncementsClient";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const data = await safeAdmin(() => getAdminAnnouncements(), null);
  return <AnnouncementsClient initial={data?.announcements ?? null} />;
}