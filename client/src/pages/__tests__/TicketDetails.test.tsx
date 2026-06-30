import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import TicketDetails from '../TicketDetails';
import { renderWithQueryClient } from '@/test/test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TicketStatus, TicketCategory } from '@helpdesk/core';

// Mock axios
vi.mock('axios');

const mockTicketDetails = {
  id: 1,
  subject: 'Refund request for Course 101',
  body: 'I want a refund for the course.',
  bodyHtml: null,
  status: TicketStatus.OPEN,
  category: TicketCategory.REFUND,
  senderEmail: 'student1@example.com',
  senderName: 'John Student',
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
      senderEmail: 'student1@example.com',
      body: 'I want a refund for the course.',
      createdAt: '2026-06-30T12:00:00.000Z',
    },
    {
      id: 'msg-2',
      sender: 'agent',
      senderEmail: 'agent@example.com',
      body: 'Understood. We are looking into it.',
      createdAt: '2026-06-30T12:05:00.000Z',
    },
  ],
};

const renderComponent = () => {
  return renderWithQueryClient(
    <MemoryRouter initialEntries={['/tickets/1']}>
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetails />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('TicketDetails Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading skeleton initially', async () => {
    vi.mocked(axios.get).mockReturnValue(new Promise(() => {}));
    const { container } = renderComponent();
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders ticket details and messages successfully', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockTicketDetails });
    renderComponent();

    // Verify Title & ID
    await waitFor(() => {
      expect(screen.getByText('Refund request for Course 101')).toBeInTheDocument();
      expect(screen.getByText('TICKET #1')).toBeInTheDocument();
    });

    // Verify badges
    expect(screen.getByText(TicketStatus.OPEN)).toBeInTheDocument();
    expect(screen.getByText(TicketCategory.REFUND)).toBeInTheDocument();

    // Verify description body
    expect(screen.getAllByText('I want a refund for the course.')[0]).toBeInTheDocument();

    // Verify customer info
    expect(screen.getAllByText('John Student')[0]).toBeInTheDocument();
    expect(screen.getAllByText('student1@example.com')[0]).toBeInTheDocument();

    // Verify assignee details
    expect(screen.getAllByText('Agent User')[0]).toBeInTheDocument();
    expect(screen.getAllByText('agent@example.com')[0]).toBeInTheDocument();

    // Verify messages thread
    expect(screen.getByText('Understood. We are looking into it.')).toBeInTheDocument();
    expect(screen.getByText('Support Agent')).toBeInTheDocument();
  });

  it('renders error state on API failure', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('Network Error'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to load ticket')).toBeInTheDocument();
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });
  });
});
