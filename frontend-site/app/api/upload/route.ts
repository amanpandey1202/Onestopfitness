import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { getStorage, validateUpload, assertUploadContent } from "@/lib/storage";
import { extractVideoPoster } from "@/lib/videoPoster";
import { fail } from "@/lib/api";
import { logAudit } from "@/lib/audit";

/**
 * Admin image upload. Validates type + size, stores the file via the storage
 * provider, and returns the public URL + storage id for use in CMS records.
 *
 * For VIDEO uploads, also extracts a poster frame and uploads it to the same
 * folder as `<video-name>.jpg`, returned as `posterUrl` on the response.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const type = validateUpload({ name: file.name, size: file.size });

    const buffer = Buffer.from(await file.arrayBuffer());
    assertUploadContent(type, buffer);

    const folder = (form.get("folder") as string) || "misc";
    const storage = getStorage();
    const stored = await storage.save(buffer, file.name, folder);

    let posterUrl: string | null = null;
    if (type === "VIDEO") {
      const ext = /\.[a-z0-9]+$/i.exec(file.name)?.[0]?.toLowerCase() || ".mp4";
      const poster = await extractVideoPoster(buffer, ext);
      if (poster) {
        const posterStored = await storage.save(poster, "poster.jpg", folder);
        posterUrl = posterStored.url;
      }
    }

    await logAudit(admin.id, "UPLOAD_FILE", "Storage", null, {
      url: stored.url,
      posterUrl,
    });
    return NextResponse.json({ ...stored, type, posterUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && /^(Unsupported|File too large|Rejected)/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return fail(error);
  }
}
