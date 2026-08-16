# Stitch Prompt: Administration & Settings
**Version:** 2.0.0  
**Depends on:** Master Prompt + 06-REPORTS-ALERTS  
**Generate after:** Reports & Alerts approved  

---

## Screen 1: User Management
```
Using the approved design system, create User Management (Tenant Admin).

LAYOUT (Desktop):
- Shell: Top Bar + Sidebar (Administration > Users active) + Main Content (max-width 1400px, padding 24px)
- Page Header: "Users" (H1) + "47 users" (Text Secondary) + "Invite User" (Primary, Lg, right)

TOOLBAR:
- Search (Name, Email, Role)
- Filters: Status (Active, Invited, Suspended, Deactivated), Role (Multi-select), 2FA (Enabled/Disabled), Last Login (Date Range)
- Column Picker, Export (CSV, XLSX)

TABLE:
Columns: Avatar, Name (Link → User Detail), Email, Role (Badge), Status (Badge: Active=Success, Invited=Warning, Suspended=Error, Deactivated=Muted), 2FA (Icon: Check/Empty), Last Login (Relative), Actions (Dropdown: Edit, Resend Invite, Reset Password, Reset MFA, Suspend/Activate, Delete)
- Row Hover: Highlight
- Bulk Actions (when selected): Assign Role, Activate/Suspend, Resend Invites, Reset MFA, Delete
- Pagination, Virtualized, Sortable

CARD VIEW (Mobile):
- Card: Avatar, Name, Email, Role Badge, Status Badge, Last Login, Actions Dropdown

EMPTY STATE: "No users yet" + "Invite User"

INVITE USER MODAL (Click "Invite User"):
- Stepper: 1. Emails → 2. Role → 3. Send
- Step 1: Bulk Email Input (Textarea, one per line, real-time validation, max 50)
- Step 2: Role Selector (Radio Cards: IT Asset Manager, Employee, Auditor, Read-Only, Custom Role)
- Step 3: Summary, "Send Invites" (Primary) → Sends emails with tokenized links
- Success Toast: "5 invites sent"

USER DETAIL (Click Name → Drawer Large or Page):
- Header: Avatar (XL), Name, Email, Role Badge, Status Badge, 2FA Status, Last Login, "Edit Profile"
- TABS:
  1. PROFILE: Name, Email, Phone, Timezone, Date/Time Format, Language, Department, Title, Manager
  2. ROLES & PERMISSIONS: Current Roles (Chips, removable), "Add Role" → Role Selector, Permission Matrix Preview (Resources × Actions, read-only)
  3. SESSIONS: Table: Device, Browser, IP, Location, Last Active, Current (Badge), "Revoke" (Destructive), "Revoke All Other Sessions"
  4. API KEYS: List: Name, Scopes, Created, Last Used, "Create Key" (Modal: Name, Scopes, Expiry), "Revoke"
  5. AUDIT LOG: Filterable: Date, Action, Resource, IP (same as Admin Audit Log)

STATES: Loading, Empty, Error, Offline

REALISTIC DATA:
- 47 users, mixed roles, 3 invited, 2 suspended
- Sessions: Chrome on Mac (Current), Safari on iPhone, Edge on Windows
```

---

## Screen 2: Roles & Permissions
```
Using the approved design system, create Roles & Permissions management.

LAYOUT (Desktop):
- Shell + Main Content (max-width 1400px)
- Page Header: "Roles & Permissions" (H1) + "Define what users can do" + "Create Role" (Primary, Lg)

ROLE CARDS (Grid, 3-col desktop):
- Card: Role Name (H3), Description, User Count Badge, Type Badge (Built-in / Custom), Actions: Edit, Duplicate, Delete (Disabled for Built-in)
- Built-in Roles: Super Admin, Tenant Admin, IT Asset Manager, Field Technician, Employee, Auditor, Read-Only
- Custom Roles: User-created

CREATE/EDIT ROLE MODAL (Large):
- Stepper: 1. Details → 2. Permissions → 3. Review
- Step 1: Name (Required, unique), Description, Base Role (Select: None / IT Asset Manager / Employee / etc. — inherits permissions)
- Step 2: PERMISSION MATRIX (Full-width Table):
  - Rows: Resources (Assets, Asset Tags, Audits, Reports, Webhooks, API Keys, Settings, Users, Groups, Sites, Categories, Departments, Contracts, Documents, Labels, Tenant, Billing)
  - Columns: Actions (Create, Read, Update, Delete, Export, Import, Manage)
  - Cells: Checkboxes (Tri-state for inherited: Checked=Explicit Allow, Unchecked=Deny, Dash=Inherited Allow)
  - "Select All" per Row/Column
  - Quick Presets: "Full Access", "Read Only", "Asset Manager", "Auditor"
  - Search Resources/Actions
  - Tooltip per cell: "Allows creating new assets"
- Step 3: Summary (List of granted permissions), "Create Role" / "Save Changes"

PERMISSION PREVIEW (In Role Card or User Detail):
- "As [Role Name], you can:" + Categorized List:
  - Assets: Create, Read, Update, Delete, Export, Import, Check-out, Check-in, Maintenance
  - Audits: Start, Scan, Reconcile, View Reports
  - Reports: View Pre-built, Create Custom, Schedule, Export
  - Administration: Manage Users, Roles, Sites, Webhooks, Branding, Billing

INHERITANCE VISUALIZATION:
- Inherited permissions shown with dashed checkbox
- Hover inherited → Shows "Inherited from [Base Role]"

REALISTIC DATA:
- 7 Built-in roles, 3 Custom roles
- Matrix with 14 Resources × 7 Actions = 98 cells
```

---

## Screen 3: Sites, Locations, Categories, Departments
```
Using the approved design system, create taxonomy management (4 similar screens, tabbed).

LAYOUT (Desktop):
- Shell + Main Content
- Page Header: "Sites & Locations" / "Categories" / "Departments" (H1) + "Create" (Primary, Lg)
- Tab Bar (Horizontal): Sites & Locations | Categories | Departments

TAB 1: SITES & LOCATIONS (Hierarchical Tree)
- Left Panel (350px): Site Tree (Nested, Drag-drop Reorder)
  - Site Node: Name, Location Count, Actions (Edit, Add Location, Delete)
  - Location Node (nested): Name, Asset Count, Actions (Edit, Delete)
  - Context Menu (Right-click): Add Child, Edit, Delete, Duplicate
  - Empty: "No sites yet" + "Add Site"
- Right Panel (Detail/Edit): Selected Site or Location Form
  - Site: Name*, Address, City, State, Country, Postal Code, Timezone, Description, Custom Fields
  - Location: Name*, Site* (Parent), Description, Custom Fields
  - "Save" (Primary), "Cancel" (Ghost)
- Inline Validation, Toast on Save

TAB 2: CATEGORIES (Flat List with Color/Icon)
- Table: Color Swatch, Icon, Name, Asset Count, Description, Actions (Edit, Delete)
- "Add Category" Modal: Name*, Color Picker (Preset + Custom), Icon Picker (Lucide), Description
- Inline Edit (Click Name), Drag-drop Reorder (for display order)
- Bulk Delete, Export

TAB 3: DEPARTMENTS (Flat List)
- Same as Categories but with Cost Center Code field
- Table: Name, Code, Asset Count, Description, Actions
- Modal: Name*, Code*, Description

COMMON BEHAVIOR:
- Inline Validation, Unique Name Check
- Delete Confirmation: "X assets use this. Reassign or delete assets first."
- Bulk Import (CSV): Name, Parent (for Locations), Color, Icon, Description

REALISTIC DATA:
- Sites: HQ-Building A (Floor 1, Floor 2, Floor 3), HQ-Building B, Warehouse-1, Remote
- Categories: Laptops (💻, Blue), Monitors (🖥️, Green), Desks (🪑, Orange), Chairs (🪑, Purple), Printers (🖨️, Red), Phones (📱, Cyan)
- Departments: Engineering (ENG), Marketing (MKT), Sales (SAL), HR (HRO), Finance (FIN), IT (ITD)
```

---

## Screen 4: Webhooks
```
Using the approved design system, create Webhook management.

LAYOUT (Desktop):
- Shell + Main Content (max-width 1200px)
- Page Header: "Webhooks" (H1) + "8 webhooks" + "Create Webhook" (Primary, Lg)

TABLE:
Columns: Name, URL (Truncated, Copy), Events (Chips: asset.created, asset.updated, audit.completed...), Status (Badge: Active=Success, Paused=Warning, Failed=Error), Last Delivery (Relative), Success Rate (%), Actions: Edit, Test, View Logs, Pause/Resume, Delete
- Row Hover: Highlight
- Bulk Actions: Pause Selected, Resume Selected, Delete Selected

CREATE/EDIT WEBHOOK MODAL (Large):
- Stepper: 1. Details → 2. Events → 3. Security → 4. Test
- Step 1: Name*, URL* (Validation: HTTPS, reachable), Description
- Step 2: Events Grid (Checkbox per Event, grouped by Resource):
  - Asset: created, updated, deleted, checked_out, checked_in, maintenance_started, maintenance_completed, disposed
  - Audit: session_started, session_completed, discrepancy_found
  - User: invited, activated, role_changed
  - Maintenance: wo_created, wo_completed, wo_overdue
  - Contract: expiring, renewed
  - "Select All" per Resource
- Step 3: Secret (Auto-generate 32-char, Show/Copy/Regenerate), Signature Header Name (Default: X-Signature), Retry Policy (Exponential Backoff, Max Attempts, Timeout)
- Step 4: Test Payload (JSON Editor, Pre-filled with Sample), "Send Test" → Shows Response: Status, Headers, Body, Latency
- "Save Webhook"

DELIVERY LOGS (Click "View Logs" → Drawer Large):
- Table: Timestamp, Event, Status (Success/Failed), HTTP Code, Latency, Request (Expandable JSON), Response (Expandable JSON), Retry Count
- Filter: Date Range, Event, Status
- "Retry Failed" (Secondary) for failed deliveries
- "Export Logs" (CSV)

WEBHOOK SECURITY:
- Signature: HMAC-SHA256(payload, secret) → Header X-Signature
- Timestamp Header: X-Timestamp (prevent replay)
- Idempotency Key Header: X-Idempotency-Key (for deduplication)

REALISTIC DATA:
- 8 webhooks: 5 Active, 2 Paused, 1 Failed
- Events: asset.created (45%), asset.updated (30%), maintenance_completed (15%), audit.completed (10%)
- Success Rate: 98.2%
```

---

## Screen 5: Branding & Customization
```
Using the approved design system, create Branding settings.

LAYOUT (Desktop):
- Shell + Main Content (max-width 1000px)
- Page Header: "Branding" (H1) + "Customize your workspace" (Text Secondary)

SECTIONS (Cards):
1. LOGO
   - Light Logo: Drop Zone (Preview, 200x60 max), "Remove"
   - Dark Logo: Drop Zone (Preview, 200x60 max), "Remove"
   - Favicon: Drop Zone (32x32, Preview)
   - Live Preview: Shows Top Bar with logos

2. COLORS
   - Primary Color: Picker (Shows Current, Contrast Ratio vs White/Black, WCAG AA/AAA Badge)
   - "Reset to Default" (Ghost)
   - Live Preview: Updates all Primary tokens in preview pane

3. LOGIN PAGE
   - Background: Color / Gradient / Image Upload (1920x1080 max)
   - Illustration: Select from Library (3 options) or Upload Custom
   - Custom CSS (Textarea, Advanced 🏷️) — "Warning: May break with updates"

4. EMAIL TEMPLATES
   - List: Invite, Password Reset, Alert, Report, Welcome
   - Each: "Customize" → Modal: Subject (Variables: {{org_name}}, {{user_name}}), Body (Markdown Editor, Preview), Test Send

5. PREVIEW PANE (Right, Sticky):
   - Tabs: Light Mode | Dark Mode | Login Page | Email
   - Interactive: Click buttons, see hover states

REALISTIC DATA:
- Logo: Acme Corp logo (Light/Dark)
- Primary: #2563EB (Blue 600) — Contrast 4.5:1 AA
- Login: Custom background image
```

---

## Screen 6: Subscription & Billing
```
Using the approved design system, create Subscription & Billing (Tenant Admin).

LAYOUT (Desktop):
- Shell + Main Content (max-width 1000px)
- Page Header: "Subscription" (H1) + Current Plan Badge (Pro, Enterprise, etc.)

SECTION 1: CURRENT PLAN
- Card: Plan Name (H3), Price/Month, Billing Cycle (Monthly/Annual, Save 20%), Features List (Checkmarks), "Upgrade" / "Downgrade" / "Cancel" (Destructive)

SECTION 2: USAGE
- Grid: Active Assets (1,247 / 2,000), Users (47 / 100), Storage (2.3 GB / 10 GB), API Calls (12,450 / 100K daily), Webhooks (8 / 20)
- Progress Bars with Warning at 80%, Error at 95%

SECTION 3: PAYMENT METHOD
- Card on File: •••• •••• •••• 4242 (Visa, Exp 12/2026), "Update"
- Add New Card Modal: Stripe Elements / Secure Fields

SECTION 4: INVOICES
- Table: Date, Invoice #, Amount, Status (Paid/Pending/Failed), Download PDF
- Pagination, "View All"

SECTION 5: USAGE HISTORY
- Chart: Line (Assets, Users, Storage over 12 months)
- "Export Usage Data" (CSV)

SECTION 6: BILLING CONTACTS
- List: Name, Email, Role (Owner/Admin/Finance), "Add Contact"

UPGRADE/DOWNGRADE MODAL:
- Plan Comparison (Cards: Free, Pro, Enterprise — Features, Limits, Price)
- Proration Preview: "Credit: $XX.XX, New Charge: $XX.XX"
- "Confirm Change"

CANCELLATION FLOW:
- "Cancel Subscription" → Feedback Form (Required) → Confirm (Type "CANCEL") → "Subscription cancelled, access until [Period End]"

REALISTIC DATA:
- Plan: Pro ($49/user/mo, billed annually)
- Usage: 1,247/2,000 assets, 47/100 users, 2.3/10 GB
- Next Invoice: $2,303.00 on 2024-02-01
```

---

## Screen 7: Audit Log (Admin)
```
Using the approved design system, create Admin Audit Log (immutable, tamper-evident).

LAYOUT (Desktop):
- Shell + Main Content (max-width 1400px)
- Page Header: "Audit Log" (H1) + "Immutable record of all administrative actions"

TOOLBAR:
- Search (User, Action, Resource, IP)
- Filters: Date Range (Presets: Today, 7d, 30d, 90d, Custom), Action Type (Create, Update, Delete, Login, Permission Change, Export, Import, Settings Change), User (Multi-select), Resource Type, Severity (Info, Warning, Critical)
- Export (CSV, JSON — includes Hash Chain), "Verify Integrity" (Ghost)

TABLE:
Columns: Timestamp (Sortable, Default Desc), User (Avatar+Name+Link), Action (Badge: Create=Success, Update=Warning, Delete=Error, Login=Info, Export=Info), Resource (Type + ID + Link), IP Address, User Agent, Hash (First 16 chars, Copy), Previous Hash (First 16 chars, Copy)
- Row Click → Detail Modal: Full JSON, Hash Chain Verification
- Pagination (Cursor), Virtualized, Max 10,000 rows per query

HASH CHAIN VERIFICATION:
- "Verify Integrity" Button → Runs Client-Side Verification: Computes Hash Chain from Oldest to Newest, Compares Stored Hashes
- Result Modal: "All 47,291 entries verified ✓" or "Tampering detected at Entry #X: Expected Hash Y, Stored Hash Z"

IMMUTABILITY INDICATORS:
- "🔒 Immutable" Badge in Header
- "Hash Chain Verified: 2024-01-15 10:30 UTC" Timestamp
- Export Includes: Full Entries + Hash Chain + Verification Script

REALISTIC DATA:
- 47,291 entries, Latest: "John Doe updated Asset LPT-0001 (Status: Assigned → In Repair)" 2 min ago
- Actions: 12,450 Updates, 8,320 Creates, 1,200 Deletes, 3,100 Logins, 450 Exports
```