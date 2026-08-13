const { PrismaClient } = require("@prisma/client");

async function syncExcelPayments(dbUrl, label) {
  const p = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  console.log("\n===", label, "===");

  try {
    // Find all memberships without an associated payment
    const memberships = await p.membership.findMany({
      include: { plan: true, member: true },
    });

    console.log(`Found ${memberships.length} memberships. Checking for associated payments...`);
    let createdCount = 0;

    for (const m of memberships) {
      const existingPayment = await p.payment.findFirst({
        where: { membershipId: m.id },
      });

      if (!existingPayment && m.plan) {
        const orderId = `excel_${m.memberId.slice(-6)}_${m.id.slice(-6)}`;
        const paymentId = `pay_excel_${m.id.slice(-6)}`;

        await p.payment.create({
          data: {
            orderId,
            paymentId,
            amount: m.plan.price,
            currency: "INR",
            status: "PAID",
            method: "EXCEL_IMPORT",
            memberId: m.memberId,
            planId: m.planId,
            membershipId: m.id,
            paidAt: m.startDate,
            createdAt: m.createdAt,
          },
        });
        createdCount++;
      }
    }

    console.log(`✅ Synced ${createdCount} missing payment records from imported memberships.`);

    // Check total revenue now
    const totalRev = await p.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    });
    console.log(`📊 Total Recorded Revenue (PAID): ₹${(totalRev._sum.amount ?? 0).toLocaleString("en-IN")}`);

  } catch (e) {
    console.error("ERROR:", e.message);
  } finally {
    await p.$disconnect();
  }
}

async function run() {
  await syncExcelPayments("file:C:/Users/AMAN/onestopfitness/frontend-site/prisma/dev.db", "FRONTEND-SITE");
  await syncExcelPayments("file:C:/Users/AMAN/onestopfitness/public-site/prisma/dev.db", "PUBLIC-SITE");
}

run().catch(console.error);
