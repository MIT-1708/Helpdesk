import prisma from '../src/prisma.js';
import * as dotenv from 'dotenv';

dotenv.config();

// Set flag to bypass sign-up disable check in auth.ts during seeding
process.env.BYPASS_DISABLE_SIGNUP = 'true';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD must be defined in your environment variables.');
  process.exit(1);
}

async function main() {
  console.log('Seeding database...');

  if (process.env.NODE_ENV === 'test' || process.env.DATABASE_URL?.includes('_test')) {
    console.log('Test database detected. Cleaning tables to ensure a fresh run...');
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
  }

  // Dynamically import auth to ensure process.env.BYPASS_DISABLE_SIGNUP is read correctly
  const { auth } = await import('../src/auth.js');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingAdmin) {
    console.log(`Creating admin user: ${email}`);
    const result = await auth.api.signUpEmail({
      body: {
        email: email!,
        password: password!,
        name: 'System Administrator',
        role: 'admin',
      },
    });
    console.log('Admin user seeded successfully:', result.user);
  } else {
    console.log(`Admin user with email ${email} already exists. Skipping.`);
  }

  // Check if agent already exists
  const agentEmail = 'agent@example.com';
  const existingAgent = await prisma.user.findUnique({
    where: { email: agentEmail },
  });

  if (!existingAgent) {
    console.log(`Creating agent user: ${agentEmail}`);
    const result = await auth.api.signUpEmail({
      body: {
        email: agentEmail,
        password: 'password123',
        name: 'Support Agent',
        role: 'agent',
      },
    });
    console.log('Agent user seeded successfully:', result.user);
  } else {
    console.log(`Agent user with email ${agentEmail} already exists. Skipping.`);
  }
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
