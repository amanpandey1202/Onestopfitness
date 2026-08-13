const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient({ datasources: { db: { url: "file:C:/Users/AMAN/onestopfitness/frontend-site/prisma/dev.db" } } });

async function test() {
  const member = await p.user.findFirst({ where: { role: "MEMBER" } });
  console.log("Member found:", member.email, member.id);

  const plan = await p.membershipPlan.findFirst({ where: { isActive: true } });
  console.log("Plan found:", plan.name, plan.price, plan.id);

  const payment = await p.payment.create({
    data: {
      orderId: "order_test_demo_" + Date.now(),
      amount: plan.price,
      currency: "INR",
      status: "CREATED",
      method: "TEST_MODE",
      memberId: member.id,
      planId: plan.id,
    }
  });
  console.log("Payment created:", payment.id);

  const updatedPay = await p.payment.update({
    where: { id: payment.id },
    data: { status: "PAID", paidAt: new Date() }
  });
  console.log("Payment updated to PAID:", updatedPay.id);
}

test().catch(console.error).finally(() => p.$disconnect());
