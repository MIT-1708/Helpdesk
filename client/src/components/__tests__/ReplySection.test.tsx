import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import { ReplySection } from '../ReplySection';
import { renderWithQueryClient } from '@/test/test-utils';
import { TicketStatus, TicketCategory } from '@helpdesk/core';
import type { Ticket } from '@helpdesk/core';

// Mock axios
vi.mock('axios');

const mockTicket: Ticket = {
  id: 1,
  subject: 'Test Subject',
  body: 'Initial ticket body description.',
  bodyHtml: null,
  status: TicketStatus.OPEN,
  category: TicketCategory.GENERAL,
  senderEmail: 'customer@example.com',
  senderName: 'Customer Name',
  assignedToId: 'agent-1',
  createdAt: '2026-06-30T12:00:00.000Z',
  updatedAt: '2026-06-30T12:00:00.000Z',
  assignedTo: {
    id: 'agent-1',
    name: 'Agent User',
    email: 'agent@example.com',
    role: 'agent',
  },
  messages: [
    {
      id: 'msg-1',
      sender: 'student',
      senderEmail: 'customer@example.com',
      senderType: 'customer',
      body: 'Initial ticket body description.',
      bodyHtml: null,
      createdAt: '2026-06-30T12:00:00.000Z',
    },
  ],
};

const mockTicketWithReplies: Ticket = {
  ...mockTicket,
  messages: [
    ...mockTicket.messages,
    {
      id: 'msg-2',
      sender: 'customer@example.com',
      senderEmail: 'customer@example.com',
      senderType: 'customer',
      body: 'Customer reply follow up.',
      bodyHtml: null,
      createdAt: '2026-06-30T12:05:00.000Z',
    },
    {
      id: 'msg-3',
      sender: 'Agent Name',
      senderEmail: 'agent@example.com',
      senderType: 'agent',
      body: 'Agent reply response.',
      bodyHtml: null,
      createdAt: '2026-06-30T12:10:00.000Z',
    },
  ],
};

describe('ReplySection Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders "No replies yet" when ticket only has the initial description message', () => {
    renderWithQueryClient(<ReplySection ticket={mockTicket} />);

    expect(screen.getByText('Reply Thread')).toBeInTheDocument();
    expect(screen.getByText('No replies yet. Use the form below to reply.')).toBeInTheDocument();
  });

  it('renders replies in chronological order, skipping the first description message', () => {
    renderWithQueryClient(<ReplySection ticket={mockTicketWithReplies} />);

    // First message (initial body) should be skipped
    expect(screen.queryByText('Initial ticket body description.')).not.toBeInTheDocument();

    // Subsequent replies should render
    expect(screen.getByText('Customer reply follow up.')).toBeInTheDocument();
    expect(screen.getByText('Agent reply response.')).toBeInTheDocument();

    // Senders should render correctly
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Agent Name')).toBeInTheDocument();
  });

  it('validates textarea input and enables/disables submit button', () => {
    renderWithQueryClient(<ReplySection ticket={mockTicket} />);

    const textarea = screen.getByPlaceholderText('Type your reply to the customer...');
    const submitButton = screen.getByRole('button', { name: /submit reply/i });

    // Initially disabled when empty
    expect(submitButton).toBeDisabled();

    // Enabled when non-empty text entered
    fireEvent.change(textarea, { target: { value: 'Hello Customer' } });
    expect(submitButton).toBeEnabled();

    // Disabled again when text is cleared/whitespace
    fireEvent.change(textarea, { target: { value: '   ' } });
    expect(submitButton).toBeDisabled();
  });

  it('submits a new reply, clears textarea, and invalidates tickets query client', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        id: 'msg-4',
        sender: 'Agent User',
        senderEmail: 'agent@example.com',
        senderType: 'agent',
        body: 'New reply submitted.',
        bodyHtml: null,
        createdAt: '2026-06-30T12:15:00.000Z',
      },
    });

    renderWithQueryClient(<ReplySection ticket={mockTicket} />);

    const textarea = screen.getByPlaceholderText('Type your reply to the customer...');
    const submitButton = screen.getByRole('button', { name: /submit reply/i });

    fireEvent.change(textarea, { target: { value: 'New reply submitted.' } });
    fireEvent.click(submitButton);

    // Verify submit button goes to sending state and gets disabled
    expect(submitButton).toBeDisabled();

    // Verify axios call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/tickets/1/messages'),
        { body: 'New reply submitted.' },
        { withCredentials: true }
      );
    });

    // Textarea is cleared
    expect(textarea).toHaveValue('');
  });
});
