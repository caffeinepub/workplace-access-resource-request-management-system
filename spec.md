# Specification

## Summary
**Goal:** Build AccessFlow 23, a full-stack Workplace Access & Resource Request Management System with a professional enterprise UI, Motoko backend, role-based access control, approval workflows, AI-simulated assistance, and reporting capabilities.

**Planned changes:**

### Visual Theme & Layout
- Deep navy/slate primary palette with teal/cyan accents, Inter typography, card-based layouts with subtle shadows
- Collapsible left sidebar navigation, responsive/mobile-friendly layout
- Status color coding: yellow=Submitted, blue=Approved, green=Completed, red=Rejected, orange=In Fulfillment

### Login Page
- Email + password sign-in form with Internet Identity login button and MFA indicator badge
- Role selector (Employee, Manager, IT Admin, Finance Admin) for RBAC demo simulation

### Backend (Motoko single actor)
- Data models: Users, Requests, AuditLogs, Notifications as stable variables
- CRUD functions for all entities, `updateRequestStatus`, approval chain stored per request
- Intelligent approval routing: auto-approve low-risk software, require Manager+IT Security for high-risk, require Finance for requests over $1,000

### Dashboard
- KPI cards: Total Requests, Pending Approvals, Completed This Month, SLA Breaches
- Recent requests table with Request ID, Type, Status badge, Submitted Date, SLA countdown
- Donut chart (requests by status) and bar chart (requests by category)
- Role-adaptive action buttons

### Create Request Wizard (3 steps)
- Step 1: Request type selection cards (System Access, Physical Access, Equipment, Software Licenses)
- Step 2: Details form (sub-category, justification, priority, cost estimate, document attachment field)
- Step 3: Simulated AI Pre-Submission Analysis panel (duplicate warnings, missing info alerts, suggested access level, recommended approval chain) with Confirm & Submit
- On submit, saves request to backend and redirects to request detail page

### Request Detail Page
- Full metadata display, approval chain vertical timeline, status progress stepper
- SLA countdown timer, simulated AI risk flags panel, activity/audit log feed

### Approvals Screen (Manager, IT Admin, Finance Admin)
- List of pending approval requests with requester name, type, risk level badge, cost
- Approve, Reject, Request More Info actions — update status and append audit log entry
- Auto-approval and multi-level approval chain enforcement

### AI Chatbot Assistant
- Floating button on all pages expanding to a sidebar chat
- Simulated NLP parsing of natural language input into structured fields (category, priority, quantity, reason)
- "Create This Request" button pre-fills the Create Request wizard
- Example prompt suggestions shown when chat is empty

### Reports & Export Page (Admin/Management only)
- Filter bar (date range, department, request type)
- Charts: requests over time (line), approval rate (pie), SLA compliance (bar)
- CSV export and printable PDF summary view
- Department-wise breakdown table
- Audit trail table with search and pagination

### Admin Configuration Page
- Tabs: User Management (list, assign roles, set delegates), SLA Rules (deadline hours per category), Approval Chain Policies (routing rules per risk level), System Notifications (toggle preferences)
- All changes persisted to backend

### In-App Notification System
- Bell icon in top navbar with unread count badge
- Notification dropdown with message text and timestamps
- Mark as read updates backend and clears badge count

**User-visible outcome:** Users can log in with a selected role, submit and track access/resource requests through a guided wizard, view approvals and request details with live status and SLA tracking, interact with a simulated AI chatbot assistant, and admins can configure the system, manage users, and export compliance reports.
