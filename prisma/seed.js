// prisma/seed.js
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ADMIN user only...");

  // ✅ Change these before running (do NOT reuse the old leaked password)
  const email = "dilerbarakad@gmail.com";
  const password = "CHANGE_THIS_TO_A_NEW_STRONG_PASSWORD";
  const name = "Admin User";

  const admin = await db.user.upsert({
    where: { email },
    update: {
      name,
      password,
      role: "admin",
    },
    create: {
      email,
      name,
      password,
      role: "admin",
      // theme will be default "light" from schema
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  console.log("✅ Admin ready:", admin);
  console.log("Admin Panel URL: /admin-portal-secure-2025-x7k9m2");
  console.log("Email:", email);
  console.log("Password:", password);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
