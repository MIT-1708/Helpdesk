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

const ticketTemplates = [
  {
    subject: "Refund request for Course 101",
    body: "Hello, I dropped the course within the refund period and would like to request a full refund.",
    category: "REFUND" as const,
    status: "open" as const,
    senderName: "Alice Smith",
    senderEmail: "alice.smith@example.com"
  },
  {
    subject: "Cannot login to database server",
    body: "I am getting ETIMEDOUT when trying to connect to the PostgreSQL server. Please check my credentials.",
    category: "TECHNICAL" as const,
    status: "open" as const,
    senderName: "John Doe",
    senderEmail: "john.doe@example.com"
  },
  {
    subject: "Syllabus request for Advanced Python",
    body: "Could you please send me the syllabus for the Advanced Python course? I want to prepare beforehand.",
    category: "GENERAL" as const,
    status: "resolved" as const,
    senderName: "Emily Watson",
    senderEmail: "emily.w@example.com"
  },
  {
    subject: "React component render looping",
    body: "My page freezes because of an infinite render loop in my React useEffect hook. Need assistance debugging.",
    category: "TECHNICAL" as const,
    status: "open" as const,
    senderName: "Bob Johnson",
    senderEmail: "bob.j@example.com"
  },
  {
    subject: "Grading discrepancy in Quiz 3",
    body: "I believe question 5 was marked incorrectly. My answer matches the textbook explanation perfectly.",
    category: "GENERAL" as const,
    status: "closed" as const,
    senderName: "David Miller",
    senderEmail: "david.m@example.com"
  },
  {
    subject: "Video buffering issues on Lesson 4",
    body: "The lecture video stops playing every 10 seconds. My internet speed is fine, other videos load perfectly.",
    category: "TECHNICAL" as const,
    status: "resolved" as const,
    senderName: "Sophia Martinez",
    senderEmail: "sophia.m@example.com"
  },
  {
    subject: "Refund query for dropped seminar",
    body: "I dropped the seminar last week but haven't seen the credit back on my account. When will it clear?",
    category: "REFUND" as const,
    status: "open" as const,
    senderName: "James Wilson",
    senderEmail: "james.w@example.com"
  },
  {
    subject: "Unable to submit assignment via portal",
    body: "The submit button is disabled even though the file is within the 10MB size limit. Help!",
    category: "TECHNICAL" as const,
    status: "open" as const,
    senderName: "Isabella Garcia",
    senderEmail: "isabella.g@example.com"
  },
  {
    subject: "Request to audit next semester class",
    body: "Are we allowed to audit the Machine Learning class without registering? Who should I contact?",
    category: "GENERAL" as const,
    status: "resolved" as const,
    senderName: "Michael Taylor",
    senderEmail: "michael.t@example.com"
  },
  {
    subject: "Payment failed but money deducted",
    body: "I tried purchasing the subscription, the portal showed payment failed, but the amount was deducted from my bank.",
    category: "REFUND" as const,
    status: "open" as const,
    senderName: "Charlotte Brown",
    senderEmail: "charlotte.b@example.com"
  }
];

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
  let adminId = '';
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
    adminId = result.user.id;
  } else {
    console.log(`Admin user with email ${email} already exists. Skipping.`);
    adminId = existingAdmin.id;
  }

  // Check if agent already exists
  let agentId = '';
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
    agentId = result.user.id;
  } else {
    console.log(`Agent user with email ${agentEmail} already exists. Skipping.`);
    agentId = existingAgent.id;
  }

  // Clear existing tickets and messages
  console.log('Cleaning existing tickets and messages...');
  await prisma.message.deleteMany();
  await prisma.ticket.deleteMany();

  // Generating 100 diversified tickets
  console.log('Generating 100 diversified tickets...');
  const ticketsToCreate = Array.from({ length: 100 }).map((_, i) => {
    const template = ticketTemplates[i % ticketTemplates.length];
    const index = i + 1;
    const subject = `${template.subject} [Ref #${1000 + index}]`;
    const body = `${template.body} (Generated test case details for ticket #${index})`;

    // Vary status
    let status: 'open' | 'resolved' | 'closed' = template.status;
    if (i % 7 === 0) status = 'closed';
    else if (i % 3 === 0) status = 'resolved';
    else if (i % 5 === 0) status = 'open';

    // Spread createdAt timestamps over the last 25 days (one ticket every 6 hours)
    const createdAt = new Date(Date.now() - i * 6 * 60 * 60 * 1000);

    // Assign some tickets
    const assignedToId = (i % 4 === 0) ? agentId : (i % 10 === 0) ? adminId : null;

    return {
      subject,
      body,
      bodyHtml: null,
      senderEmail: template.senderEmail,
      senderName: template.senderName,
      status,
      category: template.category,
      createdAt,
      updatedAt: createdAt,
      assignedToId,
    };
  });

  await prisma.ticket.createMany({
    data: ticketsToCreate,
  });

  // Seed messages for each ticket
  const createdTickets = await prisma.ticket.findMany({ select: { id: true, body: true, senderEmail: true } });
  const messagesToCreate = createdTickets.map(t => ({
    ticketId: t.id,
    sender: 'student',
    senderEmail: t.senderEmail,
    body: t.body,
  }));

  await prisma.message.createMany({
    data: messagesToCreate,
  });

  console.log('100 diversified tickets seeded successfully.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
