/**
 * One-time migration: re-encrypt existing Aadhaar values stored under the old
 * dev key with the real key in .env (AADHAAR_ENCRYPTION_KEY).
 *
 * Run BEFORE restarting the production server the first time with a real key:
 *   npm run aadhaar:rekey
 *
 * Values already encrypted with the current key are left untouched.
 */
import "dotenv/config";
import crypto from "node:crypto";
import { prisma } from "../lib/db";

const ALGO = "aes-256-gcm";
const PREFIX = "enc:v1:";
const SALT = "osf-aadhaar";

function keyFor(secret: string): Buffer {
  return crypto.scryptSync(secret, SALT, 32);
}

const oldKey = keyFor("dev-insecure-aadhaar-key");
const newKey = process.env.AADHAAR_ENCRYPTION_KEY
  ? keyFor(process.env.AADHAAR_ENCRYPTION_KEY)
  : null;

if (!newKey) {
  console.error("AADHAAR_ENCRYPTION_KEY is not set in .env — nothing to migrate to.");
  process.exit(1);
}

function decryptWith(value: string, key: Buffer): string | null {
  if (!value.startsWith(PREFIX)) return value;
  try {
    const parts = value.split(":");
    const ivB64 = parts[2];
    const tagB64 = parts[3];
    const dataB64 = parts[4];
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const out = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]);
    return out.toString("utf8");
  } catch {
    return null;
  }
}

function encryptWith(plain: string, key: Buffer): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return PREFIX + [iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(":");
}

async function main() {
  const profiles = await prisma.memberProfile.findMany({
    select: { userId: true, aadhaarNumber: true },
    where: { aadhaarNumber: { startsWith: PREFIX } },
  });

  console.log(`Found ${profiles.length} encrypted Aadhaar value(s) to examine.`);

  let migrated = 0;
  let alreadyCurrent = 0;
  let failed: string[] = [];

  for (const p of profiles) {
    const v = p.aadhaarNumber;
    const plain = decryptWith(v, oldKey) ?? decryptWith(v as string, newKey);
    if (plain === null) {
      failed.push(p.userId);
      continue;
    }
    // Plaintext or already encrypted with the current key → skip.
    if (!v.startsWith(PREFIX) || decryptWith(v, newKey) === plain) {
      alreadyCurrent++;
      continue;
    }
    await prisma.memberProfile.update({
      where: { userId: p.userId },
      data: { aadhaarNumber: encryptWith(plain, newKey) },
    });
    migrated++;
  }

  console.log(`Migrated: ${migrated} | Already current: ${alreadyCurrent} | Failed: ${failed.length}`);
  if (failed.length) console.log("Failed userIds:", failed.join(", "));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});