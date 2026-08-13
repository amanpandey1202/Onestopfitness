const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seed() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const adminId = admin ? admin.id : "user-admin";

  // 1. Gallery
  const galleryItems = [
    { id: "g-members", title: "Our Members", description: "The ONE STOP FITNESS family.", imageUrl: "/images/gallery/members.svg", isPublished: true, createdById: adminId },
    { id: "g-martial", title: "Martial Arts Training", description: "Discipline meets fitness.", imageUrl: "/images/gallery/martial-arts.svg", isPublished: true, createdById: adminId },
    { id: "g-equipment", title: "High-Tech Equipment", description: "Modern machines for every goal.", imageUrl: "/images/gallery/equipment.svg", isPublished: true, createdById: adminId },
    { id: "g-yoga", title: "Yoga Session Space", description: "Find your balance.", imageUrl: "/images/gallery/yoga.svg", isPublished: true, createdById: adminId },
    { id: "g-outdoor", title: "Outdoor Sitting Area", description: "Fresh air, good vibes.", imageUrl: "/images/gallery/outdoor.svg", isPublished: true, createdById: adminId },
    { id: "g-workout", title: "Workout Area", description: "Strength zone with high-tech equipment.", imageUrl: "/images/gallery/workout-area.svg", isPublished: true, createdById: adminId },
    { id: "g-group", title: "Group Classes Area", description: "Where the energy happens.", imageUrl: "/images/gallery/group-class.svg", isPublished: true, createdById: adminId },
    { id: "g-reception", title: "Reception & Welcome Desk", description: "Your first stop at ONE STOP FITNESS.", imageUrl: "/images/gallery/reception.svg", isPublished: true, createdById: adminId }
  ];

  for (const item of galleryItems) {
    await prisma.galleryImage.upsert({ where: { id: item.id }, update: item, create: item });
  }

  // 2. Testimonials
  const testimonials = [
    { id: "t-1", name: "Shoeb Aslam Khan", role: "Google review", quote: "Best gym in Rajajipuram. Trainers are very supportive and the equipment is brand new. I lost 8 kgs in 3 months here!", isPublished: true },
    { id: "t-2", name: "Deepika Srivastava", role: "Google review", quote: "I've been a member for over a year and the commitment to every member is unmatched. The trainers personally track your progress.", isPublished: true },
    { id: "t-3", name: "Mohd. Izhaar", role: "Google review", quote: "Training here is a fantastic experience. The energy and support from the community are incredible. Highly recommended.", isPublished: true },
    { id: "t-4", name: "Saif Ali", role: "Google review", quote: "More than just a gym - it's a family. Morning batch feels like a group of friends pushing each other every single day.", isPublished: true },
    { id: "t-5", name: "Priyanka Verma", role: "Google review", quote: "Joined the cardio + Zumba batch and the difference in my stamina is amazing. Clean, safe and the ladies timing is very convenient.", isPublished: true },
    { id: "t-6", name: "Rahul Gupta", role: "Google review", quote: "Sir's personal attention is what sets this place apart. My posture and back pain are finally getting better with the PT sessions.", isPublished: true },
    { id: "t-7", name: "Aman Khan", role: "Google review", quote: "Affordable pricing, best equipment and the martial arts classes are a bonus. Took my self-defence seriously from day one.", isPublished: true },
    { id: "t-8", name: "Nikhil Srivastava", role: "Google review", quote: "Tried many gyms in Lucknow, this one actually works. The trainers correct your form, the diet advice is practical, results show.", isPublished: true }
  ];

  for (const t of testimonials) {
    await prisma.testimonial.upsert({ where: { id: t.id }, update: t, create: t });
  }

  // 3. Membership Plans
  const plans = [
    { id: "plan-weight", name: "Weight Training", description: "Strength & muscle building on the full gym floor.", price: 1000, durationDays: 30, features: JSON.stringify(["Full gym floor access", "Strength & muscle building", "State-of-the-art equipment", "Expert trainer guidance"]), isActive: true },
    { id: "plan-cardio", name: "Cardio", description: "Fat loss & stamina with guided group sessions.", price: 1500, durationDays: 30, features: JSON.stringify(["Treadmills, cycles & more", "Fat loss & stamina building", "Zumba · Spinning · Aerobics", "Guided group sessions"]), isActive: true },
    { id: "plan-combo", name: "Combo Plan", description: "Cardio + Weight Training together — best value.", price: 2200, durationDays: 30, features: JSON.stringify(["Everything in Cardio", "Everything in Weight Training", "Full gym floor + group classes", "Save ₹300 every month"]), isActive: true }
  ];

  for (const p of plans) {
    await prisma.membershipPlan.upsert({ where: { id: p.id }, update: p, create: p });
  }

  console.log("✅ Seeded gallery, testimonials, and plans!");
}

seed().catch(console.error).finally(() => prisma.$disconnect());
