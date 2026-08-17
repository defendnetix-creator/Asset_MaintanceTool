# Stitch Prompt: Post-Onboarding Dashboard (Complete Page Frame)
**Version:** 1.0.0  
**Purpose:** Show the exact full-page design a new user sees immediately after completing the 4-step Setup Wizard  
**Depends on:** Master Prompt approved  
**Generate:** After Master Prompt, before Batch 1 (or alongside Batch 1 for visual context)

---

## Screen: Post-Onboarding Dashboard (First-Time User Experience)

```
Using the approved design system, create a **single, complete page frame** showing the Dashboard exactly as a new IT Asset Manager sees it after clicking "Complete Setup" in the Setup Wizard.

This is NOT a component breakdown — it's a **full-page composition** showing visual hierarchy, spacing, and how all elements work together.

---

### PAGE STRUCTURE (Desktop ≥ 1025px)

#### TOP BAR (64px fixed)
- Left: Logo "Asset Maintenance Tool" (clickable → Dashboard)
- Center: Global Search (Cmd+K) — placeholder "Search assets, people, sites, audits..."
- Right: 
  - Notifications Bell (with "3" badge, Primary)
  - Theme Toggle (Light/Dark/System)
  - Avatar Menu (John Doe, IT Asset Manager, Acme Corporation) — shows dropdown on click

#### LEFT SIDEBAR (280px expanded, fixed)
- Navigation Groups (exact observed groupings, active: Dashboard):
  1. **Dashboard** (home) — **ACTIVE** (Primary left border, Primary text)
     - Overview
     - My Assets
     - Quick Actions
  2. **Assets** (box)
     - List
     - Add Asset
     - Import
     - Tags
     - Categories
  3. **Lifecycle** (refresh-cw)
     - Check-out
     - Check-in
     - Maintenance
     - Lease
     - Lease Return
     - Reserve
     - Move
     - Dispose
  4. **Audits** (clipboard-check)
     - Sessions
     - Schedule
     - Discrepancies
     - History
  5. **Reports** (bar-chart-2)
     - Pre-built
     - Custom Builder
     - Scheduled
  6. **Documents** (file-text)
     - Gallery
     - Images
  7. **Administration** (settings)
     - Users
     - Roles
     - Sites
     - Locations
     - Categories
     - Departments
     - Webhooks
     - Branding
     - Company/Subscription
- Collapse Button (top-right of sidebar, hamburger) → 72px icon-only mode
- Badge counts on Lifecycle (5 overdue), Audits (2 pending)

#### MAIN CONTENT AREA (Flexible, max-width 1400px, centered, padding 24px)

##### SECTION 1: WELCOME BANNER (First-time only, dismissible)
- Container: Surface Elevated, Border, Radius Large, Padding 20px, Margin-bottom 24px
- Left: Illustration (Check-circle, Success, 48px)
- Center: 
  - H2: "Welcome to Asset Maintenance Tool, John!"
  - Body: "Your workspace is ready. Here's a quick tour to get started."
- Right: "Take Tour" (Primary, Sm) | "Dismiss" (Ghost, Sm, sets localStorage flag)

##### SECTION 2: KPI CARDS ROW (4 cards, equal width, gap 24px, responsive grid)
**Card Design:** Surface, Border, Radius Large, Padding 24px, Hover (Lift + Shadow Level 2), Clickable → Filtered Asset List

| Card | Value | Label | Trend | Icon | Click Action |
|------|-------|-------|-------|------|--------------|
| 1 | **1,247** | Total Assets | "+12 this month" (Success) | Box (Primary) | Asset List (All) |
| 2 | **892** | Assigned | "12 overdue" (Warning) | User (Primary) | Asset List → Status=Assigned |
| 3 | **23** | In Repair | "3 critical" (Error) | Wrench (Warning) | Maintenance → Open |
| 4 | **8** | Warranty Expiring ≤30d | "Expiring soon" (Warning) | Shield (Warning) | Report: Warranty Expiring |

- Each Card: Icon (24px, Primary Light bg), Value (H1, 48px), Label (Body, Text Secondary), Trend (Caption, Color-coded), Clickable entire card (cursor pointer, hover lift)

##### SECTION 3: TWO-COLUMN LAYOUT (Gap 24px, 65% / 35%)

**LEFT COLUMN (65%): RECENT ACTIVITY FEED**
- Card: Surface, Border, Radius Large
- Header (Padding 20px, Border-bottom): 
  - H3 "Recent Activity" + "View All" (Ghost, Sm, Right) → Activity Log Page
- List (Virtualized, Infinite Scroll, Padding 16px):
  - Item 1 (2 min ago): 
    - Avatar (John Doe) + "**John Doe** checked out **LPT-0042**" + "2 min ago" (Text Muted) → Asset Detail Link
    - Subtle: "Due: 2024-02-15" (Warning)
  - Item 2 (15 min ago):
    - Avatar (System) + "Maintenance completed on **MON-0012**" + "15 min ago" → WO Detail Link
    - Subtle: "Technician: Sarah Smith" (Success)
  - Item 3 (1 hr ago):
    - Avatar (Mike Johnson) + "Audit session '**HQ-Floor-2**' completed" + "1 hr ago" → Audit Session Link
    - Subtle: "98% complete, 2 discrepancies" (Warning)
  - Item 4 (3 hr ago):
    - Avatar (Sarah Smith) + "Added asset **DSK-0100**" + "3 hr ago" → Asset Detail Link
  - Item 5 (5 hr ago):
    - Avatar (System) + "Warranty expiring for **PRN-0005**" + "5 hr ago" → Asset Detail Link
- "Load More" Button (Ghost, Centered, Margin-top 16px)

**RIGHT COLUMN (35%): MY ASSIGNED ASSETS**
- Card: Surface, Border, Radius Large
- Header (Padding 20px, Border-bottom):
  - H3 "My Assets" + "View All" (Ghost, Sm, Right) → Asset List → Custodian=Me
- Grid (2-col Desktop, 1-col Tablet, Gap 16px, Padding 16px, Max 6 items):
  - Card 1: **LPT-0001** (MacBook Pro 16")
    - Photo (16:10, 200x125, actual device photo)
    - Tag "LPT-0001" (H3, copyable)
    - "MacBook Pro 16" M3 Max (Body)
    - Status Badge: **Assigned** (Primary)
    - Location: "HQ-Building A > Floor 2 > Room 201" (Caption + Map-pin)
    - Due: "Due Feb 15" (Warning Badge)
    - Actions: "Report Issue" (Ghost, Sm) | "Initiate Return" (Ghost, Sm)
  - Card 2: **MON-0042** (Dell 27" Monitor)
    - Photo, Tag, Model, Status: **Assigned**, Location, Due: "Feb 28"
    - Actions: "Report Issue" | "Initiate Return"
  - Card 3: **DSK-0100** (Standing Desk)
    - Photo, Tag, Model, Status: **Assigned**, Location: "HQ-Building A > Floor 1 > Room 105"
    - No Due Date (Peripheral)
    - Actions: "Report Issue"
- "View All My Assets" (Ghost, Full-width, Margin-top 16px)

##### SECTION 4: QUICK ACTIONS BAR (Sticky Bottom on Scroll, Full-width)
- Container: Surface Elevated, Border-top, Padding 16px 24px, Flex Wrap, Gap 16px
- Primary: "Add Asset" (Box Icon, Primary, Lg)
- Secondary: "Start Audit" (Clipboard-check, Secondary, Lg)
- Secondary: "Run Report" (Bar-chart-2, Secondary, Lg)
- Secondary: "Scan Barcode" (Scan Icon, Secondary, Lg) → Opens Mobile PWA Scanner
- Ghost: "Import Assets" (Upload Icon, Ghost, Lg)

---

### RESPONSIVE BEHAVIOR

**Tablet (641px – 1024px):**
- Sidebar: Collapsed (72px icons only) by default, expandable on hover/click
- KPI Cards: 2×2 Grid
- Activity Feed + My Assets: Stacked (Activity first, full-width)
- My Assets Grid: 2-col
- Quick Actions: Horizontal Scroll

**Mobile (≤ 640px):**
- Top Bar: 56px, Hamburger → Drawer, Search Expands, Avatar Menu
- Sidebar: Full-height Overlay Drawer (Hamburger)
- KPI Cards: 2×2 Grid (Smaller Padding)
- Activity Feed: Full-width Cards
- My Assets: Horizontal Scroll Cards (Snap)
- Quick Actions: **Bottom Tab Bar** (56px, Fixed, Safe Area):
  1. Dashboard (Home, Active)
  2. Assets (Box)
  3. Lifecycle (Refresh-cw)
  4. Audits (Clipboard-check)
  5. More (Menu) → Drawer

---

### STATES (All Visible in Frame)

1. **Default** — As described above
2. **Loading** (Show skeleton frame):
   - KPI Cards: Gray Shimmer Rectangles
   - Activity Feed: 5 Skeleton Rows (Avatar + Lines)
   - My Assets: 3 Skeleton Cards (Photo + Lines)
   - Sidebar: Skeleton Nav Items
3. **Empty State** (If no assets assigned):
   - My Assets: Illustration + "No assets assigned to you" + "Browse Catalog" (Primary)
4. **Permission Denied** (If role lacks access):
   - Lock Icon + "You don't have access to this view" + "Contact Admin"
5. **Offline Banner** (Top, Yellow):
   - "⚠ You're offline. Changes sync when reconnected."
6. **Success Toast** (Bottom-right, Auto-dismiss 5s):
   - "✓ Asset LPT-0001 checked out to John Doe"
7. **First-Time Tour Active** (Optional Overlay):
   - Coach Mark on KPI Cards: "Your fleet at a glance"
   - Coach Mark on Quick Actions: "Common actions in one click"

---

### DARK MODE (Full Frame)
- Background: Slate 950
- Surface: Slate 900
- Surface Elevated: Slate 800
- Border: Slate 700
- Primary: #3B82F6 (Blue 500)
- Text Primary: Slate 50
- Text Secondary: Slate 400
- KPI Trend Colors: Success=#34D399, Warning=#FBBF24, Error=#F87171
- Shadows: rgba(0,0,0,0.3)
- All Components: Dark Mode Tokens Applied

---

### REALISTIC DATA (Exact Values for Frame)

**User:** John Doe | IT Asset Manager | Acme Corporation | john@acme.com
**Org:** Acme Corporation | Subdomain: acme-corp | Plan: Pro
**Assets:** 1,247 Total | 892 Assigned | 23 In Repair | 8 Warranty Expiring
**Activity:** 5 Items (Real Timestamps, Real Names, Real Asset Tags)
**My Assets:** 3 Assets (LPT-0001 MacBook Pro, MON-0042 Dell 27", DSK-100 Standing Desk)
**Overdue:** LPT-0001 (Due Feb 15), MON-0042 (Due Feb 28)
**Notifications:** 3 Unread (Asset Overdue, Maintenance Due, Warranty Expiring)

---

### OUTPUT REQUIREMENTS

Generate **ONE FIGMA-COMPATIBLE FRAME** at **1440×900px** (Desktop) showing the **entire page** scrolled to top.

Also generate:
- 1440px frame scrolled to Section 3 (Activity Feed mid-scroll)
- 768px Tablet Frame (Full Page)
- 375px Mobile Frame (Full Page with Bottom Tab Bar)
- Dark Mode Variants for all above

Annotate with:
- Component Names (from Master Prompt Library)
- Spacing Values (4px Scale)
- Focus Order Numbers
- ARIA Labels for Screen Readers
- Conditional Features 🏷️ (Welcome Banner, Tour Coach Marks)

---

**This frame is the "Money Shot" — the first thing a paying customer sees. Make it polished, confident, and welcoming.**
```

---

## How to Use

1. **Paste this entire prompt into Stitch** (after Master Prompt is approved)
2. **Generate** — You'll get ONE complete page frame showing the exact post-onboarding experience
3. **Review** — Check visual hierarchy, spacing, data density, welcoming tone
4. **Request Tweaks** — "Make KPI cards taller," "Activity feed too dense," "Welcome banner too prominent"
4. **Approve** → Then we proceed to Batch 1 (`01-AUTH-ONBOARDING.md`) for the actual onboarding screens that lead TO this page

---

This gives you the **"Money Shot" frame** — the complete visual of what a new user sees the moment they finish onboarding. No component breakdowns, just the full composed page.