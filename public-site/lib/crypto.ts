import crypto from "node:crypto";

/**
 * Field-level encryption for sensitive PII (e.g. Aadhaar) at rest.
 * Uses AES-256-GCM with a key derived from AADHAAR_ENCRYPTION_KEY.
 *
 * Encrypted values are stored as: enc:v1:<iv>:<authTag>:<ciphertext> (all base64).
 * decryptField() transparently returns legacy plaintext values unchanged, so the
 * system keeps working during the plaintext→ciphertext migration.
 */

const ALGO = "aes-256-gcm";
const PREFIX = "enc:v1:";

function getKey(): Buffer {
  const secret = process.env.AADHAAR_ENCRYPTION_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AADHAAR_ENCRYPTION_KEY is not set; refusing to encrypt PII in production.");
    }
    console.warn(
      "[crypto] AADHAAR_ENCRYPTION_KEY is not set — using an INSECURE dev key. Set it before deploying."
    );
    return crypto.scryptSync("dev-insecure-aadhaar-key", "osf-aadhaar", 32);
  }
  return crypto.scryptSync(secret, "osf-aadhaar", 32);
}

export function encryptField(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function decryptField(value: unknown): string | null {
  if (!value || typeof value !== "string") return (value as string | null) ?? null;
  if (!value.startsWith(PREFIX)) return value; // legacy plaintext or unchanged
  try {
    const [, ivB64, tagB64, dataB64] = value.split(":");
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    // Wrong key or corrupted value — do not leak ciphertext.
    return null;
  }
}
