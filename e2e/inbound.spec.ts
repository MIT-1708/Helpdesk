import { test, expect } from '@playwright/test';

const TicketStatus = {
  NEW: 'new',
  PROCESSING: 'processing',
  OPEN: 'open',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

const serverUrl = 'http://localhost:5001';

test.describe('Inbound Email Webhook to Ticketing API', () => {

  test('should create a new ticket from an inbound email and append replies to it', async ({ request }) => {
    const studentEmail = `student-${Date.now()}@example.com`;
    const emailSubject = 'Cannot connect to course database';
    const emailBody = 'Hello support, I am getting connection timeout errors on my database client.';

    // 1. CREATE TICKET via Inbound Webhook
    const createResponse = await request.post(`${serverUrl}/api/webhooks/inbound-email`, {
      data: {
        from: studentEmail,
        name: 'Jane Student',
        subject: emailSubject,
        body: emailBody,
      },
    });

    expect(createResponse.status()).toBe(200);
    
    const createData = await createResponse.json();
    expect(createData.message).toContain('New ticket created');
    expect(createData.ticket).toBeDefined();
    
    const ticketId = createData.ticket.id;
    // Verify ID is a number
    expect(typeof ticketId).toBe('number');
    // Verify category is null (optional and no default value)
    expect(createData.ticket.category).toBeNull();
    expect(createData.ticket.status).toBe(TicketStatus.NEW);
    expect(createData.ticket.senderEmail).toBe(studentEmail);
    expect(createData.ticket.senderName).toBe('Jane Student');
    expect(createData.ticket.body).toBe(emailBody);
    expect(createData.ticket.subject).toBe(emailSubject);

    // 2. APPEND REPLY via Inbound Webhook
    const replyBody = 'I tried restarting my router but the database is still unreachable.';
    const replyResponse = await request.post(`${serverUrl}/api/webhooks/inbound-email`, {
      data: {
        from: studentEmail,
        name: 'Jane Student',
        subject: `Re: ${emailSubject} [Ticket #${ticketId}]`,
        body: replyBody,
      },
    });

    expect(replyResponse.status()).toBe(200);

    const replyData = await replyResponse.json();
    expect(replyData.message).toContain('Reply appended');
    expect(replyData.newMessage).toBeDefined();
    expect(replyData.newMessage.ticketId).toBe(ticketId);
    expect(replyData.newMessage.body).toBe(replyBody);
    expect(replyData.newMessage.sender).toBe('student');
    expect(replyData.newMessage.senderEmail).toBe(studentEmail);

    // Verify ticket status is open (re-opened on reply)
    expect(replyData.ticket.status).toBe(TicketStatus.OPEN);
  });

  test('should validate input parameters and return 400 for bad payloads', async ({ request }) => {
    // Missing body
    const badResponse = await request.post(`${serverUrl}/api/webhooks/inbound-email`, {
      data: {
        from: 'not-an-email',
        subject: 'No body here',
      },
    });

    expect(badResponse.status()).toBe(400);
    const errData = await badResponse.json();
    expect(errData.error).toBeDefined();
  });
});
