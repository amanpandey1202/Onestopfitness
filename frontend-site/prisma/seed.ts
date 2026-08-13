import { PrismaClient, Role, MembershipStatus, CompetitionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo@12345";

async function main() {
  const adminName = process.env.SEED_ADMIN_NAME || "Deepak";
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@onestopfit.in";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";

  const WEAK_ADMIN_PASSWORDS = ["Admin@12345", "Admin12345", "Password@123", "Demo@12345", "password", "admin"];
  if (!process.env.SEED_ADMIN_PASSWORD || WEAK_ADMIN_PASSWORDS.includes(adminPassword)) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is missing or uses a known default. Set a strong, unique admin password in your environment before seeding."
    );
  }

  console.log("Seeding database...");

  // -------------------------------------------------------------------------
  // Users: admin (founder), trainers, demo member
  // -------------------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      qrToken: "qr_token_admin_seed",
    },
    create: {
      id: "user-admin",
      name: adminName,
      email: adminEmail,
      memberCode: "OSF001",
      qrToken: "qr_token_admin_seed",
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: Role.ADMIN,
      phone: "092369 58881",
      trainerProfile: {
        create: {
          id: "tp-admin",
          specialization: "Founder & Head Trainer",
          bio: "Mr. Lucknow 2014 · Mr. UP 2025 · multiple fitness titles. The vision behind ONE STOP FITNESS.",
          experience: 20,
          profileImageUrl: "/images/founder.svg",
          instagram: "@deepakindia",
          isFounder: true,
          founderNote:
            "A fitness champion turned coach, I built ONE STOP FITNESS so Lucknow could train with purpose. Every title I won, I won on floors just like this one — now it's your turn.",
          founderTitles: JSON.stringify([
            "MR LUCKNOW 2014",
            "MR UP 2025",
            "FIT FACTOR 2016",
            "JERAI FITNESS MODEL 2016",
            "MR REGION 2016",
          ]),
        },
      },
    },
  });

  const aamir = await prisma.user.upsert({
    where: { email: "aamir@onestopfit.in" },
    update: { name: "Aamir Rizvi" },
    create: {
      id: "user-aamir",
      name: "Aamir Rizvi",
      email: "aamir@onestopfit.in",
      memberCode: "OSF002",
      qrToken: "qr_token_aamir_seed",
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      role: Role.TRAINER,
      trainerProfile: {
        create: {
          id: "tp-aamir",
          specialization: "Strength & Conditioning",
          bio: "Dedicated coach helping members build strength and confidence with every single session.",
          experience: 6,
          profileImageUrl: "/images/trainer-1.svg",
        },
      },
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@onestopfit.in" },
    update: { name: "Demo Member" },
    create: {
      id: "user-member",
      name: "Demo Member",
      email: "member@onestopfit.in",
      memberCode: "OSF003",
      qrToken: "qr_token_member_demo",
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      role: Role.MEMBER,
      memberProfile: {
        create: {
          id: "mp-demo",
          fitnessGoal: "Fat loss & strength",
          joiningDate: new Date("2026-06-01"),
          notes: "Seed demo member — log in to see the member dashboard.",
        },
      },
    },
  });

  // -------------------------------------------------------------------------
  // Membership plans
  // -------------------------------------------------------------------------
  const plans = [
    {
      id: "plan-weight",
      name: "Weight Training",
      description: "Strength & muscle building on the full gym floor.",
      price: 1000,
      durationDays: 30,
      features: ["Full gym floor access", "Strength & muscle building", "State-of-the-art equipment", "Expert trainer guidance"],
    },
    {
      id: "plan-cardio",
      name: "Cardio",
      description: "Fat loss & stamina with guided group sessions.",
      price: 1500,
      durationDays: 30,
      features: ["Treadmills, cycles & more", "Fat loss & stamina building", "Zumba · Spinning · Aerobics", "Guided group sessions"],
    },
    {
      id: "plan-combo",
      name: "Combo Plan",
      description: "Cardio + Weight Training together — best value.",
      price: 2200,
      durationDays: 30,
      features: ["Everything in Cardio", "Everything in Weight Training", "Full gym floor + group classes", "Save ₹300 every month"],
    },
  ];

  for (const plan of plans) {
    const record = { ...plan, features: JSON.stringify(plan.features) };
    await prisma.membershipPlan.upsert({
      where: { id: plan.id },
      update: record,
      create: record,
    });
  }

  // Active membership for the demo member
  await prisma.membership.upsert({
    where: { id: "mem-demo" },
    update: {},
    create: {
      id: "mem-demo",
      memberId: member.id,
      planId: "plan-combo",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-09-01"),
      status: MembershipStatus.ACTIVE,
    },
  });

  // -------------------------------------------------------------------------
  // Sample Body Measurements
  // -------------------------------------------------------------------------
  const measurements = [
    { recordedAt: new Date("2026-06-01"), weightKg: 82.5, bodyFatPct: 24.0, waistCm: 92, chestCm: 102, armCm: 34 },
    { recordedAt: new Date("2026-07-01"), weightKg: 79.8, bodyFatPct: 21.5, waistCm: 88, chestCm: 103, armCm: 35 },
    { recordedAt: new Date("2026-08-01"), weightKg: 77.2, bodyFatPct: 19.0, waistCm: 85, chestCm: 104, armCm: 36.5 },
  ];

  for (let i = 0; i < measurements.length; i++) {
    await prisma.bodyMeasurement.upsert({
      where: { id: `m-demo-${i}` },
      update: {},
      create: {
        id: `m-demo-${i}`,
        memberId: member.id,
        recordedBy: admin.id,
        ...measurements[i],
      },
    });
  }

  // -------------------------------------------------------------------------
  // Sample Diet Plan
  // -------------------------------------------------------------------------
  await prisma.dietPlan.upsert({
    where: { id: "diet-demo" },
    update: {},
    create: {
      id: "diet-demo",
      memberId: member.id,
      trainerId: aamir.id,
      title: "2000 kcal Lean Fat Loss Plan",
      goal: "Fat Loss & Muscle Retention",
      calorieTarget: 2000,
      proteinGm: 160,
      carbsGm: 180,
      fatGm: 60,
      meals: {
        create: [
          { mealName: "Breakfast", timing: "08:00 AM", items: JSON.stringify([{ name: "Oats with Skimmed Milk", quantity: "60g" }, { name: "Boiled Eggs", quantity: "4 whole" }]), calories: 450, orderIndex: 0 },
          { mealName: "Lunch", timing: "01:30 PM", items: JSON.stringify([{ name: "Grilled Chicken Breast / Tofu", quantity: "150g" }, { name: "Brown Rice", quantity: "1 cup" }, { name: "Green Salad", quantity: "1 bowl" }]), calories: 550, orderIndex: 1 },
          { mealName: "Pre-Workout Snack", timing: "05:30 PM", items: JSON.stringify([{ name: "Banana", quantity: "1 medium" }, { name: "Black Coffee", quantity: "1 cup" }]), calories: 120, orderIndex: 2 },
          { mealName: "Post-Workout", timing: "07:30 PM", items: JSON.stringify([{ name: "Whey Protein Shake", quantity: "1 scoop in water" }]), calories: 130, orderIndex: 3 },
          { mealName: "Dinner", timing: "09:00 PM", items: JSON.stringify([{ name: "Paneer/Fish Curry", quantity: "150g" }, { name: "Roti", quantity: "2 pcs" }]), calories: 500, orderIndex: 4 },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Sample Class Timetable
  // -------------------------------------------------------------------------
  const classes = [
    { id: "cls-zumba-mon", name: "Zumba Energy", dayOfWeek: 1, startTime: "07:00", endTime: "08:00", maxCapacity: 25, location: "Main Studio" },
    { id: "cls-yoga-tue", name: "Hatha Yoga", dayOfWeek: 2, startTime: "06:30", endTime: "07:30", maxCapacity: 20, location: "Yoga Room" },
    { id: "cls-spin-wed", name: "Spinning Cardio", dayOfWeek: 3, startTime: "18:00", endTime: "19:00", maxCapacity: 15, location: "Cardio Studio" },
    { id: "cls-martial-thu", name: "Martial Arts & Self Defence", dayOfWeek: 4, startTime: "19:00", endTime: "20:00", maxCapacity: 20, location: "Martial Ring" },
    { id: "cls-zumba-sat", name: "Zumba Weekend Special", dayOfWeek: 6, startTime: "08:00", endTime: "09:00", maxCapacity: 30, location: "Main Studio" },
  ];

  for (const cls of classes) {
    await prisma.classSchedule.upsert({
      where: { id: cls.id },
      update: cls,
      create: cls,
    });
  }

  console.log("✅ Seed complete with all features!");
  console.log("   Admin login :", adminEmail, "/", adminPassword);
  console.log("   Member login: member@onestopfit.in /", DEMO_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
