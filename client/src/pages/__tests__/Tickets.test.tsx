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

const mockPaginationResponse = {
  tickets: mockTickets,
  pagination: {
    totalCount: 20,
    page: 1,
    pageSize: 10,
    totalPages: 2,
  },
};

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
    vi.mocked(axios.get).mockResolvedValue({ data: mockPaginationResponse });
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

    // Check pagination metadata display
    expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 2 of 20 tickets');
  });

  it('requests tickets with status filter when dropdown changes', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: { tickets: [], pagination: { totalCount: 0, page: 1, pageSize: 10, totalPages: 0 } },
    });
    renderWithQueryClient(<Tickets />);

    // Locate status dropdown
    const selects = screen.getAllByRole('combobox');
    const statusDropdown = selects[0];
    fireEvent.change(statusDropdown, { target: { value: TicketStatus.OPEN } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            status: TicketStatus.OPEN,
            page: 1,
          }),
        })
      );
    });
  });

  it('requests tickets with category filter when dropdown changes', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: { tickets: [], pagination: { totalCount: 0, page: 1, pageSize: 10, totalPages: 0 } },
    });
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
            page: 1,
          }),
        })
      );
    });
  });

  it('requests tickets with search query when typing in search input', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: { tickets: [], pagination: { totalCount: 0, page: 1, pageSize: 10, totalPages: 0 } },
    });
    renderWithQueryClient(<Tickets />);

    const searchInput = screen.getByPlaceholderText('Search by subject, body, or sender...');
    fireEvent.change(searchInput, { target: { value: 'Refund' } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            search: 'Refund',
            page: 1,
          }),
        })
      );
    }, { timeout: 1000 });
  });

  it('requests tickets with updated sorting when clicking a table header', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockPaginationResponse });
    renderWithQueryClient(<Tickets />);

    await screen.findByText('Refund request');

    const idHeaderButton = screen.getByRole('button', { name: /ID/ });
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

    const subjectHeaderButton = screen.getByRole('button', { name: /Subject/ });
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
    vi.mocked(axios.get).mockResolvedValue({ data: mockPaginationResponse });
    renderWithQueryClient(<Tickets />);

    const selects = screen.getAllByRole('combobox');
    const statusDropdown = selects[0];
    fireEvent.change(statusDropdown, { target: { value: TicketStatus.OPEN } });

    const categoryDropdown = selects[1];
    fireEvent.change(categoryDropdown, { target: { value: TicketCategory.REFUND } });

    const searchInput = screen.getByPlaceholderText('Search by subject, body, or sender...');
    fireEvent.change(searchInput, { target: { value: 'database' } });

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
            page: 1,
          }),
        })
      );
    }, { timeout: 1500 });
  });

  it('requests next page when clicking next pagination button', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockPaginationResponse });
    renderWithQueryClient(<Tickets />);

    // Wait for the table load
    await screen.findByText('Refund request');

    // Click 'Next' button
    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            page: 2,
          }),
        })
      );
    });
  });

  it('requests updated page size when rows per page dropdown changes', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockPaginationResponse });
    renderWithQueryClient(<Tickets />);

    await screen.findByText('Refund request');

    // Locate rows per page dropdown (which is a combobox, index 2)
    const selects = screen.getAllByRole('combobox');
    const rowsPerPageDropdown = selects[2];
    
    fireEvent.change(rowsPerPageDropdown, { target: { value: '20' } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            pageSize: 20,
            page: 1,
          }),
        })
      );
    });
  });
});
