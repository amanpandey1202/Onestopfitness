const { PrismaClient } = require("@prisma/client");

async function inspectCopyDb() {
  const p = new PrismaClient({ datasources: { db: { url: "file:C:/Users/AMAN/onestopfitness - Copy/prisma/dev.db" } } });
  console.log("\n========== ORIGINAL COPY DB - FULL RAW INSPECTION ==========\n");
  try {
    // Get ALL testimonials using raw SQL (bypassing schema diff)
    const testimonials = await p.$queryRawUnsafe("SELECT * FROM Testimonial;");
    console.log("TESTIMONIALS (" + testimonials.length + "):");
    testimonials.forEach(t => console.log(JSON.stringify(t)));

    // Get ALL gallery images
    const gallery = await p.$queryRawUnsafe("SELECT * FROM GalleryImage;");
    console.log("\nGALLERY (" + gallery.length + "):");
    gallery.forEach(g => console.log(JSON.stringify(g)));

    // Get ALL competitions
    const comps = await p.$queryRawUnsafe("SELECT * FROM Competition;");
    console.log("\nCOMPETITIONS (" + comps.length + "):");
    comps.forEach(c => console.log(JSON.stringify(c)));

    // Get ALL offers
    const offers = await p.$queryRawUnsafe("SELECT * FROM Offer;");
    console.log("\nOFFERS (" + offers.length + "):");
    offers.forEach(o => console.log(JSON.stringify(o)));

    // Get ALL banners
    const banners = await p.$queryRawUnsafe("SELECT * FROM Banner;");
    console.log("\nBANNERS (" + banners.length + "):");
    banners.forEach(b => console.log(JSON.stringify(b)));

    // Get ALL announcements
    const anns = await p.$queryRawUnsafe("SELECT * FROM Announcement;");
    console.log("\nANNOUNCEMENTS (" + anns.length + "):");
    anns.forEach(a => console.log(JSON.stringify(a)));

    // Get ALL plans
    const plans = await p.$queryRawUnsafe("SELECT * FROM MembershipPlan;");
    console.log("\nMEMBERSHIP PLANS (" + plans.length + "):");
    plans.forEach(pl => console.log(JSON.stringify(pl)));

    // Get ALL trainers
    const trainers = await p.$queryRawUnsafe("SELECT * FROM TrainerProfile;");
    console.log("\nTRAINER PROFILES (" + trainers.length + "):");
    trainers.forEach(t => console.log(JSON.stringify(t)));

    // Get column names from Testimonial table
    const cols = await p.$queryRawUnsafe("PRAGMA table_info(Testimonial);");
    console.log("\nTestimonial columns:", cols.map(c => c.name));

    // Get column names from GalleryImage table
    const galCols = await p.$queryRawUnsafe("PRAGMA table_info(GalleryImage);");
    console.log("GalleryImage columns:", galCols.map(c => c.name));

  } catch(e) {
    console.error("ERROR:", e.message);
  } finally {
    await p.$disconnect();
  }
}

inspectCopyDb();
