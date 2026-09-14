import { getAdminGallery, safeAdmin } from "@/lib/services/admin";
import GalleryClient from "@/components/admin/gallery/GalleryClient";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const data = await safeAdmin(() => getAdminGallery(), null);
  return <GalleryClient initial={data?.images ?? null} />;
}