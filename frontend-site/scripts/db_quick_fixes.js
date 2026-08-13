const { PrismaClient } = require("@prisma/client");

async function fixDbs(url, label) {
  const p = new PrismaClient({ datasources: { db: { url } } });
  console.log("\n===", label, "===");
  try {
    await p.membershipPlan.update({ where: { id: "plan-weight" }, data: { name: "Weight Training", price: 1000 } });
    console.log("Fixed: Weight Training plan name & price");

    await p.announcement.update({ where: { id: "cmsoyw9910009uhv8psdvhzsx" }, data: { expiresAt: null } });
    console.log("Fixed: FOLLOW AMAN announcement expiry -> null");

    await p.membershipPlan.update({
      where: { id: "cmsq343lc0007uh5obftmrn7o" },
      data: { name: "Early Bird Special", description: "Special discounted plan for early joiners. Limited seats.", price: 500 }
    });
    console.log("Fixed: super saver -> Early Bird Special");

  } catch(e) {
    console.log("Error:", e.message);
  } finally {
    await p.$disconnect();
  }
}

async function run() {
  await fixDbs("file:C:/Users/AMAN/onestopfitness/frontend-site/prisma/dev.db", "frontend-site");
  await fixDbs("file:C:/Users/AMAN/onestopfitness/public-site/prisma/dev.db", "public-site");
}
run();
