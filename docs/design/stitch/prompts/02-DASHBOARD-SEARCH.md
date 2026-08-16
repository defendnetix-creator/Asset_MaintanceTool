# Stitch Prompt: Dashboard & Global Search
**Version:** 2.0.0  
**Depends on:** Master Prompt + 01-AUTH-ONBOARDING  
**Generate after:** Authentication screens approved  

---

## Screen 1: Main Dashboard (IT Asset Manager)
```
Using the approved design system, create the primary dashboard for IT Asset Manager role.

LAYOUT (Desktop):
- Shell: Top Bar + Left Sidebar (expanded) + Main Content (max-width 1400px, padding 24px)
- Page Title: "Dashboard" (H1), subtitle "Overview of your asset fleet" (Text Secondary)

SECTION 1: KPI Cards Row (4 cards, equal width, gap 24px)
Card 1: "Total Assets" — Value (large, H1), Icon (box), Trend "+5% vs last month" (Success), Click → Asset List filtered: All
Card 2: "Assigned" — Value, Icon (user), Trend "12 overdue" (Warning), Click → Asset List filtered: Status=Assigned
Card 3: "In Repair" — Value, Icon (wrench), Trend "3 critical" (Error), Click → Maintenance List filtered: Open
Card 4: "Warranty Expiring ≤30d" — Value, Icon (shield), Trend "8 assets" (Warning), Click → Report: Warranty Expiring

Card Design: Surface, Border, Padding 24px, Hover (lift + shadow Level 2), Focus (ring)

SECTION 2: Two-Column Layout (Gap 24px)
LEFT COLUMN (65%): Recent Activity Feed
- Card Header: "Recent Activity" (H3) + "View All" (Ghost, right)
- List (virtualized, infinite scroll): Each item = Avatar + Action Text + Timestamp + Asset Link
  Examples:
  - "John Doe checked out LPT-0042" (2 min ago) → Asset Link
  - "Maintenance completed on MON-0012" (15 min ago) → WO Link
  - "Audit session 'HQ-Floor-2' completed" (1 hr ago) → Audit Link
  - "Sarah Smith added asset DSK-0055" (3 hr ago) → Asset Link
- Empty State: "No recent activity" + illustration
- Load More button at bottom

RIGHT COLUMN (35%): My Assigned Assets
- Card Header: "My Assets" (H3) + "View All" (Ghost)
- Card Grid (2-col desktop, 1-col tablet): Each card = Photo/Placeholder (16:10), Tag (H3), Make/Model (Body), Status Badge, Location (Caption), Due Date (Warning if ≤7d), Quick Actions: "Report Issue" (Ghost, Sm) | "Initiate Return" (Ghost, Sm)
- Max 6 cards, "View All" → Asset List filtered: Custodian=Current User

SECTION 3: Quick Actions Bar (Full width, sticky bottom on scroll)
- Primary: "Add Asset" (Box icon)
- Secondary: "Start Audit" (Clipboard-check), "Run Report" (Bar-chart-2), "Scan Barcode" (Scan icon - opens mobile scanner PWA)
- Ghost: "Import Assets" (Upload icon)

LAYOUT (Tablet):
- KPI cards: 2x2 grid
- Activity Feed + My Assets: Stacked (Activity first)
- Quick Actions: Horizontal scroll

LAYOUT (Mobile):
- KPI cards: 2x2 grid (smaller padding)
- Activity Feed: Full-width cards
- My Assets: Horizontal scroll cards
- Quick Actions: Bottom Tab Bar (Dashboard, Assets, Lifecycle, Audits, More)

STATES:
- Loading: Skeleton for KPIs, Feed, Asset Cards
- Empty: Illustrations for Feed and My Assets
- Error: Toast "Failed to load dashboard data"
- Offline: Banner "Offline - showing cached data"

REALISTIC DATA:
- KPIs: 1,247 Total | 892 Assigned | 23 In Repair | 8 Warranty Expiring
- Activity: 15 items with real timestamps, user names, asset tags
- My Assets: 4-6 assets with photos, tags LPT-0001, MON-0042, DSK-0100, etc.
```

---

## Screen 2: Employee Self-Service Dashboard
```
Using the approved design system, create dashboard for Employee/End-User role.

LAYOUT (Desktop):
- Shell same, but Sidebar collapsed by default (icon-only)
- Page Title: "My Assets" (H1)

SECTION 1: My Assets Card Grid (3-col desktop, 2-col tablet, 1-col mobile)
- Each card: Photo (large), Tag (H3), Make/Model, Status Badge, Location, Due Date, Actions: "Report Issue", "Initiate Return", "View Details"
- Empty State: "No assets assigned" + "Browse Catalog" (Primary)

SECTION 2: Quick Actions (Card)
- "Request New Asset" (Primary, plus icon) → Asset Request Form
- "Report Issue" (Secondary, alert-triangle) → Issue Form
- "View Tickets" (Ghost, ticket) → My Tickets List

SECTION 3: Recent Activity (Personal)
- List: Your check-outs, returns, issues reported, upcoming due dates

LAYOUT (Mobile):
- Stacked, My Assets horizontal scroll or full-width cards
- Quick Actions as large touch targets

STATES: Same as Main Dashboard

REALISTIC DATA:
- 2-3 assigned assets, 1 overdue, 1 ticket open
```

---

## Screen 3: Global Search (Cmd+K Modal)
```
Using the approved design system, create global search modal (triggered by Cmd+K or Top Bar search).

LAYOUT:
- Modal (Large, centered, backdrop blur)
- Search Input (full-width, auto-focus, placeholder "Search assets, people, sites, audits...", clear button)
- Recent Searches (below input, clickable chips)
- Results Tabs (horizontal, scrollable): All | Assets | People | Sites | Audits | Reports
- Each Tab Panel: Virtualized list, grouped by type with section headers
- Result Item: Icon + Primary Label (Asset Tag / Name) + Secondary Metadata (Location / Role / Status) + Tenant Badge (if multi-tenant)
- Keyboard Navigation: Arrow Up/Down, Enter to select, Esc to close
- "View all in [Type]" link at bottom of each panel

SEARCH BEHAVIOR:
- Debounced 300ms
- Minimum 2 chars
- Highlight matched text in results
- Recent searches stored in localStorage (max 10)

LAYOUT (Mobile):
- Full-screen modal, search input at top, tabs sticky

STATES:
- Default, Loading (skeleton results), Empty ("No results for 'query'"), Error

REALISTIC DATA:
- Assets: LPT-0001 (MacBook Pro, HQ-Building A), MON-0042 (Dell 27", HQ-Floor 2)
- People: John Doe (IT Asset Manager), Sarah Smith (Employee)
- Sites: HQ-Building A, Warehouse-1
- Audits: HQ-Floor-2 (Completed), Warehouse Audit (In Progress)
```

---

## Screen 4: Notifications Center
```
Using the approved design system, create notifications (Bell dropdown → Full page).

DROPDOWN (from Top Bar Bell):
- Panel (360px wide, max-height 60vh, scrollable)
- Header: "Notifications" (H3) + "Mark all read" (Ghost, Sm) + "View All" (Ghost, Sm, right)
- List: Grouped by date (Today, Yesterday, This Week)
- Item: Icon (type-specific) + Title + Timestamp + Unread dot (Primary)
- Click → Navigate to relevant screen + mark read
- Empty: "No new notifications"

FULL PAGE (click "View All" or /notifications):
- Page Title: "Notifications" (H1)
- Toolbar: Filter (All/Unread/Read), Type (Asset, Audit, Maintenance, System), Date Range
- List (same as dropdown, paginated)
- Bulk Actions (when items selected): Mark Read, Mark Unread, Delete
- Infinite scroll

STATES:
- Loading (skeleton), Empty, Error

REALISTIC DATA:
- Types: Asset Overdue (Warning), Maintenance Due (Info), Warranty Expiring (Warning), Audit Complete (Success), Mention (Info)
```

---

## Screen 5: User Avatar Menu
```
Using the approved design system, create avatar dropdown menu.

LAYOUT:
- Dropdown (280px wide, anchored to avatar)
- Header: Avatar (Md), Name, Email, Role Badge
- Divider
- Items (Icon + Label):
  - Profile (user) → /profile
  - Settings (settings) → /settings
  - Switch Tenant (if multi-tenant) (globe) → /tenants
  - Theme Toggle (sun/moon) with submenu: Light / Dark / System
  - Help Center (help-circle) → /help
  - Sign Out (log-out, Destructive) → logout action
- Keyboard accessible (Arrow keys, Enter, Esc)

STATES:
- Hover (item background), Focus (ring), Disabled (if single tenant)
```

---

## Screen 6: Admin Dashboard (Tenant Admin)
```
Using the approved design system, create dashboard for Tenant Admin role.

LAYOUT:
- Same shell, additional Admin-only sections

SECTION 1: KPI Cards (5 cards)
- Total Users, Active Assets, Storage Used, API Calls (24h), Webhook Deliveries (24h)

SECTION 2: Two-Column
LEFT: Tenant Health (Storage bar, API rate limit gauge, Backup status)
RIGHT: Recent Admin Activity (User invites, Role changes, Settings updates, Webhook config)

SECTION 3: Quick Actions (Admin)
- "Invite User", "Configure SSO", "Manage Webhooks", "View Audit Log"

REALISTIC DATA:
- 47 users, 1,247 assets, 2.3 GB storage, 12,450 API calls, 98% webhook success
```