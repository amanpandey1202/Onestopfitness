const { PrismaClient } = require("@prisma/client");

async function migrateData(dbUrl) {
  const target = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  try {
    console.log("Migrating custom user uploaded data to:", dbUrl);

    // 1. Restore Trainers directly into target DB
    const customTrainers = [
      {
        id: "tp-rajan",
        userId: "user-rajan",
        userName: "Rajan Singh",
        userEmail: "rajan@onestopfit.in",
        specialization: "Fitness & Technique",
        bio: "Passionate about form, technique and pushing members past their limits — safely.",
        experience: 5,
        profileImageUrl: "/uploads/trainers/15d09ef8de2d4730e23fe2208583f15d.png",
        instagram: "@DEEPAKWINS",
      },
      {
        id: "cmsoz44tw000ruhv8y62ophw3",
        userId: "cmsoz44tw000quhv8cmoea3zo",
        userName: "AMAN PANDEY",
        userEmail: "aman@onestopfit.in",
        specialization: "ZUMBA TRAINING",
        bio: "HE IS A WELL KNOWN TRAINER IN HIS AREA",
        experience: 5,
        profileImageUrl: "/uploads/trainers/5c2d82caa3bc6fa046e334b947e16684.png",
        instagram: "@AMANOTIC",
      }
    ];

    for (const t of customTrainers) {
      // Upsert user first
      const u = await target.user.upsert({
        where: { id: t.userId },
        update: { name: t.userName },
        create: {
          id: t.userId,
          name: t.userName,
          email: t.userEmail,
          passwordHash: "$2a$10$wE4L...", // placeholder hash
          role: "TRAINER",
        },
      });

      await target.trainerProfile.upsert({
        where: { id: t.id },
        update: {
          specialization: t.specialization,
          bio: t.bio,
          experience: t.experience,
          profileImageUrl: t.profileImageUrl,
          instagram: t.instagram,
        },
        create: {
          id: t.id,
          userId: u.id,
          specialization: t.specialization,
          bio: t.bio,
          experience: t.experience,
          profileImageUrl: t.profileImageUrl,
          instagram: t.instagram,
          isFounder: false,
        },
      });
    }

    // 2. Restore Competitions / Campaigns
    const comps = [
      {
        id: "comp-30day",
        title: "30 Day Transformation Challenge",
        description: "Transform yourself in 30 days with guided training, diet support and weekly check-ins. Top transformers win prizes!",
        status: "PUBLISHED",
        maxParticipants: 50,
      },
      {
        id: "cmsozl77r001tuhv89gy8kl3u",
        title: "saaathi haath bdhaana",
        description: "NACH DE FIRRA",
        bannerUrl: "/uploads/competitions/23fd656cebfa3488043bb79ad6649bce.png",
        startDate: new Date("2026-08-15"),
        endDate: new Date("2027-08-05"),
        maxParticipants: 50,
        status: "PUBLISHED",
      }
    ];

    for (const c of comps) {
      await target.competition.upsert({
        where: { id: c.id },
        update: c,
        create: { ...c, createdById: "user-admin" },
      });
    }

    // 3. Restore Active Offers
    const offers = [
      {
        id: "offer-independence",
        title: "Independence Day Offer",
        description: "Flat 20% off on all 3-month memberships. Limited time — grab it before it's gone!",
        discountValue: 2000,
        discountType: "AMOUNT",
        imageUrl: "/uploads/offers/36fb00c59276f82ca23818e495453edb.png",
        startDate: new Date("2026-08-15"),
        endDate: new Date("2026-09-20"),
        isActive: true,
      },
      {
        id: "offer-combo",
        title: "Combo Plan Deal",
        description: "Cardio + Weight Training together at ₹2200/month — save ₹300 every month.",
        discountValue: 300,
        discountType: "AMOUNT",
        isActive: true,
      }
    ];

    for (const o of offers) {
      await target.offer.upsert({
        where: { id: o.id },
        update: o,
        create: { ...o, createdById: "user-admin" },
      });
    }

    // 4. Restore Custom Testimonials (including "amanji")
    const testimonials = [
      { id: "cmsp1rytg0002uhmcnxr3pjh9", name: "amanji", role: "GOOGLE REVIEW", quote: "AREEEE WAAAAHH JII", isPublished: true }
    ];

    for (const t of testimonials) {
      await target.testimonial.upsert({
        where: { id: t.id },
        update: t,
        create: t,
      });
    }

    // 5. Restore Plans (including "super saver")
    const plans = [
      {
        id: "cmsq343lc0007uh5obftmrn7o",
        name: "super saver",
        description: "save today only limited offer",
        price: 500,
        durationDays: 30,
        features: JSON.stringify(["gym music acccess"]),
        isActive: true,
      }
    ];

    for (const p of plans) {
      await target.membershipPlan.upsert({
        where: { id: p.id },
        update: p,
        create: p,
      });
    }

    console.log("✅ Restored custom user data successfully to:", dbUrl);
  } catch (e) {
    console.error("Migration error:", e);
  } finally {
    await target.$disconnect();
  }
}

async function run() {
  await migrateData("file:C:/Users/AMAN/onestopfitness/frontend-site/prisma/dev.db");
  await migrateData("file:C:/Users/AMAN/onestopfitness/public-site/prisma/dev.db");
}

run();
