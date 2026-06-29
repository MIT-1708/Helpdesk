import { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, Shield, Calendar, CheckCircle2, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'agent'>('all');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/admin/users`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'An unexpected error occurred while fetching users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
              onClick={fetchUsers} 
              className="gap-2 cursor-pointer"
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
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
              <p className="text-xs opacity-90">{error}</p>
            </div>
            <Button size="sm" variant="outline" onClick={fetchUsers} className="border-destructive/25 text-destructive hover:bg-destructive/10 cursor-pointer">
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
        ) : filteredUsers.length === 0 ? (
          /* Empty State */
          <Card className="border border-border/80 bg-card/30 backdrop-blur-xl py-16 text-center rounded-3xl shadow-sm">
            <div className="mx-auto inline-flex h-16 w-16 rounded-2xl bg-muted border border-border items-center justify-center text-muted-foreground mb-4">
              <UsersIcon className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">No Users Found</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              We couldn't find any users matching your search query or role filter. Try clearing or expanding your criteria.
            </CardDescription>
            {(searchQuery || roleFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                className="mt-6 cursor-pointer"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </Card>
        ) : (
          /* User Grid Cards */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => {
              const isAdmin = user.role === 'admin';
              
              return (
                <Card 
                  key={user.id} 
                  className="bg-card/45 backdrop-blur-md border border-border/80 shadow-md hover:shadow-xl hover:border-primary/25 hover:bg-card/85 transition-all duration-300 rounded-2xl group flex flex-col justify-between"
                >
                  <div className="p-6 space-y-5">
                    {/* User Profile Header */}
                    <div className="flex items-start gap-4 text-left">
                      {/* Avatar container */}
                      <div className="relative shrink-0">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="h-12 w-12 rounded-xl object-cover border border-border"
                          />
                        ) : (
                          <div className={`h-12 w-12 rounded-xl border flex items-center justify-center text-sm font-extrabold shadow-sm ${
                            isAdmin 
                              ? 'bg-gradient-to-tr from-primary/20 to-amber-500/20 border-primary/20 text-primary' 
                              : 'bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                          }`}>
                            {getInitials(user.name)}
                          </div>
                        )}
                        {/* Verified/Unverified Badge indicator dot */}
                        <span className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-card flex items-center justify-center shadow-sm ${
                          user.emailVerified ? 'bg-emerald-500' : 'bg-amber-400'
                        }`} title={user.emailVerified ? 'Verified Email' : 'Pending Verification'}>
                          {user.emailVerified ? (
                            <CheckCircle2 className="h-2 w-2 text-white" />
                          ) : (
                            <XCircle className="h-2 w-2 text-white" />
                          )}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="space-y-0.5 text-left flex-1 min-w-0">
                        <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {user.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate" title={user.email}>
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Role & Access Info */}
                    <div className="flex items-center justify-between">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isAdmin 
                          ? 'bg-primary/10 text-primary border border-primary/20' 
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10'
                      }`}>
                        <Shield className="h-3 w-3" />
                        <span>{user.role}</span>
                      </div>

                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${user.emailVerified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span>{user.emailVerified ? 'Verified' : 'Unverified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="px-6 py-4 bg-muted/30 border-t border-border/50 rounded-b-2xl flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 opacity-70" />
                      <span>Joined {formatDate(user.createdAt)}</span>
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/60 select-none">
                      ID: {user.id.slice(0, 8)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
