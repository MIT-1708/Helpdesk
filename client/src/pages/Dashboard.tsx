import { RefreshCw, LayoutDashboard, Sparkles, Ticket, AlertCircle, Clock, Percent, Tag, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  aiResolvedCount: number;
  pctResolvedByAi: number;
  avgResolutionTimeFormatted: string;
  categories: {
    GENERAL: number;
    TECHNICAL: number;
    REFUND: number;
  };
  recentTickets: Array<{
    id: number;
    subject: string;
    status: string;
    category: string | null;
    senderName: string | null;
    senderEmail: string;
    createdAt: string;
  }>;
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const response = await axios.get(`${baseUrl}/api/tickets/dashboard`, {
    withCredentials: true,
  });
  return response.data;
};

export default function Dashboard() {
  const { data, isLoading, isFetching, error, refetch } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
  });

  const stats = data;

  return (
    <div className="flex-1 p-6 md:p-10 bg-background relative min-h-[calc(100vh-140px)] overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none -z-10 animate-pulse duration-[12s]" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              Helpdesk Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Overview of helpdesk performance, category distribution, and automated AI assistance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="gap-2 h-9 rounded-xl border-border bg-card hover:bg-muted text-foreground transition-all duration-300 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Loading and Error States */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 bg-muted rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-5 rounded-2xl flex items-start gap-4 max-w-2xl mx-auto shadow-sm">
            <AlertCircle className="h-5.5 w-5.5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm">Failed to load dashboard metrics</h3>
              <p className="text-xs opacity-90">{(error as Error).message}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Metrics Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {/* Total Tickets */}
              <div className="bg-card/40 backdrop-blur-sm border border-border/80 p-5 rounded-2xl shadow-sm space-y-3 hover:border-primary/40 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-semibold">Total Tickets</span>
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Ticket className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground" data-testid="total-tickets">
                    {stats?.totalTickets ?? 0}
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-1">All time received</p>
                </div>
              </div>

              {/* Open Tickets */}
              <div className="bg-card/40 backdrop-blur-sm border border-border/80 p-5 rounded-2xl shadow-sm space-y-3 hover:border-amber-500/40 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-semibold">Open Tickets</span>
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground" data-testid="open-tickets">
                    {stats?.openTickets ?? 0}
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-1">Awaiting attention</p>
                </div>
              </div>

              {/* Resolved by AI */}
              <div className="bg-card/40 backdrop-blur-sm border border-border/80 p-5 rounded-2xl shadow-sm space-y-3 hover:border-emerald-500/40 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-semibold">AI Resolved Tickets</span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Sparkles className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground" data-testid="ai-resolved-tickets">
                    {stats?.aiResolvedCount ?? 0}
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-1">Handled automatically</p>
                </div>
              </div>

              {/* % Resolved by AI */}
              <div className="bg-card/40 backdrop-blur-sm border border-border/80 p-5 rounded-2xl shadow-sm space-y-3 hover:border-violet-500/40 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-semibold">AI Success Rate</span>
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
                    <Percent className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground" data-testid="ai-success-rate">
                    {stats?.pctResolvedByAi ?? 0}%
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-1">Of total resolved</p>
                </div>
              </div>

              {/* Average Resolution Time */}
              <div className="bg-card/40 backdrop-blur-sm border border-border/80 p-5 rounded-2xl shadow-sm space-y-3 hover:border-sky-500/40 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-semibold">Average Resolution Time</span>
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground" data-testid="average-resolution-time">
                    {stats?.avgResolutionTimeFormatted ?? 'N/A'}
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-1">For resolved tickets</p>
                </div>
              </div>
            </div>

            {/* Split layout: Category breakdown + Recent activity */}
            <div className="grid gap-8 md:grid-cols-2">
              {/* Category distribution */}
              <div className="bg-card/30 backdrop-blur-sm border border-border/80 p-6 rounded-2xl shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Category Distribution
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-foreground">General Question</span>
                      <span className="text-muted-foreground">{stats?.categories.GENERAL ?? 0}</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{
                          width: `${
                            stats?.totalTickets
                              ? ((stats.categories.GENERAL) / stats.totalTickets) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-foreground">Technical Question</span>
                      <span className="text-muted-foreground">{stats?.categories.TECHNICAL ?? 0}</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{
                          width: `${
                            stats?.totalTickets
                              ? ((stats.categories.TECHNICAL) / stats.totalTickets) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-foreground">Refund Request</span>
                      <span className="text-muted-foreground">{stats?.categories.REFUND ?? 0}</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-red-500 h-full rounded-full"
                        style={{
                          width: `${
                            stats?.totalTickets
                              ? ((stats.categories.REFUND) / stats.totalTickets) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent tickets feed */}
              <div className="bg-card/30 backdrop-blur-sm border border-border/80 p-6 rounded-2xl shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  Recent Activity Feed
                </h3>
                <div className="divide-y divide-border/60">
                  {stats?.recentTickets && stats.recentTickets.length > 0 ? (
                    stats.recentTickets.map((t) => (
                      <div key={t.id} className="py-3 flex items-center justify-between hover:bg-muted/20 transition-colors rounded-xl px-2">
                        <div className="space-y-1">
                          <Link to={`/tickets/${t.id}`} className="font-semibold text-sm hover:underline text-foreground block truncate max-w-[280px]">
                            {t.subject}
                          </Link>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>#{t.id}</span>
                            <span>•</span>
                            <span className="capitalize">{t.status}</span>
                            {t.category && (
                              <>
                                <span>•</span>
                                <span>{t.category}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Link to={`/tickets/${t.id}`} className="text-muted-foreground hover:text-foreground">
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No recent activity.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
