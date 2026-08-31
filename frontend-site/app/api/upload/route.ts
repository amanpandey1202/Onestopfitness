import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { getStorage, validateUpload, assertUploadContent } from "@/lib/storage";
import { fail } from "@/lib/api";
import { logAudit } from "@/lib/audit";

/**
 * Admin image upload. Validates type + size, stores the file via the storage
 * provider, and returns the public URL + storage id for use in CMS records.
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

    await logAudit(admin.id, "UPLOAD_FILE", "Storage", null, { url: stored.url });
    return NextResponse.json({ ...stored, type }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && /^(Unsupported|File too large|Rejected)/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return fail(error);
  }
}
