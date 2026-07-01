import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Shield, User as UserIcon, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { TicketStatus, TicketCategory } from '@helpdesk/core';
import { Button } from '@/components/ui/button';
import { ReplySection } from '../components/ReplySection';

interface Message {
  id: string;
  sender: string;
  senderEmail: string;
  senderType: 'agent' | 'customer';
  body: string;
  createdAt: string;
}

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
  messages: Message[];
}

const fetchTicketDetails = async (id: string): Promise<Ticket> => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const response = await axios.get(`${baseUrl}/api/tickets/${id}`, {
    withCredentials: true,
  });
  return response.data;
};

const categoryLabelMap: Record<string, string> = {
  GENERAL: 'General Question',
  TECHNICAL: 'Technical Question',
  REFUND: 'Refund Request',
};

export default function TicketDetails() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [assignees, setAssignees] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [loadingAssignees, setLoadingAssignees] = useState(false);
  const [updatingAssignee, setUpdatingAssignee] = useState(false);

  const { data: ticket, isLoading, error } = useQuery<Ticket>({
    queryKey: ['ticket', id],
    queryFn: () => fetchTicketDetails(id!),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });

  const fetchAssignees = async () => {
    setLoadingAssignees(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${baseUrl}/api/tickets/assignees`, {
        withCredentials: true,
      });
      setAssignees(response.data);
    } catch (err) {
      console.error('Failed to fetch assignees:', err);
    } finally {
      setLoadingAssignees(false);
    }
  };

  const handleAssign = async (agentId: string | null) => {
    setUpdatingAssignee(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.patch(
        `${baseUrl}/api/tickets/${ticket?.id}/assign`,
        { agentId },
        { withCredentials: true }
      );
      
      // Invalidate queries to fetch updated ticket details
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setIsEditingAssignee(false);
    } catch (err) {
      console.error('Failed to update assignee:', err);
      alert('Failed to update ticket assignment. Please try again.');
    } finally {
      setUpdatingAssignee(false);
    }
  };

  const [updatingProperties, setUpdatingProperties] = useState(false);

  const handleUpdateProperties = async (updates: { status?: TicketStatus; category?: TicketCategory | null }) => {
    setUpdatingProperties(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.patch(
        `${baseUrl}/api/tickets/${ticket?.id}`,
        updates,
        { withCredentials: true }
      );
      
      // Invalidate query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    } catch (err) {
      console.error('Failed to update ticket properties:', err);
      alert('Failed to update ticket properties. Please try again.');
    } finally {
      setUpdatingProperties(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex-1 p-6 md:p-10 bg-background relative min-h-[calc(100vh-140px)] overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
          <div className="h-6 bg-muted rounded w-24" />
          <div className="h-20 bg-muted rounded-2xl w-full" />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 h-96 bg-muted rounded-2xl" />
            <div className="h-48 bg-muted rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex-1 p-6 md:p-10 bg-background flex flex-col items-center justify-center min-h-[calc(100vh-140px)]">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-6 rounded-2xl max-w-md text-center space-y-3">
          <AlertCircle className="h-8 w-8 mx-auto" />
          <h3 className="font-bold">Failed to load ticket</h3>
          <p className="text-sm opacity-90">{(error as Error)?.message || 'Ticket not found'}</p>
          <Link to="/tickets" className="inline-block text-xs text-primary font-semibold underline">
            Back to Tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-10 bg-background relative min-h-[calc(100vh-140px)] overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none -z-10 animate-pulse duration-[12s]" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <div>
          <Link
            to="/tickets"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Tickets Directory
          </Link>
        </div>

        {/* Ticket Title Block */}
        <div className="bg-card/40 backdrop-blur-sm border border-border/80 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                TICKET #{ticket.id}
              </span>
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                {ticket.subject}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Status Badge */}
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  ticket.status === TicketStatus.OPEN
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : ticket.status === TicketStatus.RESOLVED
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                }`}
              >
                {ticket.status}
              </span>

              {/* Category Badge */}
              {ticket.category && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-muted text-muted-foreground px-3 py-1 rounded-full border border-border">
                  <Tag className="h-3 w-3 text-primary/70" />
                  <span>{categoryLabelMap[ticket.category] || ticket.category}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Created {new Date(ticket.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Main Grid split: Balanced two-column layout */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column: Description card only */}
          <div className="space-y-6">
            {/* Ticket body details */}
            <div className="bg-card/30 backdrop-blur-sm border border-border/80 p-6 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-base font-bold text-foreground border-b border-border/50 pb-2">Description</h2>
              <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {ticket.body}
              </div>
            </div>

            {/* Reply Section */}
            <ReplySection ticket={ticket} />
          </div>

          {/* Right Column: Properties, Assignment, and Details dropdown lists */}
          <div className="space-y-6">
            {/* Unified Sidebar Card: Customer details, status/category properties, and assignment dropdowns */}
            <div className="bg-card/40 backdrop-blur-sm border border-border/80 p-5 rounded-2xl shadow-sm space-y-4 text-left">
              {/* Customer Info Section */}
              <div className="space-y-2.5 pb-3 border-b border-border/50">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                  <UserIcon className="h-3.5 w-3.5 text-primary" />
                  Customer Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider block">Name</span>
                    <span className="font-semibold text-foreground truncate block">{ticket.senderName || 'Anonymous'}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider block">Email</span>
                    <span className="font-mono text-foreground truncate block" title={ticket.senderEmail}>{ticket.senderEmail}</span>
                  </div>
                </div>
              </div>

              {/* Status and Category Dropdowns Section */}
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-border/50">
                <div className="space-y-1">
                  <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider block">Status</span>
                  <select
                    data-testid="status-select"
                    value={ticket.status}
                    onChange={(e) => handleUpdateProperties({ status: e.target.value as TicketStatus })}
                    className="w-full h-8.5 bg-background/50 border border-border rounded-xl px-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer font-semibold capitalize"
                    disabled={updatingProperties}
                  >
                    <option value={TicketStatus.OPEN}>Open</option>
                    <option value={TicketStatus.RESOLVED}>Resolved</option>
                    <option value={TicketStatus.CLOSED}>Closed</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider block">Category</span>
                  <select
                    data-testid="category-select"
                    value={ticket.category || 'none'}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdateProperties({ category: val === 'none' ? null : val as TicketCategory });
                    }}
                    className="w-full h-8.5 bg-background/50 border border-border rounded-xl px-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer font-semibold"
                    disabled={updatingProperties}
                  >
                    <option value="none">Uncategorized</option>
                    <option value={TicketCategory.GENERAL}>General Question</option>
                    <option value={TicketCategory.TECHNICAL}>Technical Question</option>
                    <option value={TicketCategory.REFUND}>Refund Request</option>
                  </select>
                </div>
              </div>

              {/* Assignment Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    Assignment
                  </h3>
                  
                  {!isEditingAssignee && !updatingAssignee && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setIsEditingAssignee(true);
                          if (assignees.length === 0) fetchAssignees();
                        }}
                        className="text-[9px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        {ticket.assignedTo ? 'Change' : 'Assign'}
                      </button>
                      {ticket.assignedTo && (
                        <>
                          <span className="text-[8px] text-muted-foreground">•</span>
                          <button
                            onClick={() => handleAssign(null)}
                            className="text-[9px] font-bold text-destructive hover:underline cursor-pointer"
                          >
                            Unassign
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-xs">
                  {isEditingAssignee ? (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        {loadingAssignees ? (
                          <div className="h-8.5 w-full bg-muted rounded-xl animate-pulse" />
                        ) : (
                          <select
                            data-testid="assignee-select"
                            onChange={(e) => {
                              const val = e.target.value;
                              handleAssign(val === 'unassigned' ? null : val);
                            }}
                            defaultValue={ticket.assignedToId || 'unassigned'}
                            className="w-full h-8.5 bg-background/50 border border-border rounded-xl px-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                            disabled={updatingAssignee}
                          >
                            <option value="unassigned">Unassigned</option>
                            {assignees.map((agent) => (
                              <option key={agent.id} value={agent.id}>
                                {agent.name} ({agent.role})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingAssignee(false)}
                          className="h-6.5 px-2.5 text-[9px] rounded-lg cursor-pointer"
                          disabled={updatingAssignee}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : updatingAssignee ? (
                    <div className="text-center py-1 text-muted-foreground text-[10px] font-semibold animate-pulse flex items-center justify-center gap-1.5">
                      <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                      <span>Updating...</span>
                    </div>
                  ) : ticket.assignedTo ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider block">Agent</span>
                        <span className="font-semibold text-foreground truncate block">{ticket.assignedTo.name}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider block">Email</span>
                        <span className="font-mono text-foreground truncate block" title={ticket.assignedTo.email}>{ticket.assignedTo.email}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2 bg-muted/40 rounded-xl border border-border/50 text-muted-foreground text-[10px] font-semibold">
                      Unassigned
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
