import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// DB-safe replacement for Infinity
const ENTERPRISE_LIMIT = 1_000_000_000;

async function main() {
  console.log("🌱 Seeding plans...");

  // FREE PLAN
  await prisma.plan.upsert({
    where: { name: "FREE" },
    update: {},
    create: {
      name: "FREE",
      price: 0,
      interval: "monthly",
      requestLimit: 200,
    },
  });

  // PRO PLAN
  await prisma.plan.upsert({
    where: { name: "PRO" },
    update: {},
    create: {
      name: "PRO",
      price: 1999,
      interval: "monthly",
      requestLimit: 2000,
    },
  });

  // ENTERPRISE PLAN
  await prisma.plan.upsert({
    where: { name: "ENTERPRISE" },
    update: {},
    create: {
      name: "ENTERPRISE",
      price: 9999,
      interval: "monthly",
      requestLimit: ENTERPRISE_LIMIT,
    },
  });

  console.log("✅ Plans seeded successfully");
}

main()
  .catch((error) => {
    console.error("❌ Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
