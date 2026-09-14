// Start the standalone production server (node .next/standalone/server.js).
//
// `next start` does not work when `output: "standalone"` is set in
// next.config.ts. This script:
//   1. copies .next/static into .next/standalone/.next/static (standalone does
//      not include the hashed JS/CSS chunks; without them pages render blank),
//   2. launches the standalone server with inherited env/stdio.

import { cpSync, existsSync, rmSync, symlinkSync, readFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();

// Load .env from the project root before spawning (Next's standalone server
// does not reliably load it itself). Existing shell/PM2 env vars win over the
// file, so panel-configured secrets are never overwritten.
try {
  const envFile = resolve(root, ".env");
  if (existsSync(envFile)) {
    for (const raw of readFileSync(envFile, "utf8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      const rawVal = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      // Don't override vars already present in the environment (e.g. PM2).
      if (key && process.env[key] === undefined) process.env[key] = rawVal;
    }
  }
} catch (err) {
  console.warn("Warning: could not read .env:", err?.message ?? err);
}

const standaloneDir = resolve(root, ".next/standalone");
const server = resolve(standaloneDir, "server.js");

if (!existsSync(server)) {
  console.error("Standalone server not found. Run `npm run build` first.");
  process.exit(1);
}

const staticSrc = resolve(root, ".next/static");
const staticDest = resolve(standaloneDir, ".next/static");

if (existsSync(staticSrc)) {
  cpSync(staticSrc, staticDest, { recursive: true });
  console.log(`Copied .next/static -> ${staticDest}`);
} else {
  console.warn("Warning: .next/static not found; skipping copy.");
}

// The standalone server serves `/images`, `/uploads`, etc. from its own
// `public` dir (NOT the project root's), so link the real one. A junction on
// Windows (no admin rights needed) / symlink elsewhere keeps freshly-uploaded
// files immediately visible instead of a stale one-time copy.
const publicSrc = resolve(root, "public");
const publicDest = resolve(standaloneDir, "public");

if (existsSync(publicSrc)) {
  // After `next build` the standalone dir contains a partial `public/` (only
  // uploads). A real junction to root `public/` is visible because it shows
  // root-public's `images/` — so check for that and replace stale copies.
  if (existsSync(publicDest)) {
    if (!existsSync(resolve(publicDest, "images"))) {
      rmSync(publicDest, { recursive: true, force: true });
      console.log("Removed stale public/ (not a junction to root)");
    }
  }
  if (!existsSync(publicDest)) {
    let linked = false;
    if (process.platform === "win32") {
      const r = spawnSync("cmd", ["/c", "mklink", "/J", publicDest, publicSrc], { stdio: "pipe" });
      linked = r.status === 0;
      if (!linked) console.warn(r.stdout?.toString() ?? "mklink failed");
    } else {
      try {
        symlinkSync(publicSrc, publicDest, "dir");
        linked = true;
      } catch {
        // fall back to a copy
      }
    }
    if (linked) {
      console.log(`Linked public -> ${publicDest}`);
    } else {
      cpSync(publicSrc, publicDest, { recursive: true });
      console.log(`Copied public -> ${publicDest} (uploads made after start won't appear)`);
    }
  }
} else {
  console.warn("Warning: public/ not found; skipping link.");
}

console.log(`Starting ${server}`);
const child = spawn(process.execPath, [server], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 1));