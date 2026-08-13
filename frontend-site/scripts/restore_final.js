const { PrismaClient } = require("@prisma/client");

async function restoreEverything(dbUrl, label) {
  const p = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  console.log("\n===", label, "===");

  try {
    // ─── 1. ANNOUNCEMENTS ────────────────────────────────────────────────────
    const announcements = [
      {
        id: "anno-1",
        title: "New Martial Arts batches",
        body: "New Martial Arts batches start every Monday. All skill levels welcome — talk to the front desk to book your slot.",
        isPublished: true,
        publishAt: new Date("2026-08-11T16:40:28.116Z"),
        createdById: "user-admin",
      },
      {
        id: "cmsoyw9910009uhv8psdvhzsx",
        title: "FOLLOW AMAN",
        body: "WHOSE SO EVER IS GOING TO FOLLOW @AMANOTIC I AM GOING TO GIVE A FOLLOW BACK\n",
        imageUrl: "/uploads/announcements/34484d9df183674a004fe93bd274cc65.png",
        isPublished: true,
        publishAt: new Date("2026-08-11T18:01:55.670Z"),
        expiresAt: new Date("2001-02-12T00:00:00.000Z"),
        createdById: "user-admin",
      },
    ];
    for (const a of announcements) {
      const { createdById, ...upd } = a;
      await p.announcement.upsert({
        where: { id: a.id },
        update: upd,
        create: a,
      }).catch(e => console.log("Ann error:", a.title, e.message));
    }
    console.log("✅ Announcements:", announcements.length);

    // ─── 2. REAL GALLERY PHOTOS (all 9 uploaded by user in frontend-site) ────
    const galleryPhotos = [
      { id: "g-real-1", title: "Gym Training Session", description: "Real training action at ONE STOP FITNESS.", imageUrl: "/uploads/gallery/d773f7484daa1bdee760671bee26f99b.png" },
      { id: "g-real-2", title: "Members Workout", description: "Members pushing their limits.", imageUrl: "/uploads/gallery/f0f924260aa253aba8dd9ec4da898ab8.jpeg" },
      { id: "g-real-3", title: "Gym Floor Activity", description: "Live action on the gym floor.", imageUrl: "/uploads/gallery/83766a039e18d0cb70bc5fbc05e00a40.png" },
      { id: "g-real-4", title: "Training Highlights", description: "Highlights from ONE STOP FITNESS.", imageUrl: "/uploads/gallery/b46a08ecaf40fe18ae41ef3401fffa65.png" },
      { id: "g-real-5", title: "Fitness at ONE STOP", description: "Members in action.", imageUrl: "/uploads/gallery/44702e03a441ecb62ebf3c8510006dbf.jpg" },
      { id: "g-real-6", title: "Workout Power", description: "Strength training session.", imageUrl: "/uploads/gallery/539c04d4420d54ac4d0064c74489c218.png" },
      { id: "g-real-7", title: "Group Energy", description: "Group class energy.", imageUrl: "/uploads/gallery/569a8c016fe9e3d51905178958935438.png" },
      { id: "g-real-8", title: "Gym Lifestyle", description: "Lifestyle at ONE STOP FITNESS.", imageUrl: "/uploads/gallery/6c62a075ea130b2d026660612a3f40c1.jpg" },
      { id: "g-real-9", title: "Saturday Sessions", description: "The weekend grind never stops.", imageUrl: "/uploads/gallery/b7ee8cf7fb24f258fdced56db32806ef.jpg" },
    ];
    for (const g of galleryPhotos) {
      await p.galleryImage.upsert({
        where: { id: g.id },
        update: { ...g, isPublished: true },
        create: { ...g, isPublished: true, createdById: "user-admin" },
      }).catch(e => console.log("Gallery error:", g.title, e.message));
    }
    console.log("✅ Real gallery photos:", galleryPhotos.length);

    // ─── 3. SPIDERMAN TESTIMONIAL (with uploaded image) ──────────────────────
    // The image file exists at: /uploads/testimonials/02fdc4deca46312a359d8b839c7b70a2.jpg
    // The testimonial was added via admin panel but DB record was lost during folder split
    await p.testimonial.upsert({
      where: { id: "spiderman-testimonial" },
      update: {
        name: "Spiderman",
        role: "Marvel Member",
        quote: "WOOHOO! Even superheroes need a gym, and ONE STOP FITNESS is the one! Best training in Lucknow!",
        imageUrl: "/uploads/testimonials/02fdc4deca46312a359d8b839c7b70a2.jpg",
        isPublished: true,
      },
      create: {
        id: "spiderman-testimonial",
        name: "Spiderman",
        role: "Marvel Member",
        quote: "WOOHOO! Even superheroes need a gym, and ONE STOP FITNESS is the one! Best training in Lucknow!",
        imageUrl: "/uploads/testimonials/02fdc4deca46312a359d8b839c7b70a2.jpg",
        isPublished: true,
      },
    }).catch(e => console.log("Spiderman error:", e.message));
    console.log("✅ Spiderman testimonial (with image) restored");

    // ─── 4. UPDATE 30-DAY CHALLENGE with banner image ────────────────────────
    // The screenshot the user uploaded as 30-day challenge banner
    await p.competition.update({
      where: { id: "comp-30day" },
      data: { bannerUrl: "/uploads/competitions/12b65ef5d120e58520090f85c3a9f71b.png" },
    }).catch(e => console.log("30-day comp banner error:", e.message));
    console.log("✅ 30-Day Challenge banner restored");

    // ─── 5. ADD SECOND OFFER (with large uploaded image) ─────────────────────
    // Two offer images exist in frontend-site: 1f7629... (3.8MB) and 2609389... (438KB)
    await p.offer.upsert({
      where: { id: "offer-featured" },
      update: {
        title: "Featured Offer",
        description: "Limited time special offer — join today and save big on your membership!",
        discountValue: 500,
        discountType: "AMOUNT",
        imageUrl: "/uploads/offers/1f7629936494b16e311c2a64599b6bb1.jpg",
        isActive: true,
      },
      create: {
        id: "offer-featured",
        title: "Featured Offer",
        description: "Limited time special offer — join today and save big on your membership!",
        discountValue: 500,
        discountType: "AMOUNT",
        imageUrl: "/uploads/offers/1f7629936494b16e311c2a64599b6bb1.jpg",
        isActive: true,
        createdById: "user-admin",
      },
    }).catch(e => console.log("Featured offer error:", e.message));
    console.log("✅ Second offer with image restored");

    // ─── 6. TRAINER PHOTOS (real uploaded images) ────────────────────────────
    await p.trainerProfile.update({
      where: { id: "tp-admin" },
      data: { profileImageUrl: "/uploads/trainers/83be5c8aa463cff3a29a0537e6f9cf51.png" },
    }).catch(e => console.log("Admin trainer photo:", e.message));

    await p.trainerProfile.update({
      where: { id: "tp-aamir" },
      data: { profileImageUrl: "/uploads/trainers/9570afa65d61389ae3d4b519eadee537.png" },
    }).catch(e => console.log("Aamir trainer photo:", e.message));

    await p.trainerProfile.update({
      where: { id: "tp-rajan" },
      data: { profileImageUrl: "/uploads/trainers/15d09ef8de2d4730e23fe2208583f15d.png" },
    }).catch(e => console.log("Rajan trainer photo:", e.message));
    console.log("✅ Trainer photos updated to real uploads");

    // ─── FINAL COUNTS ─────────────────────────────────────────────────────────
    const [t, g, c, o, a, pl] = await Promise.all([
      p.$queryRawUnsafe("SELECT COUNT(*) as c FROM Testimonial;"),
      p.$queryRawUnsafe("SELECT COUNT(*) as c FROM GalleryImage;"),
      p.$queryRawUnsafe("SELECT COUNT(*) as c FROM Competition;"),
      p.$queryRawUnsafe("SELECT COUNT(*) as c FROM Offer;"),
      p.$queryRawUnsafe("SELECT COUNT(*) as c FROM Announcement;"),
      p.$queryRawUnsafe("SELECT COUNT(*) as c FROM MembershipPlan;"),
    ]);
    console.log("\n📊 FINAL COUNTS:");
    console.log("   Testimonials:", Number(t[0].c));
    console.log("   Gallery images:", Number(g[0].c));
    console.log("   Competitions:", Number(c[0].c));
    console.log("   Offers:", Number(o[0].c));
    console.log("   Announcements:", Number(a[0].c));
    console.log("   Plans:", Number(pl[0].c));

  } catch(e) {
    console.error("ERROR:", e.message);
  } finally {
    await p.$disconnect();
  }
}

async function run() {
  await restoreEverything("file:C:/Users/AMAN/onestopfitness/frontend-site/prisma/dev.db", "FRONTEND-SITE");
  await restoreEverything("file:C:/Users/AMAN/onestopfitness/public-site/prisma/dev.db", "PUBLIC-SITE");
}

run().catch(console.error);
