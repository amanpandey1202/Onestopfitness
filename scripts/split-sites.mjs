/**
 * split-sites.mjs
 * Generates two self-contained, independently-deployable Next.js apps from this
 * single source repo:
 *   - public-site/    → the alternative marketing site at "/"  (excludes app/frontend)
 *   - frontend-site/  → the MAIN marketing site at "/"          (excludes app/(public);
 *                        app/frontend is renamed to app/(frontend) so it serves at "/")
 *
 * Both folders keep their own copy of lib/, prisma/, components/, components-frontend/,
 * data/, config files, etc. (self-contained). The only thing excluded is the OTHER
 * marketing route group (+ its dedicated CSS), so each deployment serves one site.
 *
 * Run from the project root:  node scripts/split-sites.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const topExcludes = new Set([
  "node_modules",
  ".next",
  ".git",
  "scripts",
  "public-site",
  "frontend-site",
  "onestopfitness - Copy",
  ".env", // never copy live secrets; .env.example is copied as a file
]);

/** Rewrites /frontend/… , /frontend#… and "/frontend" (home) to root-based links,
 *  without touching @/components-frontend import paths. */
function rewriteFrontendLinks(content) {
  return content
    .replace(/(?<!@)"\/frontend\//g, '"/')
    .replace(/(?<!@)"\/frontend#/g, '"/#')
    .replace(/(?<!@)"\/frontend"/g, '"/"');
}

function makeCopier({ routeExclude, rename, transform }) {
  function copyEntry(src, dest) {
    const name = path.basename(src);
    const relPath = path.relative(ROOT, src);
    const normPath = relPath.split(path.sep).join("/"); // normalize for cross-platform checks
    const isTopLevel = normPath.split("/").length === 1;

    if (isTopLevel && topExcludes.has(name)) return;
    if (routeExclude && routeExclude(normPath)) return;

    const st = fs.statSync(src);
    if (st.isDirectory()) {
      for (const child of fs.readdirSync(src)) {
        copyEntry(path.join(src, child), path.join(dest, child));
      }
      return;
    }

    let destPath = dest;
    if (rename) destPath = rename(destPath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(src, destPath);

    if (transform && (destPath.endsWith(".ts") || destPath.endsWith(".tsx"))) {
      const original = fs.readFileSync(destPath, "utf8");
      const updated = transform(original);
      if (updated !== original) fs.writeFileSync(destPath, updated);
    }
  }
  return copyEntry;
}

function routeExcludeFor(prefix) {
  return (relPath) => relPath === prefix || relPath.startsWith(prefix + path.sep);
}

function renameFrontend(destPath) {
  return destPath.replace(/app[\\/]frontend/, "app/(frontend)");
}

// ---------------------------------------------------------------------------
// public-site  (alternative site — exclude app/frontend)
// ---------------------------------------------------------------------------
const publicCopier = makeCopier({
  routeExclude: routeExcludeFor("app/frontend"),
});
publicCopier(ROOT, path.join(ROOT, "public-site"));

// ---------------------------------------------------------------------------
// frontend-site (main site — exclude app/(public); rename app/frontend → app/(frontend))
// ---------------------------------------------------------------------------
const frontendCopier = makeCopier({
  routeExclude: routeExcludeFor("app/(public)"),
  rename: renameFrontend,
  transform: rewriteFrontendLinks,
});
frontendCopier(ROOT, path.join(ROOT, "frontend-site"));

console.log("✅ Generated public-site/ and frontend-site/");
console.log("   public-site   → serves app/(public) at /  (excludes app/frontend)");
console.log("   frontend-site → serves app/(frontend) at / (excludes app/(public))");
