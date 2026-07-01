import { useState } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import type { Ticket, Message } from '@helpdesk/core';
import DOMPurify from 'dompurify';
import { Sparkles, Loader2 } from 'lucide-react';

export function ReplySection({ ticket }: { ticket: Ticket }) {
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [polishing, setPolishing] = useState(false);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || submittingReply) return;

    setSubmittingReply(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(
        `${baseUrl}/api/tickets/${ticket.id}/messages`,
        { body: replyText.trim() },
        { withCredentials: true }
      );
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['ticket', String(ticket.id)] });
    } catch (err: any) {
      console.error('Failed to send reply:', err);
      alert(err.response?.data?.error || 'Failed to send reply. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handlePolish = async () => {
    if (!replyText.trim() || polishing) return;

    setPolishing(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(
        `${baseUrl}/api/tickets/${ticket.id}/messages/polish`,
        {
          draftReply: replyText.trim(),
          ticketBody: ticket.body,
          customerName: ticket.senderName,
        },
        { withCredentials: true }
      );
      setReplyText(response.data.polishedReply);
    } catch (err: any) {
      console.error('Failed to polish reply:', err);
      alert(err.response?.data?.error || 'Failed to polish reply. Please try again.');
    } finally {
      setPolishing(false);
    }
  };

  return (
    <>
      {/* Reply Thread */}
      <div className="bg-card/30 backdrop-blur-sm border border-border/80 p-6 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-base font-bold text-foreground border-b border-border/50 pb-2">Reply Thread</h2>
        {ticket.messages && ticket.messages.slice(1).length > 0 ? (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {ticket.messages.slice(1).map((msg) => {
              const isAgent = msg.senderType === 'agent';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col space-y-1.5 max-w-[85%] ${
                    isAgent ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {isAgent ? (msg.sender || 'Agent') : 'Customer'}
                    </span>
                    <span>•</span>
                    <span className="font-mono">{msg.senderEmail}</span>
                    <span>•</span>
                    <span>{new Date(msg.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                      isAgent
                        ? 'bg-primary/10 border-primary/20 text-foreground rounded-tr-none'
                        : 'bg-muted/50 border-border text-foreground rounded-tl-none'
                    }`}
                  >
                    {msg.bodyHtml ? (
                      <div
                        className="parsed-html"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.bodyHtml) }}
                      />
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.body}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No replies yet. Use the form below to reply.
          </div>
        )}
      </div>

      {/* Reply Form */}
      <div className="bg-card/30 backdrop-blur-sm border border-border/80 p-6 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-base font-bold text-foreground border-b border-border/50 pb-2">Send a Reply</h2>
        <form onSubmit={handleSendReply} className="space-y-4">
          <textarea
            data-testid="reply-textarea"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply to the customer..."
            className="w-full min-h-[100px] p-3 text-xs bg-background/50 border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-y"
            required
            disabled={submittingReply || polishing}
          />
          <div className="flex justify-end items-center gap-2">
            <Button
              type="button"
              variant="outline"
              data-testid="polish-button"
              onClick={handlePolish}
              disabled={polishing || submittingReply || !replyText.trim()}
              className="cursor-pointer text-xs gap-1.5"
            >
              {polishing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Polishing...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Polish
                </>
              )}
            </Button>
            <Button
              type="submit"
              data-testid="reply-submit-button"
              disabled={submittingReply || !replyText.trim()}
              className="cursor-pointer text-xs"
            >
              {submittingReply ? 'Sending...' : 'Submit Reply'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
