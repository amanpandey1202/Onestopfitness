import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface StoredFile {
  url: string;
  publicId: string;
}

export interface StorageProvider {
  save(buffer: Buffer, originalName: string, folder: string): Promise<StoredFile>;
  remove(publicId: string): Promise<void>;
}

/**
 * Default provider: writes to public/uploads so files are served statically.
 * Swap to a cloud provider (Cloudinary/Supabase) by adding a provider and
 * setting STORAGE_PROVIDER in .env — feature code doesn't change.
 */
class LocalDiskStorage implements StorageProvider {
  private root = path.join(process.cwd(), "public", "uploads");

  async save(buffer: Buffer, originalName: string, folder: string): Promise<StoredFile> {
    const ext = path.extname(originalName).toLowerCase() || ".jpg";
    // Sanitize folder against path traversal: only [a-z0-9-_] allowed.
    const safeFolder = (folder || "misc").replace(/[^a-z0-9_-]/gi, "").slice(0, 50) || "misc";
    const name = crypto.randomBytes(16).toString("hex") + ext;
    const dir = path.join(this.root, safeFolder);
    fs.mkdirSync(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, name), buffer);
    return { url: `/uploads/${safeFolder}/${name}`, publicId: `${safeFolder}/${name}` };
  }

  async remove(publicId: string): Promise<void> {
    // Never let a crafted publicId escape the uploads root.
    if (!publicId || publicId.includes("..") || publicId.includes("\\") || publicId.includes(":")) {
      return;
    }
    const filePath = path.join(this.root, publicId);
    const resolved = path.resolve(filePath);
    const rootResolved = path.resolve(this.root);
    if (!resolved.startsWith(rootResolved + path.sep)) {
      return;
    }
    try {
      await fs.promises.rm(filePath, { force: true });
    } catch (err) {
      // Serverless (Vercel) filesystems are read-only — there is nothing to
      // delete there, and the DB row is already gone. Swallow EROFS/ENOENT/
      // EPERM so cleanup is always a no-op instead of a 500.
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "EROFS" && code !== "ENOENT" && code !== "EPERM") {
        throw err;
      }
    }
  }
}

/**
 * Supabase Storage provider. Stores files in a Supabase Storage bucket and
 * returns the public URL. Uses the Storage REST API directly (global fetch),
 * so no extra dependency is needed.
 */
export class SupabaseStorage implements StorageProvider {
  async save(buffer: Buffer, originalName: string, folder: string): Promise<StoredFile> {
    const ext = path.extname(originalName).toLowerCase() || ".jpg";
    const safeFolder = (folder || "misc").replace(/[^a-z0-9_-]/gi, "").slice(0, 50) || "misc";
    const name = crypto.randomBytes(16).toString("hex") + ext;
    const objectPath = `${safeFolder}/${name}`;
    const res = await fetch(supabaseObjectEndpoint(objectPath), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceRoleKey()}`,
        "Content-Type": mimeFromExt(ext),
        "x-upsert": "true",
      },
      body: new Uint8Array(buffer),
    });
    if (!res.ok) {
      throw new Error(`Supabase upload failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    }
    return {
      url: `${supabaseUrl()}/storage/v1/object/public/${supabaseBucket()}/${objectPath}`,
      publicId: objectPath,
    };
  }

  async remove(publicId: string): Promise<void> {
    // Never let a crafted publicId escape into another object path.
    if (!publicId || publicId.includes("..") || publicId.includes("\\") || publicId.includes(":")) {
      return;
    }
    const res = await fetch(supabaseObjectEndpoint(publicId), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${supabaseServiceRoleKey()}` },
    });
    // 200/204 = deleted, 404 = already gone — both are fine.
    if (res.status !== 200 && res.status !== 204 && res.status !== 404) {
      throw new Error(`Supabase delete failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    }
  }
}

/** Full REST endpoint for an object under the configured bucket. */
function supabaseObjectEndpoint(objectPath: string): string {
  return `${supabaseUrl()}/storage/v1/object/${supabaseBucket()}/${objectPath}`;
}

export function supabaseUrl(): string {
  const fromEnv = process.env.SUPABASE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  // Derive from the Supabase-hosted DATABASE_URL when SUPABASE_URL isn't set:
  // postgresql://postgres:xxx@db.<ref>.supabase.co:5432/postgres
  const match = process.env.DATABASE_URL?.match(/@db\.([a-z0-9]+)\.supabase\.co/);
  if (match) return `https://${match[1]}.supabase.co`;
  throw new Error("Set SUPABASE_URL (or a supabase.co DATABASE_URL) in .env");
}

export function supabaseBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || "uploads";
}

export function supabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in .env");
  return key;
}

function mimeFromExt(ext: string): string {
  return (
    {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".mov": "video/quicktime",
      ".m4v": "video/x-m4v",
    }[ext] || "application/octet-stream"
  );
}

const providers: Record<string, () => StorageProvider> = {
  local: () => new LocalDiskStorage(),
  supabase: () => new SupabaseStorage(),
};

export function getStorage(): StorageProvider {
  const name = process.env.STORAGE_PROVIDER || "local";
  const factory = providers[name];
  if (!factory) throw new Error(`Unknown STORAGE_PROVIDER: ${name}`);
  return factory();
}

/** File type + size validation — never trust the extension alone. */
const IMAGE_TYPES = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const VIDEO_TYPES = [".mp4", ".webm", ".mov", ".m4v"];
const IMAGE_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;

export function validateUpload(file: { name: string; size: number }) {
  const ext = path.extname(file.name).toLowerCase();
  if (IMAGE_TYPES.includes(ext)) {
    if (file.size > IMAGE_MAX) {
      throw new HttpUploadError("File too large — images max 5MB.");
    }
    return "IMAGE";
  }
  if (VIDEO_TYPES.includes(ext)) {
    if (file.size > VIDEO_MAX) {
      throw new HttpUploadError("File too large — videos max 50MB.");
    }
    return "VIDEO";
  }
  throw new HttpUploadError(
    `Unsupported file type "${ext}". Use JPG, PNG, WEBP, GIF or MP4/WebM/MOV video.`
  );
}

class HttpUploadError extends Error {}

/**
 * Confirms a buffer's real content type via magic bytes (never the extension).
 * Images must be actual image data; videos must be actual video container data.
 * Throws HttpUploadError when the content doesn't match the declared type.
 */
export function assertUploadContent(type: "IMAGE" | "VIDEO", buffer: Buffer): void {
  if (!buffer || buffer.length < 16) {
    throw new HttpUploadError("File content could not be verified.");
  }

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46; // "GIF"
  const isWebp = buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  const isMp4 = buffer.toString("ascii", 4, 8) === "ftyp";

  if (type === "IMAGE") {
    const isImage = isJpeg || isPng || isGif || isWebp;
    if (!isImage) {
      throw new HttpUploadError("Rejected: file content is not a valid image.");
    }
    return;
  }

  const isMp4Webm = isMp4 || (buffer.toString("ascii", 0, 4) === "webm") || (buffer.toString("ascii", 0, 4) === "mkv");
  if (!isMp4Webm) {
    throw new HttpUploadError("Rejected: file content is not valid video data.");
  }
}

/** Extracts the local publicId from a /uploads/ URL (or null if not a stored file). */
export function publicIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const prefix = "/uploads/";
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}

/** Extracts the object path from a Supabase Storage public URL (or null). */
export function supabasePublicIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const prefix = `${supabaseUrl()}/storage/v1/object/public/${supabaseBucket()}/`;
    if (!url.startsWith(prefix)) return null;
    return url.slice(prefix.length);
  } catch {
    return null; // env not configured yet — nothing to match against
  }
}

/**
 * Deletes an uploaded file. Routes by the URL's shape so cleanup never touches
 * the wrong provider during/after a migration (seed/static URLs are untouched).
 */
export async function deleteStoredImage(url: string | null | undefined): Promise<void> {
  const supabaseId = supabasePublicIdFromUrl(url);
  if (supabaseId) {
    await new SupabaseStorage().remove(supabaseId);
    return;
  }
  const localId = publicIdFromUrl(url);
  if (localId) await new LocalDiskStorage().remove(localId);
}
