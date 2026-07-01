import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
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
      senderType: 'customer' as const,
      body: 'I want a refund for the course.',
      createdAt: '2026-06-30T12:00:00.000Z',
    },
    {
      id: 'msg-2',
      sender: 'Agent User',
      senderEmail: 'agent@example.com',
      senderType: 'agent' as const,
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
    vi.mocked(axios.get).mockReturnValue(new Promise(() => { }));
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
    expect(screen.getAllByText(TicketCategory.REFUND)[0]).toBeInTheDocument();

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
    expect(screen.getAllByText('Agent User')[1]).toBeInTheDocument();
  });

  it('renders the reply thread and submits a new reply successfully', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockTicketDetails });
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        id: 'msg-3',
        sender: 'Agent User',
        senderEmail: 'agent@example.com',
        senderType: 'agent',
        body: 'This is a new test reply.',
        createdAt: '2026-06-30T12:10:00.000Z',
      },
    });

    renderComponent();

    // Verify reply thread header is rendered
    await waitFor(() => {
      expect(screen.getByText('Reply Thread')).toBeInTheDocument();
    });

    // Verify existing replies (msg-2 is subsequent, so it should render in the thread)
    expect(screen.getByText('Understood. We are looking into it.')).toBeInTheDocument();
    expect(screen.getAllByText('agent@example.com')[1]).toBeInTheDocument();

    // Find the textarea and type a reply
    const textarea = screen.getByPlaceholderText('Type your reply to the customer...');
    expect(textarea).toBeInTheDocument();

    // Type text using fireEvent

    fireEvent.change(textarea, { target: { value: 'This is a new test reply.' } });

    // Submit button should be enabled
    const submitButton = screen.getByRole('button', { name: /submit reply/i });
    expect(submitButton).toBeEnabled();

    // Click submit
    fireEvent.click(submitButton);

    // Verify API call was made with correct params
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/tickets/1/messages'),
        { body: 'This is a new test reply.' },
        { withCredentials: true }
      );
    });
  });

  it('updates ticket status and category successfully', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockTicketDetails });
    vi.mocked(axios.patch).mockResolvedValue({ data: { ...mockTicketDetails, status: TicketStatus.RESOLVED } });

    renderComponent();

    // Wait for load
    await waitFor(() => {
      expect(screen.getByText('Refund request for Course 101')).toBeInTheDocument();
    });

    // Find category select and change
    const categorySelect = screen.getByTestId('category-select');
    fireEvent.change(categorySelect, { target: { value: TicketCategory.TECHNICAL } });

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tickets/1'),
        { category: TicketCategory.TECHNICAL },
        { withCredentials: true }
      );
    });

    // Find status select and change
    const statusSelect = screen.getByTestId('status-select');
    fireEvent.change(statusSelect, { target: { value: TicketStatus.RESOLVED } });

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tickets/1'),
        { status: TicketStatus.RESOLVED },
        { withCredentials: true }
      );
    });
  });

  it('assigns and unassigns ticket successfully', async () => {
    vi.mocked(axios.get).mockImplementation((url) => {
      if (url.includes('/assignees')) {
        return Promise.resolve({
          data: [
            { id: 'agent-1', name: 'Agent User', email: 'agent@example.com', role: 'agent' },
            { id: 'agent-2', name: 'Other Agent', email: 'other@example.com', role: 'agent' }
          ]
        });
      }
      return Promise.resolve({ data: mockTicketDetails });
    });
    vi.mocked(axios.patch).mockResolvedValue({ data: { ...mockTicketDetails, assignedToId: 'agent-2' } });

    renderComponent();

    // Wait for load
    await waitFor(() => {
      expect(screen.getByText('Refund request for Course 101')).toBeInTheDocument();
    });

    // Click change assignee button to open assignee select
    const changeButton = screen.getByRole('button', { name: /change/i });
    fireEvent.click(changeButton);

    // Wait for select dropdown
    const assigneeSelect = await screen.findByTestId('assignee-select');
    fireEvent.change(assigneeSelect, { target: { value: 'agent-2' } });

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tickets/1/assign'),
        { agentId: 'agent-2' },
        { withCredentials: true }
      );
    });

    // Unassign ticket
    const unassignButton = screen.getByRole('button', { name: /unassign/i });
    fireEvent.click(unassignButton);

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tickets/1/assign'),
        { agentId: null },
        { withCredentials: true }
      );
    });
  });

  it('sanitizes and renders ticket bodyHtml successfully using DOMPurify', async () => {
    const mockTicketWithHtml = {
      ...mockTicketDetails,
      bodyHtml: '<div>Safe text <script>alert("xss")</script><img src="x" onerror="alert(1)"></div>',
    };
    vi.mocked(axios.get).mockResolvedValue({ data: mockTicketWithHtml });
    renderComponent();

    // Verify loading of ticket details
    await waitFor(() => {
      expect(screen.getByText('Refund request for Course 101')).toBeInTheDocument();
    });

    // Verify safe text is rendered
    expect(screen.getByText(/Safe text/)).toBeInTheDocument();

    // Verify script and onerror attributes are NOT rendered in DOM
    const rawHTMLBlock = document.body.innerHTML;
    expect(rawHTMLBlock).not.toContain('<script>');
    expect(rawHTMLBlock).not.toContain('alert("xss")');
    expect(rawHTMLBlock).not.toContain('onerror=');
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
