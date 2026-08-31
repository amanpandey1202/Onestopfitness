# 🚀 Launch Guide — OneStopFitness

Everything you need to take the site from localhost to a real, live website —
including the database choice and the Airtable/Excel auto-sync.

---

## 1. The three things that change when you go live

| What | Now (local) | Live (recommended) |
|---|---|---|
| **Database** | SQLite file `prisma/dev.db` | Supabase (Postgres) |
| **File uploads** (photos, videos, banners) | Saved into `public/uploads/` on your PC | Cloud storage (Supabase Storage or Cloudflare R2) |
| **Hosting** | `npm run dev` on your PC | Vercel (or a small VPS / Docker) |

Everything else — the admin panel, member portals, gallery, WhatsApp buttons,
news slideshow — works exactly the same because the app reads from Prisma,
not from the filesystem directly.

---

## 2. Database: use **Supabase** (Postgres)

**Why Supabase?**
- Free tier with ~500 MB database — plenty for a gym's member list.
- Postgres is what Prisma is happiest with (SQLite → Postgres is a one-line change).
- Same company also gives you file storage (see §3), so one account covers both.
- Nothing to install, runs 24/7, automatic backups.

**Other good options:** Neon (serverless Postgres, also free), Railway, Render.
Avoid PlanetScale/MySQL unless you already use it — Postgres is smoother with Prisma.

### Steps
1. Create a free account at [supabase.com](https://supabase.com) → **New project**.
2. Copy the connection string:
   Dashboard → **Project Settings → Database → Connection string → URI**.
   It looks like `postgresql://postgres.xxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`.
3. In your project, change `.env`:
   ```
   DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-....supabase.com:5432/postgres?pgbouncer=true"
   ```
4. Load the existing data into it (run once, from your PC):
   ```
   npx prisma db push
   npx prisma db seed
   ```
5. Your local SQLite file stays untouched — you now have the same site running on a real database.

> Tip: keep a backup. Before going live, download your SQLite `prisma/dev.db` —
> it holds all your members, plans, testimonials, gallery, etc.

---

## 3. File uploads: move to cloud storage

Right now photos/videos are saved into `public/uploads/` on your computer. On
hosting like Vercel, that folder is **ephemeral** (files disappear on restart),
so uploads must go to cloud storage.

**Easiest: Supabase Storage** (same account as §2):
1. In Supabase → **Storage** → **New bucket** → name it `uploads`, make it **Public**.
2. I'll then add a `supabase` storage provider to the app (one small file,
   `lib/storage.ts`) — the code that uses uploads doesn't change.
3. Set these env vars:
   ```
   STORAGE_PROVIDER="supabase"
   SUPABASE_URL="https://xxxx.supabase.co"
   SUPABASE_SERVICE_KEY="your-service-role-key"   # Project Settings → API
   STORAGE_BUCKET="uploads"
   ```

**Alternative:** Cloudflare R2 (S3-compatible, very cheap) — same idea, I can wire it up.

---

## 4. Hosting: Vercel (recommended)

1. Push the project to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Import repository** → choose the repo.
3. Framework is detected automatically (**Next.js**).
4. Add the environment variables from `.env` (database URL, storage keys,
   Airtable keys, `NEXT_PUBLIC_SITE_URL=https://yoursite.vercel.app`).
5. Deploy. Every `git push` to the main branch redeploys automatically.

> Don't copy `SEED_ADMIN_PASSWORD` as-is in production — create a strong one
> and update your admin password after the first deploy.

---

## 5. Payments: how "paid members" work today + next step

**Today there is no online payment button.** Members pay you (cash / UPI) and you
record it by **Admin Panel → Members → + Add Member (with plan)** or **Assign**.
Every time you do that, a membership is created — and now (see §6) that same
moment can automatically add the person to your Airtable sheet.

**To let members pay online** (recommended for an Indian audience):
- **Razorpay** is the best fit (UPI/cards/netbanking, ₹ pricing, easy webhook).
- I can integrate it: a **Pay Now** button on the pricing page → Razorpay
  checkout → on successful payment, the membership is created **and** the member
  row is added to Airtable automatically. Ask me when you're ready for this step.

---

## 6. Airtable: auto-add paid members (already built in ✅)

The app now syncs to Airtable automatically whenever a membership is created.
**Excel files can't be auto-appendable** — Airtable is a cloud spreadsheet that
can, and it also exports to Excel any time. (Google Sheets is a good alternative.)

### Setup (one time)
1. Create a free [Airtable](https://airtable.com) account → **Create a base**.
2. Add a table named **Members** with these exact columns:
   `Name · Phone · Email · Plan · Amount · Start Date · End Date · Status`
3. Get your API key: Airtable → **Account → Generate personal access token**
   (scopes: `data.records:read/write`, `schema.bases:read`).
4. Copy these IDs from the base URL (e.g. `airtable.com/appAbC123/tblXYZ456`):
   - Base ID = `appAbC123`, Table ID = `tblXYZ456`
5. Set env vars:
   ```
   AIRTABLE_TOKEN="pat..."
   AIRTABLE_BASE_ID="appAbC123"
   AIRTABLE_TABLE_ID="tblXYZ456"
   ```

Now, every **Assign** or **+ Add Member (with plan)** in the admin panel
immediately appends that member to your Airtable table. If Airtable is down the
membership still saves — the sync never blocks a sale.

### Test it
```powershell
$env:AIRTABLE_TOKEN="pat..."; $env:AIRTABLE_BASE_ID="app..."; $env:AIRTABLE_TABLE_ID="tbl..."
npx tsx -e "import { syncMemberToAirtable } from './lib/airtable'; await syncMemberToAirtable({ name:'Test User', phone:'0000000000', email:'test@x.com', planName:'Monthly', amount:1500, startDate:new Date(), endDate:new Date(Date.now()+30*864e5) });"
```

---

## 7. Emails: password reset / verification — need your own domain (Resend)

**Already built in ✅** — the app sends welcome, expiry-reminder, password-reset
and email-verification emails. But live **delivery to members is blocked until
you own a verified domain** for sending.

### Status (Aug 2026)
- `RESEND_API_KEY` is set in `.env` (a send-only key — confirmed working ✓).
- Test send succeeded **only to `fgamers857@gmail.com`** (the Resend account's
  own inbox) because no domain is verified yet.
- Resend's free/test mode only delivers to the account owner's own address.
  Delivery to any *other* address (members, or `amanpandey8162@gmail.com`)
  returns `403 — domain not verified` until you finish the steps below.

### When you buy the domain / plan — do this
1. On your Domain provider (where you bought `onestopfit.in`), keep the DNS
   panel handy — you'll paste records there.
2. Go to **https://resend.com/domains** → **Add Domain** → enter `onestopfit.in`.
3. Resend shows 3 DNS records (SPF, DKIM + one verification record). Copy them
   into your domain's DNS settings at the domain provider.
4. Return to Resend → click **Verify**. Wait for status **Verified**.
5. Tell me — I'll re-run the test send to `amanpandey8162@gmail.com` and confirm.

### Also remember when going live
- `EMAIL_FROM` in `.env` is `ONE STOP FITNESS <noreply@onestopfit.in>` — uses the
  verified domain, so leave it.
- `NEXT_PUBLIC_SITE_URL` must be your **real live URL** (e.g.
  `https://onestopfit.in`), **not** `http://localhost:3000` — otherwise the
  reset/verification links in emails point to your laptop.

---

## 8. Env var checklist (final)

```
DATABASE_URL          → Supabase Postgres URI
NEXT_PUBLIC_SITE_URL  → https://yoursite.vercel.app
STORAGE_PROVIDER      → "supabase" (cloud) or "local" (VPS only)
SUPABASE_URL          → https://xxxx.supabase.co
SUPABASE_SERVICE_KEY  → service-role key
STORAGE_BUCKET        → "uploads"
AIRTABLE_TOKEN        → pat...
AIRTABLE_BASE_ID      → app...
AIRTABLE_TABLE_ID     → tbl...
RESEND_API_KEY        → re_... (already set ✓)
EMAIL_FROM            → ONE STOP FITNESS <noreply@onestopfit.in>
```

---

## 9. Go-live checklist

- [ ] Database on Supabase, `prisma db push` + `seed` run against it
- [ ] Admin can log in on the live site (change the default password first)
- [ ] Upload a banner + one photo in admin → shows on homepage
- [ ] Assign a test membership → row appears in Airtable
- [ ] `NEXT_PUBLIC_SITE_URL` set correctly (WhatsApp links, OG image)
- [ ] Verify `onestopfit.in` at **resend.com/domains** (see §7) so member emails deliver
- [ ] Send a test password-reset email to a real inbox and confirm it lands
- [ ] Backup `prisma/dev.db` saved somewhere safe
