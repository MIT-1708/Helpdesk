import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import Tickets from '../Tickets';
import { renderWithQueryClient } from '@/test/test-utils';
import { TicketStatus, TicketCategory } from '@helpdesk/core';

// Mock axios
vi.mock('axios');

const mockTickets = [
  {
    id: 1,
    subject: 'Refund request',
    body: 'I want a refund for the course.',
    bodyHtml: null,
    status: TicketStatus.OPEN,
    category: TicketCategory.REFUND,
    senderEmail: 'student1@example.com',
    senderName: 'John Student',
    assignedToId: null,
    createdAt: '2026-06-30T12:00:00.000Z',
    updatedAt: '2026-06-30T12:00:00.000Z',
    assignedTo: null,
  },
  {
    id: 2,
    subject: 'Database login timeout',
    body: 'I cannot connect to the database.',
    bodyHtml: null,
    status: TicketStatus.RESOLVED,
    category: TicketCategory.TECHNICAL,
    senderEmail: 'student2@example.com',
    senderName: 'Alice Student',
    assignedToId: 'agent-1',
    createdAt: '2026-06-30T12:30:00.000Z',
    updatedAt: '2026-06-30T12:30:00.000Z',
    assignedTo: {
      id: 'agent-1',
      name: 'Agent User',
      email: 'agent@example.com',
      role: 'agent',
    },
  },
];

describe('Tickets Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading skeleton initially', async () => {
    vi.mocked(axios.get).mockReturnValue(new Promise(() => {}));
    const { container } = renderWithQueryClient(<Tickets />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders tickets successfully', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockTickets });
    renderWithQueryClient(<Tickets />);

    await waitFor(() => {
      expect(screen.getByText('Refund request')).toBeInTheDocument();
      expect(screen.getByText('Database login timeout')).toBeInTheDocument();
    });

    // Check sender details
    expect(screen.getByText('John Student')).toBeInTheDocument();
    expect(screen.getByText('Alice Student')).toBeInTheDocument();
    
    // Check status pill rendering
    expect(screen.getByText(TicketStatus.OPEN)).toBeInTheDocument();
    expect(screen.getByText(TicketStatus.RESOLVED)).toBeInTheDocument();
  });

  it('requests tickets with status filter when dropdown changes', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [] });
    renderWithQueryClient(<Tickets />);

    // Locate status dropdown
    const selects = screen.getAllByRole('combobox');
    
    // index 0: status select, index 1: category select
    const statusDropdown = selects[0];
    fireEvent.change(statusDropdown, { target: { value: TicketStatus.OPEN } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            status: TicketStatus.OPEN,
          }),
        })
      );
    });
  });

  it('requests tickets with category filter when dropdown changes', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [] });
    renderWithQueryClient(<Tickets />);

    const selects = screen.getAllByRole('combobox');
    const categoryDropdown = selects[1];
    fireEvent.change(categoryDropdown, { target: { value: TicketCategory.REFUND } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            category: TicketCategory.REFUND,
          }),
        })
      );
    });
  });

  it('requests tickets with search query when typing in search input', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [] });
    renderWithQueryClient(<Tickets />);

    const searchInput = screen.getByPlaceholderText('Search by subject, body, or sender...');
    fireEvent.change(searchInput, { target: { value: 'Refund' } });

    // Wait for the 300ms debounce trigger
    await waitFor(() => {
      expect(axios.get).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            search: 'Refund',
          }),
        })
      );
    }, { timeout: 1000 });
  });

  it('requests tickets with updated sorting when clicking a table header', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockTickets });
    renderWithQueryClient(<Tickets />);

    // Wait for table to load
    await screen.findByText('Refund request');

    // Find the header button for ID
    const idHeaderButton = screen.getByRole('button', { name: /ID/ });
    
    // Clicking the ID header button should change sorting state to asc
    fireEvent.click(idHeaderButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            sortBy: 'id',
            sortOrder: 'asc',
          }),
        })
      );
    });

    // Find the header button for Subject
    const subjectHeaderButton = screen.getByRole('button', { name: /Subject/ });
    
    // Clicking Subject header button should change sorting to subject
    fireEvent.click(subjectHeaderButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            sortBy: 'subject',
            sortOrder: 'asc',
          }),
        })
      );
    });
  });

  it('requests tickets with combined status, category, search, and sorting parameters', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockTickets });
    renderWithQueryClient(<Tickets />);

    // 1. Change status filter to OPEN
    const selects = screen.getAllByRole('combobox');
    const statusDropdown = selects[0];
    fireEvent.change(statusDropdown, { target: { value: TicketStatus.OPEN } });

    // 2. Change category filter to REFUND
    const categoryDropdown = selects[1];
    fireEvent.change(categoryDropdown, { target: { value: TicketCategory.REFUND } });

    // 3. Type search query
    const searchInput = screen.getByPlaceholderText('Search by subject, body, or sender...');
    fireEvent.change(searchInput, { target: { value: 'database' } });

    // 4. Click ID header to sort
    const idHeaderButton = await screen.findByRole('button', { name: /ID/ });
    fireEvent.click(idHeaderButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            status: TicketStatus.OPEN,
            category: TicketCategory.REFUND,
            search: 'database',
            sortBy: 'id',
            sortOrder: 'asc',
          }),
        })
      );
    }, { timeout: 1500 });
  });
});
