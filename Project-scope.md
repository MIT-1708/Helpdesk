
## Scope & Workflows

### Student Interaction (Email-Only)
- Students do **not** have accounts or access to the Web UI.
- All student interactions occur strictly via email (submitting tickets, receiving replies, and sending follow-ups).

### Agent & Admin Web UI
- Agents and Admins log in to a Web application dashboard.
- Admins can create and manage Agent accounts. One default Admin is provisioned upon system deployment.
- Agents can view, filter, sort, and manage tickets.

### AI Classification & Response Flow
When an inbound email is received, a ticket is created and classified by the AI:
- **Single Category Assignment**: Every ticket belongs to exactly one category:
  - **General Question**
  - **Technical Question**
  - **Refund Request**
- **AI Autonomy Logic**:
  - **Simple Tickets (General Questions)**: The AI automatically generates a response, emails it to the student, and marks the ticket as **Resolved**.
  - **Complex Tickets (Technical Questions / Refund Requests)**: The ticket status is set to **Open** and routed to the agents' dashboard. The AI drafts a suggested response for the agent to review, edit, and approve before sending.

## Ticket Statuses
- **Open**: Active tickets awaiting agent action or response.
- **Resolved**: Tickets where a solution has been sent (automatically by AI or manually by an agent).
- **Closed**: Completed tickets that require no further action.

## User Roles & Permissions
- **Admin**: Provisioned at system deployment. Can manage agent accounts and view all system dashboards.
- **Agent**: Created by Admins. Can view, edit, claim, and respond to tickets.
