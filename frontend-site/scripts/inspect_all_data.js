const { PrismaClient } = require("@prisma/client");

async function inspectDb(dbUrl, label) {
  const p = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  console.log("\n\n========== " + label + " ==========\n");
  try {
    // Raw SQL to bypass schema version mismatches
    const tables = await p.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
    const tableNames = tables.map(t => t.name);
    console.log("TABLES:", tableNames);

    // Testimonials - raw SQL
    try {
      const testimonials = await p.$queryRawUnsafe("SELECT * FROM Testimonial;");
      console.log("\nTESTIMONIALS (" + testimonials.length + "):");
      testimonials.forEach(t => console.log(JSON.stringify(t)));
    } catch(e) { console.log("Testimonials error:", e.message); }

    // GalleryImage - raw SQL
    try {
      const gallery = await p.$queryRawUnsafe("SELECT * FROM GalleryImage;");
      console.log("\nGALLERY (" + gallery.length + "):");
      gallery.forEach(g => console.log(JSON.stringify(g)));
    } catch(e) { console.log("Gallery error:", e.message); }

    // Competitions
    try {
      const comps = await p.$queryRawUnsafe("SELECT * FROM Competition;");
      console.log("\nCOMPETITIONS (" + comps.length + "):");
      comps.forEach(c => console.log(JSON.stringify(c)));
    } catch(e) { console.log("Competition error:", e.message); }

    // Offer
    try {
      const offers = await p.$queryRawUnsafe("SELECT * FROM Offer;");
      console.log("\nOFFERS (" + offers.length + "):");
      offers.forEach(o => console.log(JSON.stringify(o)));
    } catch(e) { console.log("Offer error:", e.message); }

    // Banner
    try {
      const banners = await p.$queryRawUnsafe("SELECT * FROM Banner;");
      console.log("\nBANNERS (" + banners.length + "):");
      banners.forEach(b => console.log(JSON.stringify(b)));
    } catch(e) { console.log("Banner error:", e.message); }

    // MembershipPlan
    try {
      const plans = await p.$queryRawUnsafe("SELECT id, name, price, isActive FROM MembershipPlan;");
      console.log("\nPLANS (" + plans.length + "):");
      plans.forEach(pl => console.log(JSON.stringify(pl)));
    } catch(e) { console.log("Plans error:", e.message); }

    // Announcements
    try {
      const anns = await p.$queryRawUnsafe("SELECT * FROM Announcement;");
      console.log("\nANNOUNCEMENTS (" + anns.length + "):");
      anns.forEach(a => console.log(JSON.stringify(a)));
    } catch(e) { console.log("Announcement error:", e.message); }

  } catch(e) {
    console.log("ERROR:", e.message);
  } finally {
    await p.$disconnect();
  }
}

async function run() {
  await inspectDb("file:C:/Users/AMAN/onestopfitness - Copy/prisma/dev.db", "ORIGINAL COPY DB");
  await inspectDb("file:C:/Users/AMAN/onestopfitness/frontend-site/prisma/dev.db", "FRONTEND-SITE DB (CURRENT)");
}

run().catch(console.error);
