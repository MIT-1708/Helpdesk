import prisma from "../src/prisma.js";
import dotenv from "dotenv";
import { Role } from "@prisma/client";

dotenv.config();

// Set flag to bypass sign-up disable check in auth.ts during seeding
process.env.BYPASS_DISABLE_SIGNUP = "true";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("Error: ADMIN_EMAIL and ADMIN_PASSWORD must be defined in your environment variables.");
  process.exit(1);
}

async function main() {
  console.log("Seeding database...");

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log(`Admin user with email ${email} already exists. Skipping.`);
    return;
  }

  console.log(`Creating admin user: ${email}`);

  // Dynamically import auth to ensure process.env.BYPASS_DISABLE_SIGNUP is read correctly
  const { auth } = await import("../src/auth.js");

  // Create the admin user using Better Auth programmatic API
  const result = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: "System Administrator",
      role: Role.admin,
    },
  });

  console.log("Admin user seeded successfully:", result.user);
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
