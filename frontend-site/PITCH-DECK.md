# GYM BRAND — Client Pitch (Gym Owners)

> **What this is:** a ready-to-present overview of the product. Show the screens,
> then walk the 5-minute live demo (Section 8). Keep the demo on the **staging
> / demo site**, never on a live owner's production data.
>
> **Before pitching / transferring to any gym owner**, run through
> `WHITELABEL-TRANSFER-CHECKLIST.md` — it clears every old-owner string from
> code, database, media, env keys and deploy junk. One branch per gym
> (`whitelabel/<gym>`) keeps each handover clean and isolated.

---

## 1. The one-liner

> *"Your entire gym — website, members, renewals, payments and WhatsApp
> follow-ups — running on one platform you can operate from your phone. No
> engineers, no Excel, no paper registers."*

---

## 2. What the client gets (the whole package)

| Layer | What it is |
|---|---|
| **Marketing website** | Premium, mobile-first site for their gym — hompage, pricing, gallery, trainers, testimonials, FAQ, contact, WhatsApp everywhere |
| **Admin Panel** | Manage members, plans, prices, photos, offers, classes, trainers, announcements — all from the browser, changes go live instantly |
| **Member Portal** | Members log in, see their plan, check in by **QR code**, view workout/diet plans, measurements, book classes |
| **Online Payments** | Members renew online (UPI / cards / netbanking) via Razorpay — staff stop chasing renewals |
| **Retention Automation** | WhatsApp re-engagement (absentees & expiring), expiry reminders, Airtable/Excel records, membership freeze |
| **Accountability** | Audit log of every admin action, attendance records, revenue dashboard |
| **Cloud media storage** | Photos & videos live in the **gym owner's own Supabase storage bucket** — admin uploads/deletes never touch server disk (safe on Vercel's read-only filesystem) |

---

## 3. Marketing website — features to show

- **Admin-driven homepage** — hero banner, offers (with expiry dates), announcements ticker, all editable live; no code required.
- **Live pricing cards** — plans pulled straight from the admin panel (the database); change price today, site updates instantly.
- **WhatsApp-first conversion** — every "Join / Ask price / Book tour" button opens WhatsApp with a **pre-filled message about that exact plan**. Ideal for the Indian market.
- **Gallery with photos + videos** — sliding gallery, auto-rotates; the owner uploads real gym videos (up to 50 MB) to **their own Supabase storage**, not the server disk.
- **Trainers & founder section** — bios, photos, championships/titles, founder note.
- **Competitions / challenges** — members join from the homepage.
- **Testimonial carousel + FAQ + embedded Google Map + floating WhatsApp button.**
- **SEO-ready** — titles, descriptions, keywords per page (owner's city/name), presentable on Google.

---

## 4. Admin Panel (owner operations) — the strongest selling point

| Section | What the owner can do from it |
|---|---|
| **Dashboard** | Members count, check-ins today, revenue, memberships expiring soon |
| **Members** | Add walk-ins, assign/renew memberships, **suspend, freeze** (vacation mode), delete, search by name/phone/email |
| **Import / Export** | Add members in bulk from an **Excel template**; export the whole list to Excel anytime |
| **QR check-in** | Each member gets a unique QR — admin can reset it if lost/compromised |
| **Plans** | Create/edit price cards, hide or publish, set duration |
| **Gallery** | Photos **and videos**, drafts (upload but don't show yet) |
| **Banners / Offers** | Hero text + discount banners; offers show **Live / Scheduled / Ended** badges automatically |
| **Classes** | Weekly timetable with capacity; members book their spot |
| **Diet plans** | Per-member diet with meals, calories, macros |
| **Trainers** | Bios, photos, Instagram, founder flag + titles |
| **Testimonials / Announcements / Competitions** | All content-managed |
| **Broadcast (WhatsApp)** | Pick a segment — *all active / expiring in 7 or 14 days / absent 7 or 14 days / no membership* — generate a ready WhatsApp message per member (one-tap send) |
| **Analytics** | Engagement overview |
| **Audit Logs** | Every action recorded — who changed what, when |

> Even a non-technical owner runs the entire gym from this one panel.

---

## 5. Member portal (what members experience)

- Personal dashboard: **membership days left**, today's check-in status, body-measurement progress, competitions joined.
- **QR check-in** — member shows their QR (phone or printed card); staff scans with any camera; attendance logged; **one check-in per day**, automatically blocked once expired.
- Workout plans, diet plan, **body measurements** (weight, body-fat, waist, etc.), class bookings.
- Profile + **Pay / Renew online** with a proper payment receipt on success.

---

## 6. Payments — how money moves

- **Razorpay** (INR): UPI, cards, netbanking — the standard for Indian gyms.
- Payments are verified server-side (signature check) before access is granted.
- Auto **extends** an existing active membership or creates a fresh one for new/expired.
- Member is **auto-added to Airtable / Excel** the moment payment succeeds — the owner's record sheet stays up to date without manual typing.
- Test mode available for the owner to try the whole flow safely before going live.

---

## 7. Security, trust & compliance

- Passwords **hashed** (bcrypt); nobody can read them.
- Logins via secure HTTP-only cookies; every protected action is re-checked **server-side** (admin / trainer / member roles enforced) — not just hidden buttons.
- Sensitive data (e.g. **Aadhaar**) is encrypted before it is stored.
- File uploads are type-verified (real image/video magic bytes) and size-limited.
- Rate limiting on sensitive endpoints; audit trail for accountability.
- Regular backup story: the owner's data (members, payments, plans) is theirs and exportable.

---

## 8. 5-minute live demo script

1. **0–1 min — Website:** open homepage → click a plan → see the WhatsApp button with the pre-filled question. Show the gallery video and mobile view.
2. **1–2 min — Admin Panel:** log in → add a member with a plan in ~20 seconds → the dashboard numbers change instantly.
3. **2–3 min — QR check-in:** open the member's QR → scan with a phone camera → "Check-in successful, X days remaining" appears. Explain printed membership-card QR.
4. **3–4 min — Payments (test mode):** open pricing → pay with a **Razorpay test card** → success receipt page → the member row appears in **Airtable/Excel automatically**.
5. **4–5 min — Retention:** open Broadcast → select "Absent 14 days" → show the pre-written WhatsApp messages ready to send. Mention expiry reminders + freeze.

---

## 9. Objections — prepare answers

| They say | You answer |
|---|---|
| "We already use a register / Excel." | "Then you'll know what this saves: 30 seconds to find any member's history, auto-expiry warnings, and a public website your walk-ins trust." |
| "My staff don't use computers." | "The panel is like WhatsApp settings — if they can scroll a phone, they can add a member. I include staff training." |
| "Who owns the data?" | "You do — it's in your database and exportable to Excel anytime." |
| "Online payments sound risky." | "Payments are verified before access is granted; you can run it in test mode first, and your Razorpay dashboard shows every rupee." |
| "What if I need a change later?" | "Plans, prices, photos, offers — you change them yourself in the admin panel. Structural changes are a quick message away." |
| "Why does it stand out from a normal website?" | "Normal websites are brochures. This runs your operations: members, check-ins, renewals, WhatsApp follow-ups — it earns back its cost in renewal revenue." |

---

## 10. Things YOU should prepare before the pitch

- A **staging demo** preloaded with realistic (fake) members, a couple of plans, gallery photos, a banner and one challenge.
- Screenshots/recording of the 5-min flow in case live internet fails.
- A one-page **price/pricing sheet for your service** (setup fee, monthly, per-gym white-label).
- A short **onboarding promises** list: setup, data import from their Excel, staff walkthrough, WhatsApp number switch, backup.
- **Run `WHITELABEL-TRANSFER-CHECKLIST.md` end-to-end on the staging clone first** — it guarantees zero leaked old-owner branding, updated env keys, cleaned deploy junk, and a passing build (`tsc`, `lint`, `npm run build`). Save the passed "Quick am I done?" test as evidence.

_Keep this deck in sync with the product as features change._
