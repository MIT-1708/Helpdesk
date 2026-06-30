import { useState } from 'react';
import { Users as UsersIcon, Search, RefreshCw, UserPlus, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import CreateUserModal from '@/components/CreateUserModal';
import EditUserModal from '@/components/EditUserModal';
import UsersList from '@/components/UsersList';

interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

const fetchUsersData = async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await axios.get(`${baseUrl}/api/admin/users`, {
      withCredentials: true,
    });
    return response.data;
  } catch (err: any) {
    console.error('Error fetching users:', err);
    throw new Error(err.response?.data?.message || err.message || 'An unexpected error occurred while fetching users.');
  }
};


export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'agent'>('all');

  const { data: users = [], isLoading: loading, isFetching, error, refetch: fetchUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsersData,
  });

  const [dialog, setDialog] = useState<{ mode: 'create' } | { mode: 'edit'; user: User } | null>(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });



  return (
    <div className="flex-1 p-6 md:p-10 bg-background relative min-h-[calc(100vh-140px)] overflow-hidden">
      {/* Dynamic background glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none -z-10 animate-pulse duration-[12s]" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 text-primary">
              <UsersIcon className="h-6 w-6" />
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">User Directory</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Monitor and manage user accounts, permissions, and roles.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-muted border border-border px-3 py-1.5 rounded-full font-medium text-muted-foreground shadow-sm">
              {filteredUsers.length} of {users.length} Users
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchUsers()} 
              className="gap-2 cursor-pointer"
              disabled={isFetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setDialog({ mode: 'create' })}
              className="gap-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10 hover:shadow-primary/20"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>New User</span>
            </Button>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-card/40 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-sm">
          {/* Search Bar */}
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-background/50 border-border focus-visible:ring-primary/20 focus-visible:border-primary"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center p-1 bg-muted/60 border border-border/80 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setRoleFilter('all')}
              className={`flex-1 sm:flex-initial text-xs font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`flex-1 sm:flex-initial text-xs font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                roleFilter === 'admin'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Admins
            </button>
            <button
              onClick={() => setRoleFilter('agent')}
              className={`flex-1 sm:flex-initial text-xs font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                roleFilter === 'agent'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Agents
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex items-start gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-sm">Failed to load directory</p>
              <p className="text-xs opacity-90">{error.message}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => fetchUsers()} className="border-destructive/25 text-destructive hover:bg-destructive/10 cursor-pointer">
              Retry
            </Button>
          </div>
        )}

        {/* Users Content */}
        {loading ? (
          /* Loading Skeleton State */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card/40 border border-border p-6 rounded-2xl animate-pulse space-y-4">
                <div className="flex items-center gap-4 text-left">
                  <div className="h-12 w-12 rounded-xl bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="border-t border-border/50 pt-4 flex justify-between">
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <UsersList
            users={filteredUsers}
            showClearFilters={searchQuery !== '' || roleFilter !== 'all'}
            onClearFilters={() => {
              setSearchQuery('');
              setRoleFilter('all');
            }}
            onEdit={(user) => setDialog({ mode: 'edit', user })}
          />
        )}
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={dialog?.mode === 'create'}
        onClose={() => setDialog(null)}
        onSuccess={fetchUsers}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={dialog?.mode === 'edit'}
        user={dialog?.mode === 'edit' ? dialog.user : null}
        onClose={() => setDialog(null)}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
