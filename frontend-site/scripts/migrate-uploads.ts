/**
 * One-time script: upload every existing local image (public/uploads/**) to
 * Supabase Storage and rewrite the database rows that reference it.
 *
 * Prerequisites (one time):
 *   1. SUPABASE_SERVICE_ROLE_KEY set in .env (Supabase Dashboard →
 *      Project Settings → API → service_role, the secret one).
 *   2. Run:  npm run storage:migrate
 *
 * Safety handles:
 *   - Creates the bucket first (public read), idempotent.
 *   - Skips rows whose file is missing on disk (logs them).
 *   - Never deletes local files or image rows — the script only adds.
 *   - Re-runnable: rows already pointing at Supabase URLs are skipped.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { SupabaseStorage, supabaseUrl, supabaseBucket } from "../lib/storage";

const prisma = new PrismaClient();

// Every table + column that can hold an uploaded image URL.
// { storagePublicId } must mirror an optional per-row storage id column.
const MODEL_COLUMNS: { model: string; column: string; storageIdColumn?: string }[] = [
  { model: "galleryImage", column: "imageUrl", storageIdColumn: "storagePublicId" },
  { model: "banner", column: "imageUrl" },
  { model: "offer", column: "imageUrl" },
  { model: "competition", column: "bannerUrl" },
  { model: "announcement", column: "imageUrl" },
  { model: "testimonial", column: "imageUrl" },
  { model: "user", column: "profileImageUrl" },
  { model: "trainerProfile", column: "profileImageUrl" },
];

const LOCAL_ROOT = path.join(process.cwd(), "public", "uploads");

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` };
}

async function ensureBucket(): Promise<void> {
  const url = supabaseUrl();
  const bucket = supabaseBucket();
  const listRes = await fetch(`${url}/storage/v1/bucket`, { headers: authHeaders() });
  if (!listRes.ok) {
    throw new Error(`Cannot list buckets (${listRes.status}): ${(await listRes.text()).slice(0, 300)}`);
  }
  const buckets = (await listRes.json()) as { id: string; public: boolean }[];
  const existing = buckets.find((b) => b.id === bucket);

  if (existing) {
    if (existing.public) {
      console.log(`Bucket "${bucket}" already public — nothing to do.`);
    } else {
      const res = await fetch(`${url}/storage/v1/bucket/${bucket}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ public: true }),
      });
      if (!res.ok) throw new Error(`Cannot make bucket public (${res.status}): ${(await res.text()).slice(0, 300)}`);
      console.log(`Bucket "${bucket}" made public.`);
    }
    return;
  }

  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ id: bucket, name: bucket, public: true }),
  });
  if (!res.ok) {
    throw new Error(`Cannot create bucket (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  console.log(`Bucket "${bucket}" created (public read, admin write).`);
}

async function main(): Promise<void> {
  const url = supabaseUrl();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Set SUPABASE_SERVICE_ROLE_KEY in .env first (Supabase Dashboard → Settings → API).");
  }

  await ensureBucket();
  const storage = new SupabaseStorage();

  let uploaded = 0;
  let skipped = 0;
  let missing = 0;
  let unchanged = 0;

  for (const { model, column, storageIdColumn } of MODEL_COLUMNS) {
    const db = prisma[model as keyof PrismaClient] as any;
    const rows = (await db.findMany({ where: { [column]: { startsWith: "/uploads/" } } })) as {
      id: string;
      [key: string]: string | null | undefined;
    }[];
    if (rows.length === 0) continue;

    for (const row of rows) {
      const localUrl = row[column] as string;
      const publicId = localUrl.slice("/uploads/".length);
      const localFile = path.join(LOCAL_ROOT, publicId);

      if (!fs.existsSync(localFile)) {
        missing++;
        console.log(`  [!] MISSING on disk, left as-is: ${model} ${row.id} → ${localUrl}`);
        continue;
      }

      try {
        const buffer = fs.readFileSync(localFile);
        const originalName = path.basename(localFile);
        const folder = path.dirname(publicId);
        const stored = await storage.save(buffer, originalName, folder === "." ? "misc" : folder);

        const data: Record<string, string> = { [column]: stored.url };
        if (storageIdColumn) data[storageIdColumn] = stored.publicId;
        await db.update({ where: { id: row.id }, data });

        uploaded++;
        console.log(`  ✓ ${model} ${row.id}: ${localUrl} → ${stored.url}`);
      } catch (err) {
        skipped++;
        console.error(`  ✗ FAILED ${model} ${row.id} (${localUrl}): ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  console.log("");
  console.log(`Storage URL used:  ${url}/storage/v1/object/public/${supabaseBucket()}/…`);
  console.log(`Summary: ${uploaded} uploaded · ${unchanged} unchanged · ${missing} missing on disk · ${skipped} failed.`);
  console.log("");
  console.log("Local files were NOT deleted (safe to clear public/uploads after a visual check).");
  console.log("Then set STORAGE_PROVIDER=\"supabase\" in .env for new uploads to go to the cloud.");
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());