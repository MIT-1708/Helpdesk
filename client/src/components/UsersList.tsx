import { Users as UsersIcon, CheckCircle2, XCircle, Shield, Calendar } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
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

interface UsersListProps {
  users: User[];
  showClearFilters: boolean;
  onClearFilters: () => void;
}

export default function UsersList({ users, showClearFilters, onClearFilters }: UsersListProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (users.length === 0) {
    return (
      <Card className="border border-border/80 bg-card/30 backdrop-blur-xl py-16 text-center rounded-3xl shadow-sm">
        <div className="mx-auto inline-flex h-16 w-16 rounded-2xl bg-muted border border-border items-center justify-center text-muted-foreground mb-4">
          <UsersIcon className="h-7 w-7" />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight text-foreground">No Users Found</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          We couldn't find any users matching your search query or role filter. Try clearing or expanding your criteria.
        </CardDescription>
        {showClearFilters && (
          <Button
            variant="outline"
            size="sm"
            className="mt-6 cursor-pointer"
            onClick={onClearFilters}
          >
            Clear Filters
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {users.map((user) => {
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
  );
}
