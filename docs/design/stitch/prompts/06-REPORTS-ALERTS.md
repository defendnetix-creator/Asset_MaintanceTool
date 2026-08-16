# Stitch Prompt: Reports, Dashboards & Alerts
**Version:** 2.0.0  
**Depends on:** Master Prompt + 05-AUDIT-INVENTORY  
**Generate after:** Audit & Inventory approved  

---

## Screen 1: Report List
```
Using the approved design system, create the Report List screen (landing for Reports navigation group).

LAYOUT (Desktop):
- Shell: Top Bar + Sidebar (Reports active) + Main Content (max-width 1400px, padding 24px)
- Page Header: "Reports" (H1) + "Analyze your asset data" (Text Secondary) + "Create Report" (Primary, Lg, right)

TABS (Horizontal, Sticky):
1. PRE-BUILT (Default)
2. CUSTOM
3. SCHEDULED

TAB 1: PRE-BUILT REPORTS
- Grid of Report Cards (3-col desktop, 2-col tablet, 1-col mobile)
- Card Design:
  - Header: Icon (Report-type specific), Title (H3), Category Badge
  - Description (Body, 2 lines max)
  - Meta: Last Run (Relative time), Next Run (if scheduled), Format Icons (CSV, XLSX, PDF)
  - Actions: "Run" (Primary), "Schedule" (Ghost), "Duplicate" (Ghost), "Delete" (Destructive, confirm) — hover to reveal
  - Hover: Lift + Shadow Level 2, Actions visible
- Categories (Section Headers): Asset Inventory, Lifecycle & Custody, Maintenance, Audits & Compliance, Financial, Warranty & Contracts
- Empty State (per category): "No reports in this category"

PRE-BUILT REPORT CATALOG (from evidence):
1. Assets by Asset Tag
2. Assets by Category
3. Assets by Department
4. Assets by Site/Location
5. Assets by Warranty Information
6. Assets by Tag with Pictures
7. Audit by Asset Tag
8. Audit History by Date
9. Audit by Site/Location Discrepancy
10. Audit by Funding Source
11. Check-out by Asset Tag
12. Check-out by Due Date
13. Check-out by Past Due
14. Check-out in Time Frame
15. Check-out by Person
16. Check-out by Site/Location
17. Leased Assets
18. Leased by Customer
19. Non-Audited Assets
20. Non-Audited Funding Assets
21. Custom Report (link to Custom Builder)

TAB 2: CUSTOM REPORTS
- Same card grid, but user-created reports
- Empty State: "Build your first custom report" + "Create Report" (Primary) → Report Builder
- Each card shows: "Created by [Name] on [Date]", "Last Modified"

TAB 3: SCHEDULED REPORTS
- Table View (better for dense info):
  Columns: Report Name, Frequency, Next Run, Recipients, Format, Status (Active/Paused/Failed), Last Run, Actions (Edit, Pause/Resume, Run Now, View History, Delete)
- Row Actions: Edit Schedule, Pause/Resume, Run Now, View History, Delete
- Bulk Actions: Pause Selected, Resume Selected, Delete Selected
- Empty: "No scheduled reports" + "Schedule a Report"

LAYOUT (Mobile):
- Tabs scrollable
- Cards stacked
- Scheduled: Card view with key info

REALISTIC DATA:
- Pre-built: 21 reports across 6 categories
- Custom: 5 user reports
- Scheduled: 8 active, 2 paused
```

---

## Screen 2: Report Builder (Drag-and-Drop)
```
Using the approved design system, create the Custom Report Builder.

LAYOUT (Desktop):
- Shell (Sidebar collapsed by default) + Main Content (full-width, padding 24px)
- Top Bar: "Report Builder" (H1) + "Untitled Report" (editable inline, H3) + Toolbar: Save (Primary), Save As (Ghost), Run Preview (Secondary), Schedule (Ghost), Settings (Ghost), Help (Ghost)

THREE-PANE LAYOUT (Resizable, Persisted):
LEFT PANE (300px, Collapsible): FIELD PANEL
- Search Fields (Input, debounced)
- Categories (Accordion):
  1. Assets (Tag, Make, Model, Serial, Category, Status, Site, Location, Department, Custodian, Purchase Date, Cost, Warranty Expiry, Custom Fields...)
  2. Users (Name, Email, Role, Department, Title, Phone)
  3. Sites/Locations/Departments/Categories
  4. Events (Check-out, Check-in, Maintenance, Lease, Audit, Disposal...)
  5. Audits (Session, Scope, Result, Discrepancy)
  6. Contracts/Warranties/Vendors
- Each Field: Drag Handle, Icon, Name, Type Badge (String, Number, Date, Boolean, Reference)
- Drag from here to Canvas

CENTER PANE (Flexible): CANVAS
- Drop Zones (Visual, labeled, dashed border when empty):
  1. ROWS (Group by) — "Drag fields here to group rows"
  2. COLUMNS (Group by) — "Drag fields here to group columns"
  3. VALUES (Aggregate) — "Drag numeric/date fields here to calculate"
  4. FILTERS — "Drag fields here to filter data"
- Each Dropped Field Chip: Field Name, Settings Icon (click → Modal: Aggregation: Count/Sum/Avg/Min/Max/Unique, Format, Sort, Show Totals), Remove Icon
- Reorder within zone (Drag)
- Move between zones (Drag)
- Visual Feedback: Drop target highlight, Ghost during drag

RIGHT PANE (350px, Collapsible): PREVIEW & SETTINGS
- Tabs: Preview | Visualization | Settings
- PREVIEW TAB: Live sample data (first 50 rows), Table or Chart, Updates on every canvas change
- VISUALIZATION TAB:
  - Type Selector (Radio Cards): Table, Bar Chart, Line Chart, Pie Chart, Area Chart, Number (KPI), Pivot Table, Scatter Plot
  - Chart Options (per type): X-Axis, Y-Axis, Series, Colors, Legend, Data Labels, Tooltip, Responsive
  - "Apply to Preview"
- SETTINGS TAB:
  - Report Title, Description
  - Default Filters (pre-set values)
  - Permissions (Who can view/edit: Private, Role-based, Public)
  - Row Limit (Default 1000, Max 10000)
  - Timezone for Date Fields

TOOLBAR ACTIONS:
- Save: Creates/Updates report in Custom Reports
- Save As: Duplicate with new name
- Run Preview: Opens Report Viewer Modal with full data
- Schedule: Opens Schedule Modal (pre-fills report)
- Settings: Opens Settings Tab in Right Pane

LAYOUT (Tablet):
- Left/Right panes as Drawers (toggle buttons in Toolbar)
- Canvas full-width

LAYOUT (Mobile):
- Not supported (Builder is desktop-only) — Show message "Report Builder is available on desktop. View reports on mobile."

KEYBOARD SHORTCUTS:
- Ctrl+S: Save
- Ctrl+Shift+S: Save As
- Ctrl+Enter: Run Preview
- Delete: Remove selected field chip
- Escape: Close modals/drawers

REALISTIC DATA:
- Sample dataset: 50 assets with all fields populated
- Preview updates in <200ms after drag
```

---

## Screen 3: Report Viewer
```
Using the approved design system, create the Report Viewer (run output for any report).

LAYOUT (Desktop):
- Shell + Main Content (max-width 1400px, padding 24px)
- Header: Report Title (H1, editable inline if owner) + Description + Toolbar: Refresh (Secondary), Export (Dropdown: CSV, XLSX, PDF), Share Link (Ghost), Schedule (Ghost), Edit (Ghost, if owner) + Parameters Bar (if report has prompts)

PARAMETERS BAR (if report has prompts, below header):
- Inputs per parameter: Date Range (Dual Date Picker), Site (Multi-select), Status (Multi-select), etc.
- "Apply" (Primary) — Re-runs report with params
- "Reset" (Ghost) — Clears to defaults
- Collapsible Chevron

REPORT BODY (Two modes based on Visualization):

MODE A: TABLE
- Data Grid Component:
  - Toolbar: Column Picker, Density, Freeze Columns, Show Totals, Page Size (25/50/100/All)
  - Columns: Sortable (click), Resizable (drag), Reorderable (drag), Filterable (filter row per column: text/number/date/select)
  - Rows: Virtualized, Striped, Hover Highlight, Row Click → Drill-down (if configured)
  - Totals Row (Bottom, Sticky): Sum/Avg/Count per column
  - Pagination: Cursor-based (Prev/Next, Page X of Y, Go to Page)
  - Loading: Skeleton rows
  - Empty: "No data matches current filters"

MODE B: CHART (Bar, Line, Pie, Area, Scatter, Number)
- Chart Container (Responsive, Aspect Ratio 16:9 default, Resizable)
- Interactive: Hover Tooltip (Value, Series, Category), Click Legend Toggle Series, Click Data Point → Drill-down
- Controls: Download PNG, Full Screen, Reset Zoom
- Responsive: Stacks on Mobile

MODE C: PIVOT TABLE
- Row Headers (Sticky), Column Headers (Sticky), Values Matrix
- Expand/Collapse Row Groups
- Grand Totals Row/Column

COMMON ELEMENTS:
- Footer: "Report generated [Relative Time] by [User]" + "Data as of [Timestamp]" + Row Count
- "View SQL / Query" (Ghost, for admins)

EXPORT MODAL (Click Export):
- Format: CSV (raw data), XLSX (formatted + charts), PDF (Report snapshot + charts)
- Options: Include Parameters, Include Totals, Include Charts, Page Size (A4/Letter), Orientation
- "Export" → Downloads file, Toast "Export ready"

SHARE LINK MODAL:
- Link (Copy), Expiry (Never / 7 days / 30 days), Permission (View Only / Can Edit)
- "Generate Link"

LAYOUT (Mobile):
- Table: Horizontal Scroll with Sticky First Column
- Chart: Full-width, Touch-zoom/Pan
- Parameters: Bottom Sheet
- Export/Share: Bottom Sheet

STATES:
- Loading (Skeleton), Empty, Error ("Failed to load report"), Offline (Cached Data Banner)

REALISTIC DATA:
- Table: 50 rows, 12 columns, sortable/filterable
- Bar Chart: Assets by Category (Laptops: 450, Monitors: 320, Desks: 180, Chairs: 150, Printers: 85, Phones: 62)
- Parameters: Date Range (Last 30 Days), Site (HQ-Building A)
```

---

## Screen 4: Scheduled Report Configuration
```
Using the approved design system, create Schedule Report modal (from Report List or Builder).

LAYOUT:
- Modal (Large, 600px)
- Stepper: 1. Report & Format → 2. Recurrence → 3. Recipients → 4. Delivery → 5. Confirm

STEP 1: REPORT & FORMAT
- Report Selector (Searchable, shows Pre-built + Custom)
- Format (Radio Cards): CSV, XLSX, PDF (with options per format)
- Parameters (if report has prompts): Pre-fill values or "Prompt at Runtime"

STEP 2: RECURRENCE
- Frequency (Radio): Daily, Weekly, Monthly, Quarterly, Custom Cron
- Weekly: Days of Week (Checkboxes M-Su)
- Monthly: Day of Month (1-28, Last Day)
- Quarterly: Month of Quarter (1st/2nd/3rd), Day
- Custom Cron: Expression Input + Human Readable Preview + Next 5 Runs Preview
- Start Date (Date Picker), End Date (Optional, Date Picker / Never)
- Timezone (Select, default Tenant Timezone)
- Run Time (Time Picker, default 06:00)

STEP 3: RECIPIENTS
- Add Recipient (Input: Email, Role, Group — Autocomplete)
- Chips: john@company.com (User), IT Asset Managers (Group), finance@company.com (External)
- Per Recipient: Format Override (Optional), Language (Optional)
- "Send me a copy" (Checkbox, default on for creator)

STEP 4: DELIVERY
- Method (Radio): Email Attachment, Secure Link (Expires in 7/30/90 days), Webhook (URL + Secret), SFTP (Host, Path, Credentials)
- Email Options: Custom Subject, Custom Body (Markdown), Attach Report
- Webhook: Payload Template (JSON, with {{report_data}}, {{run_timestamp}}), Retry Policy (Exponential Backoff, Max 5)
- SFTP: Test Connection Button

STEP 5: CONFIRM
- Summary Card: Report, Format, Schedule, Recipients, Delivery
- "Save Schedule" (Primary) → Creates Scheduled Report, navigates to Scheduled Tab

EDIT MODE:
- Pre-fills all steps, "Update Schedule" button
- "Pause Schedule" (Warning) / "Resume Schedule" (Success)
- "Run Now" (Secondary) → Triggers immediate generation

REALISTIC DATA:
- Report: "Assets by Category"
- Format: XLSX (with charts)
- Schedule: Weekly, Mondays 06:00, Start: 2024-01-22
- Recipients: john@company.com, IT Asset Managers Group
- Delivery: Email Attachment
```

---

## Screen 5: Alert Builder
```
Using the approved design system, create Alert Builder (from Reports or Administration).

LAYOUT:
- Modal (Large) or Drawer (Large)
- Stepper: 1. Trigger → 2. Condition → 3. Channels → 4. Throttling → 5. Test & Save

STEP 1: TRIGGER
- Trigger Type (Radio Cards):
  1. Asset Overdue (Check-out past due date)
  2. Warranty Expiring (Within X days)
  3. Maintenance Due (Scheduled WO due date)
  4. Agent Offline (No check-in > X hours)
  5. Audit Discrepancy (New discrepancy found)
  6. Custom Query (Advanced: SQL-like builder 🏷️)
- Scope: All Assets / Filtered (same Filter Bar as Asset List)

STEP 2: CONDITION
- Field Selector (Asset fields: Due Date, Warranty Expiry, Last Seen, Status, Custom Fields)
- Operator (Select): =, ≠, <, ≤, >, ≥, Between, In, Not In, Contains, Starts With, Is Empty, Is Not Empty
- Value Input (Context-aware: Date Picker, Number, Select, Text)
- Example: "Warranty Expiry ≤ 30 days" OR "Status = In Repair AND Due Date < Today"
- "Add Condition" (AND/OR grouping, parentheses)
- Live Preview: "3 assets match this condition"

STEP 3: CHANNELS
- Channel Cards (Checkbox per channel, expandable config):
  1. Email: Recipients (Users, Groups, External), Template (Subject/Body Markdown, Variables: {{asset_tag}}, {{due_date}}, {{asset_url}}), Priority (Normal/High)
  2. SMS: Recipients (Phone required), Template (160 chars), Provider (Twilio/Plivo)
  3. In-App: Notification Center (always on), Toast (Optional)
  4. Webhook: URL, Secret, Payload Template (JSON, Variables), Retry Policy
  5. Slack: Channel, Bot Token, Message Template (Blocks/Markdown)
  6. Teams: Channel, Webhook URL, Adaptive Card Template
- "Test Channel" Button per channel (sends test payload)

STEP 4: THROTTLING
- Mode (Radio): Immediate (Per Event), Digest (Daily at 08:00 / Weekly Monday 08:00), Summary (Per Asset per Period)
- Deduplication: "Don't alert again for same asset within X hours/days"
- Escalation (Optional): If not acknowledged in X hours → Escalate to (Role/User), Channel Upgrade

STEP 5: TEST & SAVE
- "Send Test Alert" (Primary) → Fires test payload to all configured channels with sample data
- Alert Name (Required), Description, Enabled (Switch, default On)
- "Save Alert" → Creates Alert, navigates to Alert List (in Administration)

ALERT LIST (Administration → Alerts):
- Table: Name, Trigger, Condition Summary, Channels, Throttling, Enabled, Last Fired, Next Check, Actions (Edit, Toggle, History, Delete)
- History Modal: Timestamp, Triggered Assets, Channels Sent, Status (Sent/Failed), Error Details

REALISTIC DATA:
- Alert: "Warranty Expiring Soon"
- Trigger: Warranty Expiring
- Condition: Warranty Expiry ≤ 30 days
- Channels: Email (IT Asset Managers), In-App, Webhook (ServiceNow)
- Throttling: Daily Digest at 08:00
```