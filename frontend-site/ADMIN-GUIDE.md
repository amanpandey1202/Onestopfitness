# GYM BRAND — Owner's Guide

This is your management platform. **You no longer need to edit code to change
prices, photos, banners, offers, or trainers** — everything happens in the
**Admin Panel** at `/admin`, and changes appear on the public site instantly.

---

## 🔐 1. First Login

1. Start the site (see [Run Locally](#-run-locally) below, or open your deployed URL).
2. Go to **`/admin/login`**.
3. Sign in with your admin account:

   | Field    | Default value          |
   | -------- | ---------------------- |
   | Email    | `admin@gymbrand.com`  |
   | Password | `Admin@12345`          |

   ⚠️ **Change this password before real use** — register a new admin or ask a
   developer to set a strong one. The seed values live in `.env`
   (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

The Admin Panel has 9 sections (sidebar on the left):

| Section       | What it controls                                             |
| ------------- | ------------------------------------------------------------ |
| **Dashboard** | At-a-glance: members, check-ins today, revenue, expiries     |
| **Members**   | Add members, assign/renew memberships, suspend, delete       |
| **Trainers**  | Manage the coaching team, bios, photos, founder flag         |
| **Plans**     | Pricing cards shown on the site (Cardio, Weight, Combo…)     |
| **Gallery**   | Photos **and videos** on the public gallery page |
| **Banners**   | The big hero text on the homepage                            |
| **Offers**    | Discount banners on the homepage                             |
| **Competitions** | Challenges members can join                              |
| **Announcements** | Short notices at the top of the homepage                  |
| **Audit Logs** | Every admin action, recorded for accountability              |

---

## 🖼️ 2. Add Gallery Photos & Videos

1. Open **Admin Panel → Gallery**.
2. Click **+ Add Photo/Video**.
3. Pick **Photo** or **Video**, then upload:
   - **Photos** — JPG/PNG/WebP/GIF, up to 5 MB.
   - **Videos** — MP4/WebM/MOV, up to 50 MB.
4. Give it a title, optionally a description.
5. Keep **"Publish to public gallery"** on, then **Add Media**.

Everything appears on the homepage and `/gallery` immediately — the gallery
**auto-rotates through all photos and videos** (you can also use the arrows,
dots, or thumbnail strip to browse). Use **Draft** to upload without showing it yet.

---

## 💰 3. Change Prices / Plans

**Admin Panel → Plans.**

- Click **+ Add Plan** to create a new one (e.g. "Quarterly Combo").
- Click **Edit** on a plan to change its name, price, duration, or features.
- **Hide / Publish** toggles whether the plan is shown on the public site.
- Deleting a plan is permanent — only delete ones with no memberships.

> The homepage shows the 3 cheapest active plans; the pricing page shows all.

---

## 📢 4. Banners, Offers, Competitions, Announcements

- **Banners** (`/admin/banners`) — the first *published* banner drives the
  homepage hero (headline + optional CTA button).
- **Offers** (`/admin/offers`) — percentage or flat-₹ discounts with optional
  start/end dates. Only active offers in their date window are shown, so an
  offer with a **future start date stays hidden** from the public site until
  that day. In the admin list each offer shows a **Live / Scheduled / Ended**
  badge so you always know when it will appear.
- **Competitions** (`/admin/competitions`) — set title, dates, max participants,
  and **Published** status. Members join from the homepage and see it in their
  dashboard.
- **Announcements** (`/admin/announcements`) — short notices; the two most
  recent published ones show at the top of the homepage.

---

## 👥 5. Members & Memberships

**Admin Panel → Members.**

- **+ Add Member** — create an account for a walk-in (you set a temporary
  password). If you pick a *Starting plan*, a membership is created
  automatically from today.
- **Assign** on a member row → choose a plan + start date. The end date is
  computed from the plan's duration (renewal = just assign again).
- **Suspend / Activate** pauses or restores access.
- **Delete** removes the member permanently (use carefully).
- The **search box** filters by name, email, or phone.

---

## 👥 6. Trainer & Member Portals

- **Member Portal** (`/member`) — members log in to:
  - See their membership status + days remaining.
  - **Check in** each day (attendance is recorded).
  - View their workout plan, joined challenges, and edit their profile.
- **Trainer Portal** (`/trainer`) — trainers log in to see their profile and the
  workout plans they've created.

---

## ⚙️ 7. Run Locally

```bash
npm install
# copy .env.example to .env and fill it in
npm run db:push     # create the database tables
npm run db:seed     # demo admin/trainer/member + content
npm run dev         # http://localhost:3000
```

If port 3000 is busy, use a different port: `npm run dev -- -p 3100`.

---

## 🚀 8. Deploy

- **Database:** the project runs on **SQLite locally** (a file, no setup).
  For production, create a **Postgres** database and change `DATABASE_URL`
  in your hosting environment (the schema is already Postgres-compatible), then
  run `prisma db push` and `prisma db seed` once. Recommended: **Supabase**
  (free tier, auto-backups — member data survives any server change).
- **Storage:** default `STORAGE_PROVIDER=local` writes images to
  `public/uploads` on the machine (fine for dev). For production set
  `STORAGE_PROVIDER="supabase"` so uploads live in **Supabase Storage**
  (1GB free, CDN-hosted, survives your laptop disc dying). Setup:
  1. Add `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API → `service_role`)
     to `.env`, plus `SUPABASE_URL` and `SUPABASE_STORAGE_BUCKET` (default `uploads`).
  2. Run `npm run storage:migrate` once to upload existing local images and
     rewrite the database URLs.
  3. Flip `STORAGE_PROVIDER="supabase"` in `.env`.
- **Vercel:** connect the repo, set `DATABASE_URL`, `SEED_*`, and
  `STORAGE_PROVIDER` in Project Settings → Environment Variables, and deploy.
  The admin and member portals are included — just visit `/admin`.

---

## 🔒 9. Security Notes

- Passwords are hashed (bcrypt); nobody — including you — can see them.
- Sessions are stored in the database with secure HTTP-only cookies.
- `middleware.ts` only *redirects* logged-out users; every API route re-checks
  permissions server-side, so direct requests to protected endpoints are blocked.
- Admin audit logs record who did what — check **Audit Logs** if anything looks off.

---

## 🛠 10. Useful Commands

| Command                 | What it does                             |
| ----------------------- | ---------------------------------------- |
| `npm run db:push`       | Apply schema changes to the database     |
| `npm run db:seed`       | Reset demo data (safe to re-run)         |
| `npm run db:studio`     | Open the database visually (Prisma Studio) |
| `npm run build`         | Production build / check for errors      |
| `npx tsc --noEmit`      | Type-check the whole project             |
