import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Users from '../Users';
import { renderWithQueryClient } from '@/test/test-utils';

// Mock axios
vi.mock('axios');

const mockUsers = [
  {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin User',
    emailVerified: true,
    image: null,
    role: 'admin',
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-01T12:00:00.000Z',
  },
  {
    id: 'user-2',
    email: 'agent@example.com',
    name: 'Agent User',
    emailVerified: false,
    image: null,
    role: 'agent',
    createdAt: '2026-02-15T12:00:00.000Z',
    updatedAt: '2026-02-15T12:00:00.000Z',
  },
];

describe('Users Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading skeleton initially', async () => {
    // Mock a pending promise for axios.get
    vi.mocked(axios.get).mockReturnValue(new Promise(() => {}));
    
    const { container } = renderWithQueryClient(<Users />);
    
    // The loading skeletons have animate-pulse. Let's verify we have multiple divs with animate-pulse.
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders users successfully', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockUsers });
    
    renderWithQueryClient(<Users />);
    
    // Wait for the skeleton to disappear and the users to render
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Agent User')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('agent@example.com')).toBeInTheDocument();
    
    // Verify badges and roles
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('agent')).toBeInTheDocument();
    
    // Matcher for the "2 of 2 Users" count
    expect(screen.getByText('2 of 2 Users')).toBeInTheDocument();
  });

  it('filters users by search query', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockUsers });
    const user = userEvent.setup();
    
    renderWithQueryClient(<Users />);
    
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search by name or email...');
    await user.type(searchInput, 'Agent');
    
    // "Agent User" should be visible, "Admin User" should NOT be visible
    expect(screen.getByText('Agent User')).toBeInTheDocument();
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
    expect(screen.getByText('1 of 2 Users')).toBeInTheDocument();
  });

  it('filters users by role selection', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockUsers });
    const user = userEvent.setup();
    
    renderWithQueryClient(<Users />);
    
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    
    const adminButton = screen.getByRole('button', { name: 'Admins' });
    await user.click(adminButton);
    
    // Only Admin User should be visible
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.queryByText('Agent User')).not.toBeInTheDocument();
    expect(screen.getByText('1 of 2 Users')).toBeInTheDocument();
    
    const agentButton = screen.getByRole('button', { name: 'Agents' });
    await user.click(agentButton);
    
    // Only Agent User should be visible
    expect(screen.getByText('Agent User')).toBeInTheDocument();
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
    expect(screen.getByText('1 of 2 Users')).toBeInTheDocument();
  });

  it('displays empty state when no search/filters match', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockUsers });
    const user = userEvent.setup();
    
    renderWithQueryClient(<Users />);
    
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search by name or email...');
    await user.type(searchInput, 'NonExistentName');
    
    expect(screen.getByText('No Users Found')).toBeInTheDocument();
    expect(screen.getByText("We couldn't find any users matching your search query or role filter. Try clearing or expanding your criteria.")).toBeInTheDocument();
    
    const clearButton = screen.getByRole('button', { name: 'Clear Filters' });
    await user.click(clearButton);
    
    // Everything should be restored
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Agent User')).toBeInTheDocument();
    expect(searchInput).toHaveValue('');
  });

  it('renders error state and handles retry', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const errorMsg = 'Failed to fetch users';
    vi.mocked(axios.get).mockRejectedValueOnce({
      response: { data: { message: errorMsg } },
    });
    
    const user = userEvent.setup();
    renderWithQueryClient(<Users />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load directory')).toBeInTheDocument();
    });
    
    expect(screen.getByText(errorMsg)).toBeInTheDocument();
    
    // Now mock resolved value on retry
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockUsers });
    
    const retryButton = screen.getByRole('button', { name: 'Retry' });
    await user.click(retryButton);
    
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('calls fetch when Refresh button is clicked', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockUsers });
    const user = userEvent.setup();
    
    renderWithQueryClient(<Users />);
    
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    
    expect(axios.get).toHaveBeenCalledTimes(1);
    
    const refreshButton = screen.getByRole('button', { name: /Refresh/i });
    await user.click(refreshButton);
    
    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});
