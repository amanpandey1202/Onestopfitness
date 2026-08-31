const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    const users = await prisma.user.findMany({
      select: { email: true, name: true, role: true, isActive: true },
      orderBy: { createdAt: "asc" },
    });
    console.log("Users in DB:");
    console.table(users);
    console.log("\nUsage: node unsuspend.js <email>");
    return;
  }

  const email = arg.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (!exists) {
    console.error(`No user with email '${email}'. Run without args to list users.`);
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { isActive: true },
  });
  console.log(`Reactivated: ${user.name} <${user.email}> (role=${user.role}, isActive=${user.isActive})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
