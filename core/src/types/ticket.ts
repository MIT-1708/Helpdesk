import { TicketStatus, TicketCategory } from '../enums/ticket.js';

export interface Message {
  id: string;
  sender: string;
  senderEmail: string;
  senderType: 'agent' | 'customer';
  body: string;
  createdAt: string;
}

export interface Ticket {
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
  messages?: Message[];
}
