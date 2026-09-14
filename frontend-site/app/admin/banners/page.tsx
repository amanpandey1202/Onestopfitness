import { getAdminBanners, safeAdmin } from "@/lib/services/admin";
import BannersClient from "@/components/admin/banners/BannersClient";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const data = await safeAdmin(() => getAdminBanners(), null);
  return <BannersClient initial={data?.banners ?? null} />;
}