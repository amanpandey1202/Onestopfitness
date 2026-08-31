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
    await fs.promises.rm(filePath, { force: true });
  }
}

const providers: Record<string, () => StorageProvider> = {
  local: () => new LocalDiskStorage(),
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

/** Deletes an uploaded file if it's a local upload (seed/static images are untouched). */
export async function deleteStoredImage(url: string | null | undefined): Promise<void> {
  const publicId = publicIdFromUrl(url);
  if (publicId) await getStorage().remove(publicId);
}
