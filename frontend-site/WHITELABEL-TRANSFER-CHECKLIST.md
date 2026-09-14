# Whitelabel / Pre-Sale Transfer Checklist — GYM BRAND → New Gym Owner

> Use this file **before** pitching or delivering the site to any gym owner
> other than GYM BRAND (Lucknow).
>
> The site reads from **three places**. You must clear **all three** or the old
> owner's details will leak:
> 1. **Static code files** (`data/*.ts`, `components/`, `components-frontend/`,
>    metadata, `lib/`, `middleware.ts`, `next.config.ts`)
> 2. **Database content** (seeded + admin-managed records)
> 3. **Media files** (`public/images/*`, `public/uploads/*`, favicon/logo)
>
> **Workflow:** clone the project → `git checkout -b whitelabel/<gym>` → run this
> checklist → build & verify on a staging URL → pitch with the staging link. One
> branch per gym keeps them cleanly separated.
>
> **Important:** `data/pricing.ts`, `data/trainers.ts`, `data/testimonials.ts`
> and `data/gallery.ts` were **deleted** — they were dead files never imported
> anywhere. Pricing, trainers, testimonials and gallery all come **live from the
> database**. Do not re-create these files.

---

## Phase 0 — Collect from the new owner (before starting)

Gather these; everything else in this file depends on them:

- [ ] Gym legal name / brand name + tagline
- [ ] Phone + WhatsApp number (mobile, with country code)
- [ ] Full address + Google Maps link (verify the pin actually points at the gym)
- [ ] Timings (open days + hours)
- [ ] Plan list: name, price (INR), duration, features
- [ ] Founder name, photo, bio, titles
- [ ] Trainer names, photos, bios, Instagram handles
- [ ] Email address(es) they can receive mail on + domain they own
- [ ] Instagram / Facebook URLs
- [ ] Real photos & videos (gym floor, equipment, classes, members **with consent**)
- [ ] Whether they have (or will create) a Razorpay merchant account
- [ ] Country/city for maps + SEO wording

---

## Phase 1 — Static code files (rebrand every string)

### 1.1 `data/site.ts` ← THE master branding file
| Field | Change to |
|---|---|
| `name` | Owner gym name |
| `tagline` | Owner tagline |
| `established` | Correct founding year (stats on homepage compute off this — watch the arithmetic) |
| `mission` | Owner mission |
| `phoneDisplay`, `phoneRaw` | Owner phone |
| `whatsappNumber` | **Owner WhatsApp (91 + number, no +)** — every CTA on the site uses this |
| `defaultWhatsAppMessage` | Replace "GYM BRAND" with owner name |
| `address` | Owner address |
| `mapsUrl`, `mapsEmbed` | Owner maps link (re-verify not hardcoded elsewhere — see §1.8) |
| `hours` | Owner timings |
| `email` | Owner email (currently `null` — fill it) |
| `instagram`, `instagramHandle`, `ownerInstagram` | Owner socials |
| `facebook` | Owner FB (currently `null`) |

### 1.2 FAQ — **TWO sources, both must change**
The homepage FAQ and the `/faq` page are **different data sources** and are
already out of sync. Update **both**:

- [ ] `data/faqs.ts` → feeds the **dedicated `/faq` page** only (via
  `components-frontend/FAQAccordion.frontend.tsx`). Q&A for location, timings,
  price amounts, personal-training areas (PCOD/thyroid list), martial arts,
  women, trial — all reflect **this gym** + correct prices.
- [ ] `app/(frontend)/FrontendPageClient.tsx` inline `faqs` array (line ~64) →
  feeds the **homepage** `#faq` section (4 items: hours, experience, trial,
  membership). Change these separately and keep them consistent with
  `data/faqs.ts`.

### 1.3 `data/services.ts`
- [ ] `groupClasses`, `personalTrainingAreas`, service descriptions/points — match what this gym actually offers.
- [ ] `app/(frontend)/FrontendPageClient.tsx` **inline `services` array (6 cards)** — titles/copy/tags MUST stay in sync with `data/services.ts`.

### 1.4 Pricing (DB only — static file deleted)
- [ ] Set owner's **real plans/prices in the admin panel → Plans**. The marketing page + pricing page read the **database**; keep `data/pricing.ts` **deleted** (do not re-create). Update `data/faqs.ts` price mentions to match.

### 1.5 Trainers & testimonials (DB only — static files deleted)
- [ ] **Trainers** — enter via admin panel (name, bio, photo, Instagram, founder flag + titles).
- [ ] **Testimonials** — via admin panel (real names + roles + quotes, owner-provided, with consent).
- [ ] Founder fallback paragraph in `FrontendPageClient.tsx` ("Deepak built GYM BRAND") — replace the name/text.

### 1.6 Gallery (DB only — static file deleted)
- [ ] Add real photos/videos via **admin → Gallery** (see Phase 3). Do **not** re-create `data/gallery.ts`.

### 1.7 Components — **TWO component sets, BOTH must change**
`components/` (admin/member/trainer/auth screens) **and** `components-frontend/`
(marketing pages) both contain hardcoded brand strings.

`components-frontend/` (marketing):
- [ ] `Header.frontend.tsx` — brand text "ONE STOP" + WhatsApp message ("Hi GYM BRAND, I'd like to join.")
- [ ] `Footer.frontend.tsx` — brand, "in Lucknow since", location blurb
- [ ] `ReplitHero.frontend.tsx` — "Lucknow's training ground · Est." and side note "Lucknow, India"
- [ ] `PricingCard.frontend.tsx` — pre-filled WhatsApp message
- [ ] `WhatsAppButton.frontend.tsx` / `WhatsAppFloat.frontend.tsx` — default messages
- [ ] `TestimonialForm.frontend.tsx` — "Hi GYM BRAND! …" message
- [ ] `FAQAccordion.frontend.tsx` — nothing owner-specific (brand comes from `data/faqs.ts`)
- [ ] Check `PageHero`, `SectionHeading`, `BMICalculator`, `Marquee`, `TrainerCarousel`, `GalleryGrid` for any owner-specific copy.

`components/` (auth + portals) — **shows on login/register screens that customers see first**:
- [ ] `auth/AuthSplit.tsx` — "GYM BRAND", "Lucknow's Premium Fitness Center", "Since 2002 · Lucknow", `© {year} GYM BRAND · Lucknow`
- [ ] `Header.tsx`, `Footer.tsx` — brand, "Since 2002 · Lucknow"
- [ ] `admin/AdminShell.tsx`, `member/MemberShell.tsx`, `trainer/TrainerShell.tsx` — brand in sidebars/footers
- [ ] `PayNowButton.tsx` — Razorpay checkout `name: "GYM BRAND"`, theme color
- [ ] `PricingCard.tsx` — pre-filled WhatsApp message
- [ ] `TestimonialForm.tsx` — "Hi GYM BRAND! …" message
- [ ] `FAQAccordion.tsx` — brand comes from `data/faqs.ts`

### 1.8 `app/(frontend)/FrontendPageClient.tsx` — the homepage
- [ ] Inline `services` array (6 cards) — titles/copy/tags/images
- [ ] Inline `classes` array (Zumba, Aerobics, …)
- [ ] Inline `faqs` array (**separate from `data/faqs.ts`** — keep both in sync)
- [ ] Hero fallback text "Be your best." + subtitle, kicker "Est. 2002"
- [ ] `stats-grid` (22 years / 06 days / 05 ways / 01 standard) — recompute year count
- [ ] Founder fallback paragraph mentioning "Deepak built GYM BRAND"
- [ ] Google Maps **embedded iframe** (hardcoded coords/place-id) — replace with this gym's embed
- [ ] WhatsApp message strings on every plan card + tour button
- [ ] **6 service-card images** `public/images/services/{group-class,personal-training,martial-arts,outdoor,nutrition-wellness,high-tech-equipment}/cover.jpg` — replace or delete as needed

### 1.9 Page metadata (browser tabs + Google)
- [ ] `app/layout.tsx` → `metadata`: title, description, keywords, `openGraph` → owner city/name
- [ ] `app/(frontend)/about/page.tsx`, `contact`, `faq`, `gallery`, `pricing`, `services` → `metadata` (each has "— GYM BRAND")
- [ ] `app/(auth)/register/page.tsx` subtitle "Join GYM BRAND —"
- [ ] `app/(auth)/login/page.tsx`, `app/(public)` too if ever re-generated from the split script
- [ ] Add `og:image`, `sitemap.ts`, `robots.ts` (currently none)

### 1.10 Email, payment & misc (brand in the copy)
- [ ] `lib/email.ts` — brand name, "Rajajipuram, Lucknow", phone, lime theme, `EMAIL_FROM` domain
- [ ] `components/PayNowButton.tsx` — Razorpay `name: "GYM BRAND"`, theme color
- [ ] `app/api/admin/broadcast/route.ts` — message templates contain "GYM BRAND"
- [ ] Any "GYM BRAND" text inside `app/member/*`, **receipt page** (`member/pay/success`), checkout texts
- [ ] `lib/constants.ts` — `osf_session` cookie name is fine to keep, but re-check no other hardcoded brand
- [ ] **`RAZORPAY_WEBHOOK_SECRET` must be identical in both `.env` copies** (currently they differ: one is whitespace, one has a value) — make both match the owner's Razorpay webhook secret.

### 1.11 `prisma/seed.ts` — demo accounts & demo data (CRITICAL)
- [ ] Delete/neutralise seed demo **users**: `admin@gymbrand.com` (Deepak), `member@gymbrand.com` (Demo@12345), `aamir@gymbrand.com` (Demo@12345)
- [ ] Reset `memberCode` prefixes (`OSF001`…) to the owner's code format
- [ ] Remove demo membership, demo diet plan, demo measurements, demo class timetable — or re-seed with the owner's own data
- [ ] Change `qr_token_*_seed` values; make sure real members get their own tokens

---

## Phase 2 — Database / Admin content (per owner, in their DB)

Do these via the **Admin Panel** (or edits + `prisma db push`/`db:seed` on a fresh DB):

- [ ] **Plans** — set owner's real plans/prices (marketing page + pricing page read DB; `data/pricing.ts` is deleted)
- [ ] **Banners** — one hero banner (headline + image)
- [ ] **Offers** — new discount offers (date-window aware)
- [ ] **Announcements** — add owner notices
- [ ] **Competitions** — create/publish real challenges
- [ ] **Testimonials** — real ones
- [ ] **Trainers** — real staff; founder flag + titles/note
- [ ] **Classes** — owner's real timetable (day/time/capacity/location/trainer)
- [ ] **Gallery** — real photos/videos via **Gallery** (see Phase 3)
- [ ] **Members** — delete demo `Demo Member`; import owner's real list from **Excel template** (`templates/member-import-template.xlsx`) via Admin → Members → Import
- [ ] **Memberships** — import/create real memberships so expiry reminders work from day 1
- [ ] Confirm no `Demo@12345`-style accounts exist on production

---

## Phase 3 — Media assets (gallery, images, logo)

Folder layout under `public/uploads/` (per media type): `trainers/`, `gallery/`, `offers/`, `competitions/`, `announcements/`, `banners/`, `testimonials/`.

- [ ] **Hero image** (owner gym photo) replacing `public/images/hero-bg.jpg`
- [ ] **Logo/favicon** — replace site icon/logo; check `public/` root, `<head>`, Header/Footer
- [ ] **Founder & trainer photos** — replace `public/images/founder.svg`, `trainer-1.svg`, `trainer-2.svg` and any photos in DB
- [ ] **Service-card images** — replace the 6 `public/images/services/*/cover.jpg` (homepage cards)
- [ ] **Gallery** — upload 8–15 real photos + 1–2 short videos (JPG/PNG/WebP ≤5 MB images; MP4/WebM ≤50 MB videos)
- [ ] **Offers/banners/competitions** — owner-branded images
- [ ] Remove/don't ship old owner's photos (privacy)
- [ ] Get **photo/video consent** from any member appearing in them

---

## Phase 4 — Keys & environment (`.env`) — never commit; one per owner

| Var | Value for new owner |
|---|---|
| `DATABASE_URL` | **Owner's own** Supabase/Postgres DB (fresh, empty) |
| `NEXT_PUBLIC_SITE_URL` | Owner's new domain |
| `SEED_ADMIN_NAME/EMAIL/PASSWORD` | Owner's first admin (strong password — seed refuses known defaults) |
| `AADHAAR_ENCRYPTION_KEY` | Generate new (`openssl rand -hex 32`) or Aadhaar writes will **crash in production** |
| `CRON_SECRET` | Generate new (session cleanup + auto-resume job) |
| `N8N_WEBHOOK_SECRET` | Generate new or disable the n8n endpoint |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | **Owner's Razorpay account**, not the current/test keys |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same as above |
| `RAZORPAY_WEBHOOK_SECRET` | Owner's razorpay webhook secret — **set identically in both `.env` copies** |
| `RESEND_API_KEY` | Owner's key + `EMAIL_FROM` on their domain |
| `GEMINI_API_KEY` | Owner's (optional, AI engagement) |
| `STORAGE_PROVIDER` | `supabase` in production (local disk is ephemeral on Vercel) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_STORAGE_BUCKET` | Owner's Supabase project + public `uploads` bucket |
| `AIRTABLE_TOKEN` / `AIRTABLE_BASE_ID` / `AIRTABLE_TABLE_ID` | Create a fresh Airtable base (or set their own) so paid members land in **their** sheet |
| **Rotate/delete** any leftover keys from the old owner | Especially old Razorpay & Airtable tokens |

**Also verify:**
- [ ] Both `.env` copies (`frontend-site` and `hostonvercel`) contain the **same** key values (they can drift — compare them).
- [ ] `STORAGE_PROVIDER="supabase"` is set — uploads then go to **Supabase cloud storage**, not Vercel's read-only disk (see note below).

> ⚠️ Before any repo is pushed/shared: confirm `.env*` (excluding `.env.example`) is
> ignored and was **never** committed (`git ls-files | findstr env`).

> **Storage note (don't repeat the old bug):** admin image **DELETE** endpoints now
> swallow `EROFS`/`ENOENT` and are wrapped with `.catch()` (lib/storage.ts +
> 5 admin DELETE routes). A fresh clone of this repo already includes that fix —
> do **not** revert it. For a new owner, delete/replace images only after
> re-pointing their DB rows at their Supabase URLs.

---

## Phase 5 — Global sweep for leftover branding

Run from `frontend-site/`:

```powershell
# ripgrep (fast), if installed:
rg -n -i "one stop|deepak|lucknow|rajajipuram|onestopfit|9236958881|onestopacademy|Admin@12345|Demo@12345|OSF001" app components components-frontend data lib prisma public middleware.ts next.config.ts --glob "!public/uploads/**"
```

Or PowerShell (covers the same dirs):

```powershell
Get-ChildItem app,components,components-frontend,data,lib,prisma -Recurse -Include *.ts,*.tsx,*.prisma |
  Select-String -Pattern "ONE STOP|Deepak|Lucknow|Rajajipuram|onestopfit|92369" |
  Select-Object Path,LineNumber,Line
```

Also check (not covered by the sweeps above):
- [ ] `middleware.ts` — path matchers reference `/admin`, `/member`, `/trainer` (no brand, but confirm)
- [ ] `next.config.ts` — no owner-specific strings (only `/uploads/:path*` caching + Supabase image host)
- [ ] Same sweep inside `public/` filenames (old logos/photos)
- [ ] Re-check **uploads** DB records point at the owner's storage, not `/uploads/…` from the old site

---

## Phase 5b — Cleanup before any clone/transfer (junk that ships by default)

These files contain old output/URLs and are **not** covered by the code sweep —
remove them per clone (or gitignore first):

- [ ] `dev.log`, `dev.err`, `dev-server.log`, `standalone-out.log` — dev logs with old URLs
- [ ] `scratch/*` — leftover debug scripts (e.g. `gallery_page_github.tsx` imports `@/data/site`)
- [ ] `unsuspend.js`, `_devtest.mjs` — one-off scripts
- [ ] Confirm the 4 dead data files stay deleted (`data/pricing.ts`, `data/trainers.ts`, `data/testimonials.ts`, `data/gallery.ts`)

---

## Phase 6 — Legal & compliance (before taking live money)

- [ ] **Privacy Policy** page (phone, health data, **Aadhaar** collection — explain why & consent)
- [ ] **Terms & Conditions** + **Refund/Cancellation policy** (Razorpay requires this for live payments)
- [ ] Data retention note + how owner exports/backups data
- [ ] India **DPDP Act** compliance note for Aadhaar + health data (collect minimum, encrypt, get consent)
- [ ] Add these links in the site footer

---

## Phase 7 — Verify before pitching

- [ ] `npm install`
- [ ] `npx prisma db push` + `npx prisma db seed` on the **new** owner DB
- [ ] `npx tsc --noEmit` — no type errors
- [ ] `npm run lint` — clean
- [ ] `npm run build` — production build succeeds
- [ ] **Search sweep** again after build — zero old-brand hits in code
- [ ] Manual flows on **staging**:
  - [ ] Admin login → add member → appears on dashboard
  - [ ] QR check-in works; duplicate-day check-in blocked; expired member blocked
  - [ ] Pricing page shows the DB plans; WhatsApp buttons open **owner's** number with pre-filled text
  - [ ] Payment with **Razorpay test key** → receipt page → membership created → row in **owner's** Airtable
  - [ ] Admin **uploads an image** and **deletes/replaces it** — no 500 on the delete
  - [ ] Broadcast segment lists members and produces WhatsApp links with owner's number
  - [ ] Map pin lands on the gym; hours/address/phone correct
  - [ ] Mobile view of homepage/ pricing/ gallery
- [ ] Screenshot evidence for your pitch

---

## Phase 8 — Handover to the owner (make them confident)

- [ ] Set their first admin account + strong password and **test login before handover**
- [ ] Give them `ADMIN-GUIDE.md` (already covers everything) + a 30-min walkthrough
- [ ] Show where to change: price (Plans), photo (Gallery), banner (Banners), offer (Offers)
- [ ] Explain WhatsApp broadcast & QR check-in live
- [ ] Save a **backup** of the DB + tell them the backup routine
- [ ] Provide the paid-members sync destination (their Airtable/Excel) and how to read it
- [ ] Note: **support window** & what counts as a change request

---

## Two ways to deploy per owner (pick one)

- **A — Per-owner clone (recommended today):** one copy + this checklist per gym, each with its own DB, domain and keys. Simple, isolated, easy to reason about.
- **B — Multi-tenant:** needs architecture work (a `gym`/`workspace` concept, per-gym branding in DB, subdomain routing). The hardcoded spots listed in Phases 1–3 are exactly what will need to become data-driven. Do this only when A proves demand.

---

## Quick "am I done?" test

1. `rg -n -i "one stop|deepak|lucknow|rajajipuram" app components components-frontend data lib prisma public middleware.ts next.config.ts --glob "!public/uploads/**"` → **zero** matches (docs/`*.md` don't count).
2. Logged-in homepage → shows **owner's** name, offer, banner, photo, price.
3. WhatsApp CTA → pre-filled message to **owner's** number.
4. Razorpay checkout popup → says **owner's** business name (check `PayNowButton.tsx`).
5. Airtable row on test payment → lands in **owner's** table.
6. No demo accounts can log in.
7. Admin can upload + delete a gallery image with no 500.
