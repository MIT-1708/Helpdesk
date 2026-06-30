import { useState, useEffect } from 'react';
import { Ticket as TicketIcon, Search, RefreshCw, AlertCircle, User, Calendar, Tag, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { TicketStatus, TicketCategory } from '@helpdesk/core';

interface Ticket {
  id: number;
  subject: string;
  body: string;
  bodyHtml: string | null;
  status: TicketStatus;
  category: TicketCategory | null;
  senderEmail: string;
  senderName: string | null;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

const fetchTickets = async (filters: { status: string; category: string; search: string }) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const params: any = {};
  if (filters.status && filters.status !== 'all') {
    params.status = filters.status;
  }
  if (filters.category && filters.category !== 'all') {
    params.category = filters.category;
  }
  if (filters.search) {
    params.search = filters.search;
  }

  const response = await axios.get(`${baseUrl}/api/tickets`, {
    params,
    withCredentials: true,
  });
  return response.data;
};

export default function Tickets() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: tickets = [], isLoading, isFetching, error, refetch } = useQuery<Ticket[]>({
    queryKey: ['tickets', statusFilter, categoryFilter, debouncedSearch],
    queryFn: () => fetchTickets({ status: statusFilter, category: categoryFilter, search: debouncedSearch }),
  });

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
                <TicketIcon className="h-5 w-5" />
              </div>
              Tickets Directory
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor, filter, and manage incoming support student tickets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="gap-2 h-9 rounded-xl border-border bg-card hover:bg-muted text-foreground transition-all duration-300"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-center gap-4 bg-card/40 backdrop-blur-sm border border-border/80 p-5 rounded-2xl shadow-sm">
          {/* Search */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by subject, body, or sender..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 bg-background/50 border-border/80 rounded-xl w-full text-sm focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground/60 transition-all duration-300"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-52">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-11 bg-background/50 border border-border/80 rounded-xl px-4 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value={TicketStatus.OPEN}>Open</option>
              <option value={TicketStatus.RESOLVED}>Resolved</option>
              <option value={TicketStatus.CLOSED}>Closed</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-56">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-11 bg-background/50 border border-border/80 rounded-xl px-4 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value={TicketCategory.GENERAL}>General Question</option>
              <option value={TicketCategory.TECHNICAL}>Technical Question</option>
              <option value={TicketCategory.REFUND}>Refund Request</option>
            </select>
          </div>
        </div>

        {/* Loading and Error States */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card/45 border border-border/80 p-6 rounded-2xl space-y-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-muted shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="h-14 bg-muted rounded-xl w-full" />
                <div className="border-t border-border/50 pt-4 flex justify-between">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-5 rounded-2xl flex items-start gap-4 max-w-2xl mx-auto shadow-sm">
            <AlertCircle className="h-5.5 w-5.5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm">Failed to load tickets</h3>
              <p className="text-xs opacity-90">{(error as Error).message}</p>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20 bg-card/25 border border-border/60 rounded-2xl max-w-lg mx-auto shadow-sm backdrop-blur-sm space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground border border-border">
              <TicketIcon className="h-6 w-6" />
            </div>
            <div className="space-y-1.5 px-6">
              <h3 className="font-bold text-base text-foreground">No tickets found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No tickets matched your selected search criteria. Try modifying your filter rules.
              </p>
            </div>
          </div>
        ) : (
          /* Tickets Grid */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                data-testid="ticket-card"
                className="group bg-card hover:bg-card/90 border border-border/80 hover:border-primary/45 p-6 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="space-y-4">
                  {/* Top line: ticket ID, date */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold tracking-wide">
                    <span className="bg-muted px-2 py-0.5 rounded border border-border text-foreground font-mono">
                      #{ticket.id}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Subject and body */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground group-hover:text-primary leading-snug line-clamp-2 transition-colors duration-300">
                      {ticket.subject}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {ticket.body}
                    </p>
                  </div>
                </div>

                {/* Footer section */}
                <div className="pt-5 mt-5 border-t border-border/50 space-y-3.5">
                  {/* Sender Details */}
                  <div className="flex items-center gap-2.5 text-xs">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-foreground truncate leading-none">
                        {ticket.senderName || 'Anonymous'}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {ticket.senderEmail}
                      </span>
                    </div>
                  </div>

                  {/* Tags & Assignee */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ticket.status === TicketStatus.OPEN
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : ticket.status === TicketStatus.RESOLVED
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                      }`}
                    >
                      {ticket.status}
                    </span>

                    {/* Category badge */}
                    {ticket.category && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-md border border-border max-w-[120px] truncate">
                        <Tag className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{ticket.category}</span>
                      </span>
                    )}

                    {/* Assignee */}
                    <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                      <Shield className="h-2.5 w-2.5 text-primary/70 shrink-0" />
                      <span className="truncate max-w-[80px]">
                        {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
