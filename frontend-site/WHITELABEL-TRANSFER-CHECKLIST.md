# Whitelabel / Pre-Sale Transfer Checklist — ONE STOP FITNESS → New Gym Owner

> Use this file **before** pitching or delivering the site to any gym owner
> other than ONE STOP FITNESS (Lucknow).
>
> The site reads from **three places**. You must clear **all three** or the old
> owner's details will leak:
> 1. **Static code files** (`data/*.ts`, components, metadata, templates)
> 2. **Database content** (seeded + admin-managed records)
> 3. **Media files** (`public/images/*`, `public/uploads/*`, favicon/logo)
>
> **Workflow:** clone the project → `git checkout -b whitelabel/<gym>` → run this
> checklist → build & verify on a staging URL → pitch with the staging link. One
> branch per gym keeps them cleanly separated.

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
| `defaultWhatsAppMessage` | Replace "ONE STOP FITNESS" with owner name |
| `address` | Owner address |
| `mapsUrl`, `mapsEmbed` | Owner maps link (re-verify not hardcoded elsewhere — see §1.7) |
| `hours` | Owner timings |
| `email` | Owner email (currently `null` — fill it) |
| `instagram`, `instagramHandle`, `ownerInstagram` | Owner socials |
| `facebook` | Owner FB (currently `null`) |

### 1.2 `data/faqs.ts`
- [ ] Q&A for location, timings, price amounts, personal-training areas (PCOD/thyroid list), martial arts, women, trial — all reflect **this gym** + correct prices.

### 1.3 `data/services.ts`
- [ ] `groupClasses`, `personalTrainingAreas`, service descriptions/points — match what this gym actually offers.

### 1.4 `data/pricing.ts` (static fallback plans)
- [ ] Prices, names, notes, and text inside each plan's `message` (WhatsApp pre-fill says "ONE STOP FITNESS … ₹X"). Note: live pricing on the site comes from the **database** (admin → Plans) — set both, keep them identical.

### 1.5 `data/trainers.ts` + `data/testimonials.ts`
- [ ] Founder name/role/instagram/image/titles/note.
- [ ] Trainer names/bios/images/Instagram.
- [ ] Testimonials: real names + roles + quotes (owner-provided, with consent).

### 1.6 `data/gallery.ts` (static fallback SVGs)
- [ ] Replace placeholder `/images/gallery/*.svg` captions or delete file if DB gallery is populated (real photos via admin).

### 1.7 `components-frontend/` — hardcoded strings
- [ ] `Header.frontend.tsx` — brand text "ONE STOP" + WhatsApp message ("Hi ONE STOP FITNESS, I'd like to join.")
- [ ] `Footer.frontend.tsx` — brand, "in Lucknow since", location blurb
- [ ] `ReplitHero.frontend.tsx` — "Lucknow's training ground · Est." and side note "Lucknow, India"
- [ ] `PricingCard.frontend.tsx` — pre-filled WhatsApp message
- [ ] `WhatsAppButton.frontend.tsx` / `WhatsAppFloat.frontend.tsx` — default messages
- [ ] `TestimonialForm.frontend.tsx` — "Hi ONE STOP FITNESS! …" message
- [ ] Check `PageHero`, `SectionHeading`, `BMICalculator`, `Marquee`, `TrainerCarousel`, `GalleryGrid` for any owner-specific copy.

### 1.8 `app/(frontend)/FrontendPageClient.tsx` — the homepage
- [ ] Inline `services` array (6 cards) — titles/copy/tags/images
- [ ] Inline `classes` array (Zumba, Aerobics, …)
- [ ] Inline `faqs` array (duplicated here — keep in sync with `data/faqs.ts`)
- [ ] Hero fallback text "Be your best." + subtitle, kicker "Est. 2002"
- [ ] `stats-grid` (22 years / 06 days / 05 ways / 01 standard) — recompute year count
- [ ] Founder fallback paragraph mentioning "Deepak built ONE STOP FITNESS"
- [ ] Google Maps **embedded iframe** (hardcoded coords/place-id) — replace with this gym's embed
- [ ] WhatsApp message strings on every plan card + tour button

### 1.9 Page metadata (browser tabs + Google)
- [ ] `app/layout.tsx` → `metadata`: title, description, keywords, `openGraph` → owner city/name
- [ ] `app/(frontend)/about/page.tsx`, `contact`, `faq`, `gallery`, `pricing`, `services` → `metadata` (each has "— ONE STOP FITNESS")
- [ ] `app/(auth)/register/page.tsx` subtitle "Join ONE STOP FITNESS —"
- [ ] `app/(auth)/login/page.tsx`, `app/(public)` too if ever re-generated from the split script
- [ ] Add `og:image`, `sitemap.ts`, `robots.ts` (currently none)

### 1.10 Email & payment templates (brand in the copy)
- [ ] `lib/email.ts` — brand name, "Rajajipuram, Lucknow", phone, lime theme, `EMAIL_FROM` domain
- [ ] `components/PayNowButton.tsx` — Razorpay `name: "ONE STOP FITNESS"`, theme color
- [ ] `app/api/admin/broadcast/route.ts` — message templates contain "ONE STOP FITNESS"
- [ ] Any "ONE STOP FITNESS" text inside `app/member/*`, **receipt page** (`member/pay/success`), checkout texts

### 1.11 `prisma/seed.ts` — demo accounts & demo data (CRITICAL)
- [ ] Delete/neutralise seed demo **users**: `admin@onestopfit.in` (Deepak), `member@onestopfit.in` (Demo@12345), `aamir@onestopfit.in` (Demo@12345)
- [ ] Reset `memberCode` prefixes (`OSF001`…) to the owner's code format
- [ ] Remove demo membership, demo diet plan, demo measurements, demo class timetable — or re-seed with the owner's own data
- [ ] Change `qr_token_*_seed` values; make sure real members get their own tokens

---

## Phase 2 — Database / Admin content (per owner, in their DB)

Do these via the **Admin Panel** (or edits + `prisma db push`/`db:seed` on a fresh DB):

- [ ] **Plans** — set owner's real plans/prices (marketing page + pricing page read DB; keep `data/pricing.ts` identical)
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
| `RESEND_API_KEY` | Owner's key + `EMAIL_FROM` on their domain (or leave blank; emails are optional) |
| `GEMINI_API_KEY` | Owner's (optional, AI engagement) |
| `STORAGE_PROVIDER` | `supabase` in production (local disk is ephemeral on Vercel) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` / `STORAGE_BUCKET` | Owner's Supabase project + public `uploads` bucket |
| `AIRTABLE_TOKEN` / `AIRTABLE_BASE_ID` / `AIRTABLE_TABLE_ID` | Create a fresh Airtable base (or set their own) so paid members land in **their** sheet |
| **Rotate/delete** any leftover keys from the old owner | Especially old Razorpay & Airtable tokens |

> ⚠️ Before any repo is pushed/shared: confirm `.env*` (excluding `.env.example`) is
> ignored and was **never** committed (`git ls-files | findstr env`).

---

## Phase 5 — Global sweep for leftover branding

Run from `frontend-site/`:

```powershell
# ripgrep (fast), if installed:
rg -n -i "one stop|deepak|lucknow|rajajipuram|onestopfit|9236958881|onestopacademy|Admin@12345|Demo@12345|OSF001" app components components-frontend data lib prisma public --glob "!public/uploads/**"
```

Or PowerShell:

```powershell
Get-ChildItem app,components,components-frontend,data,lib,prisma -Recurse -Include *.ts,*.tsx,*.prisma |
  Select-String -Pattern "ONE STOP|Deepak|Lucknow|Rajajipuram|onestopfit|92369" |
  Select-Object Path,LineNumber,Line
```

- [ ] Replace every match with owner details
- [ ] Same sweep inside `public/` filenames (old logos/photos)
- [ ] Re-check **uploads** DB records point at the owner's storage, not `/uploads/…` from the old site

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
- [ ] **Search sweep** again after build — zero old-brand hits
- [ ] Manual flows on **staging**:
  - [ ] Admin login → add member → appears on dashboard
  - [ ] QR check-in works; duplicate-day check-in blocked; expired member blocked
  - [ ] Pricing page shows the DB plans; WhatsApp buttons open **owner's** number with pre-filled text
  - [ ] Payment with **Razorpay test key** → receipt page → membership created → row in **owner's** Airtable
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

1. `rg -n -i "one stop|deepak|lucknow" .` → only this checklist file matches.
2. Logged-in homepage → shows **owner's** name, offer, banner, photo, price.
3. WhatsApp CTA → pre-filled message to **owner's** number.
4. Razorpay checkout soft/blank → says **owner's** business name.
5. Airtable row on test payment → lands in **owner's** table.
6. No demo accounts can log in.