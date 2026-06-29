import { Users as UsersIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Users() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[calc(100vh-140px)] relative overflow-hidden bg-background">
      {/* Background glow effects with orange tone */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse duration-5000" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Main card */}
      <Card className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-border shadow-2xl p-6 transition-all duration-300 hover:border-primary/30 text-center">
        <CardHeader className="mb-2">
          <div className="mx-auto inline-flex h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center shadow-lg shadow-primary/5 mb-4 text-primary">
            <UsersIcon className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            User Management
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1.5">
            This area is restricted to administrators.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
