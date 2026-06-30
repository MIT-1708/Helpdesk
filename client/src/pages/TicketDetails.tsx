import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Shield, Mail, User as UserIcon, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { TicketStatus, TicketCategory } from '@helpdesk/core';

interface Message {
  id: string;
  sender: 'student' | 'agent';
  senderEmail: string;
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

export default function TicketDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: ticket, isLoading, error } = useQuery<Ticket>({
    queryKey: ['ticket', id],
    queryFn: () => fetchTicketDetails(id!),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });

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
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
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
                  <span>{ticket.category}</span>
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

        {/* Main Grid split */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main message & thread section */}
          <div className="md:col-span-2 space-y-6">
            {/* Ticket body details */}
            <div className="bg-card/30 backdrop-blur-sm border border-border/80 p-6 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-base font-bold text-foreground border-b border-border/50 pb-2">Description</h2>
              <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {ticket.body}
              </div>
            </div>

            {/* Conversation Flow */}
            <div className="bg-card/30 backdrop-blur-sm border border-border/80 p-6 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-base font-bold text-foreground border-b border-border/50 pb-2">Conversation Thread</h2>
              
              <div className="space-y-4 pt-2">
                {ticket.messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    No messages in this thread.
                  </div>
                ) : (
                  ticket.messages.map((message) => {
                    const isAgent = message.sender === 'agent';
                    return (
                      <div
                        key={message.id}
                        className={`flex flex-col max-w-[85%] ${isAgent ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                          <span className="font-semibold text-foreground/80">
                            {isAgent ? 'Support Agent' : ticket.senderName || 'Student'}
                          </span>
                          <span>•</span>
                          <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                        </div>

                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm border leading-relaxed ${
                            isAgent
                              ? 'bg-primary text-primary-foreground border-primary/20 rounded-tr-none'
                              : 'bg-muted/60 text-foreground border-border rounded-tl-none'
                          }`}
                        >
                          {message.body}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Sidebar details */}
          <div className="space-y-6">
            {/* Customer Information Card */}
            <div className="bg-card/40 backdrop-blur-sm border border-border/80 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <UserIcon className="h-4 w-4 text-primary" />
                Customer Details
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Name</span>
                  <p className="font-semibold text-foreground">{ticket.senderName || 'Anonymous'}</p>
                </div>
                
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Email</span>
                  <p className="font-mono text-foreground flex items-center gap-1.5 truncate">
                    <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{ticket.senderEmail}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Assignment Details Card */}
            <div className="bg-card/40 backdrop-blur-sm border border-border/80 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <Shield className="h-4 w-4 text-primary" />
                Assignment
              </h3>
              
              <div className="space-y-3 text-xs">
                {ticket.assignedTo ? (
                  <>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Agent</span>
                      <p className="font-semibold text-foreground">{ticket.assignedTo.name}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Email</span>
                      <p className="font-mono text-foreground truncate">{ticket.assignedTo.email}</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 bg-muted/40 rounded-xl border border-border/50 text-muted-foreground text-xs font-semibold">
                    Unassigned
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
