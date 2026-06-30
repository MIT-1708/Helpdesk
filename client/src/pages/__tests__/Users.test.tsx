import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Users from '../Users';
import { renderWithQueryClient } from '@/test/test-utils';
import { UserRole } from '@helpdesk/core';

// Mock axios
vi.mock('axios');

const mockUsers = [
  {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin User',
    emailVerified: true,
    image: null,
    role: UserRole.ADMIN,
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-01T12:00:00.000Z',
  },
  {
    id: 'user-2',
    email: 'agent@example.com',
    name: 'Agent User',
    emailVerified: false,
    image: null,
    role: UserRole.AGENT,
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
    expect(screen.getByText(UserRole.ADMIN)).toBeInTheDocument();
    expect(screen.getByText(UserRole.AGENT)).toBeInTheDocument();
    
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

  it('opens and closes the create user modal via backdrop click and escape key', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockUsers });
    const user = userEvent.setup();
    
    renderWithQueryClient(<Users />);
    
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    
    // Verify modal is not shown initially
    expect(screen.queryByRole('heading', { name: 'Create New User' })).not.toBeInTheDocument();
    
    // Open modal
    const newUserButton = screen.getByRole('button', { name: /New User/i });
    await user.click(newUserButton);
    
    expect(screen.getByRole('heading', { name: 'Create New User' })).toBeInTheDocument();
    
    // Close via clicking outside (backdrop)
    const backdrop = screen.getByTestId('modal-backdrop');
    await user.click(backdrop);
    
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Create New User' })).not.toBeInTheDocument();
    });
    
    // Open again
    await user.click(newUserButton);
    expect(screen.getByRole('heading', { name: 'Create New User' })).toBeInTheDocument();
    
    // Close via Escape key
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Create New User' })).not.toBeInTheDocument();
    });
  });

  it('validates form inputs and submits successfully', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockUsers });
    vi.mocked(axios.post).mockResolvedValue({ data: { id: 'new-user', name: 'New Agent', email: 'newagent@example.com', role: UserRole.AGENT } });
    
    const user = userEvent.setup();
    renderWithQueryClient(<Users />);
    
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    
    // Open modal
    const newUserButton = screen.getByRole('button', { name: /New User/i });
    await user.click(newUserButton);
    
    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('john@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: 'Create User' });
    
    // 1. Submit empty form
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 3 characters.')).toBeInTheDocument();
      expect(screen.getByText('Email is required.')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
    });
    
    // 2. Type invalid values
    await user.type(nameInput, 'Jo');
    await user.type(emailInput, 'invalid');
    await user.type(passwordInput, '123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 3 characters.')).toBeInTheDocument();
      expect(screen.getByText('Invalid email format.')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
    });
    
    // 3. Clear and enter valid values
    await user.clear(nameInput);
    await user.type(nameInput, 'John Doe');
    await user.clear(emailInput);
    await user.type(emailInput, 'john@example.com');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'securepassword123');
    
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users'),
        {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'securepassword123',
        },
        expect.objectContaining({ withCredentials: true })
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Create New User' })).not.toBeInTheDocument();
    });
  });

  it('opens edit user modal, populates data, and submits updates successfully', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockUsers });
    vi.mocked(axios.put).mockResolvedValue({ data: { ...mockUsers[1], name: 'Updated Agent' } });

    const user = userEvent.setup();
    renderWithQueryClient(<Users />);

    await waitFor(() => {
      expect(screen.getByText('Agent User')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Edit User');
    await user.click(editButtons[1]);

    expect(screen.getByRole('heading', { name: 'Edit User Details' })).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('john@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    expect(nameInput).toHaveValue('Agent User');
    expect(emailInput).toHaveValue('agent@example.com');
    expect(passwordInput).toHaveValue('');

    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Agent');
    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users/user-2'),
        {
          name: 'Updated Agent',
          email: 'agent@example.com',
          password: undefined,
        },
        expect.objectContaining({ withCredentials: true })
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Edit User Details' })).not.toBeInTheDocument();
    });

    vi.mocked(axios.put).mockClear();

    await user.click(editButtons[1]);
    expect(screen.getByRole('heading', { name: 'Edit User Details' })).toBeInTheDocument();

    const reopenedPasswordInput = screen.getByPlaceholderText('••••••••');
    const reopenedSaveButton = screen.getByRole('button', { name: 'Save Changes' });
    await user.type(reopenedPasswordInput, 'newsecurepassword123');
    await user.click(reopenedSaveButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users/user-2'),
        {
          name: 'Agent User',
          email: 'agent@example.com',
          password: 'newsecurepassword123',
        },
        expect.objectContaining({ withCredentials: true })
      );
    });
  });

  it('displays delete button only for non-admins, opens delete modal, and deletes successfully', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockUsers });
    vi.mocked(axios.delete).mockResolvedValue({ data: { message: 'User deleted successfully.' } });

    const user = userEvent.setup();
    renderWithQueryClient(<Users />);

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Agent User')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete User');
    expect(deleteButtons.length).toBe(1);

    await user.click(deleteButtons[0]);

    expect(screen.getByRole('heading', { name: 'Delete User Account' })).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();

    const confirmButton = screen.getByTestId('confirm-delete-button');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users/user-2'),
        expect.objectContaining({ withCredentials: true })
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Delete User Account' })).not.toBeInTheDocument();
    });
  });
});
