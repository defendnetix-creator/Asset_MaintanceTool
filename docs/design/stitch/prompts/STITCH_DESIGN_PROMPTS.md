# Stitch Design Prompts – Asset Maintenance Tool
**Version:** 1.0.0  
**Status:** Draft – for review before generation  
**Last updated:** 2026-08-15  
**Owner:** Founding Product Architect  
**Related:** PRD-v1.0.0.md, PRD-TECHNICAL-v1.0.0.md

---

## Overview

This document contains the complete set of prompts to be used with Google Stitch to generate the UI/UX designs for the Asset Maintenance Tool. The prompts are organized into a **Master Prompt** (establishing the design system, tokens, shell, and reusable components) followed by **Batch Prompts** (each covering a coherent set of screens).

All prompts must be executed in sequence. Later batches **depend on** the design tokens, components, and shell established in earlier batches. Do not change the shell, tokens, or component library after Batch 1 without explicit approval.

---

## Stitch Project Setup

- **Project Name:** Asset Maintenance Tool – SaaS UI Design
- **Platform:** Responsive Web (Desktop, Tablet, Mobile)
- **Design System:** Custom – defined entirely in Master Prompt
- **Accessibility Target:** WCAG 2.1 AA
- **Responsive Breakpoints:** 
  - Mobile: ≤ 640px
  - Tablet: 641px – 1024px
  - Desktop: ≥ 1025px
- **Orientation:** Portrait & Landscape (mobile PWA)
- **Language:** English (en-US) – i18n-ready tokens
- **RTL Support:** Not required for MVP

---

## MASTER PROMPT (Run First)

```
You are an expert SaaS product designer creating a comprehensive design system and UI for **Asset Maintenance Tool**, a modern, multi-tenant asset-management application. The product helps growing organizations track physical assets (laptops, monitors, furniture, etc.) through their full lifecycle: procurement, assignment, maintenance, audit, and disposal.

### Brand & Visual Direction
- **Product Name:** Asset Maintenance Tool
- **Tagline:** "Know what you own. Trust where it is."
- **Tone:** Professional, trustworthy, efficient, calm. Not flashy.
- **Color Palette (Design Tokens):**
  - Primary: #2563EB (Blue 600) – trust, action
  - Primary Hover: #1D4ED8 (Blue 700)
  - Primary Light: #DBEAFE (Blue 50)
  - Secondary: #64748B (Slate 500) – neutral actions
  - Success: #059669 (Emerald 600)
  - Warning: #D97706 (Amber 600)
  - Error: #DC2626 (Red 600)
  - Info: #0891B2 (Cyan 600)
  - Background: #F8FAFC (Slate 50)
  - Surface: #FFFFFF (White)
  - Surface Elevated: #F1F5F9 (Slate 100)
  - Border: #E2E8F0 (Slate 200)
  - Text Primary: #0F172A (Slate 900)
  - Text Secondary: #475569 (Slate 600)
  - Text Muted: #94A3B8 (Slate 400)
  - Focus Ring: #2563EB at 2px offset
- **Typography:**
  - Font Family: Inter (system-ui fallback)
  - Scale: 
    - Display: 48px / 56px / 700
    - H1: 36px / 44px / 700
    - H2: 30px / 38px / 600
    - H3: 24px / 32px / 600
    - Body Large: 18px / 28px / 400
    - Body: 16px / 24px / 400
    - Body Small: 14px / 20px / 400
    - Caption: 12px / 16px / 500
    - Code: 13px / 20px / 400 (JetBrains Mono)
- **Spacing Scale:** 4px base unit (4, 8, 12, 16, 24, 32, 48, 64)
- **Border Radius:** 
  - Small: 4px
  - Medium: 8px
  - Large: 12px
  - Full: 9999px
- **Elevation/Shadow:**
  - Level 1 (card): 0 1px 2px rgba(15,23,42,0.05)
  - Level 2 (dropdown): 0 4px 6px -1px rgba(15,23,42,0.1), 0 2px 4px -2px rgba(15,23,42,0.1)
  - Level 3 (modal): 0 20px 25px -5px rgba(15,23,42,0.1), 0 8px 10px -6px rgba(15,23,42,0.1)
- **Motion:**
  - Fast: 150ms ease-out
  - Normal: 250ms ease-in-out
  - Slow: 350ms ease-in-out
- **Iconography:** Lucide icons (consistent stroke 2px, 24x24 base)
- **Density Options:** Comfortable (default), Compact (power users)

### Application Shell (Persistent Layout)
**Desktop/Tablet (≥ 641px):**
- **Top Bar (64px):** 
  - Left: Logo + Product Name (clickable → Dashboard)
  - Center: Global Search (Cmd+K) – searches assets, users, sites, audits
  - Right: Notifications (bell), User Avatar Menu (Profile, Settings, Switch Tenant, Sign Out), Theme Toggle (Light/Dark/System)
- **Left Sidebar (280px expanded, 72px collapsed):**
  - Navigation groups with icons:
    1. **Dashboard** (home) – Overview, My Assets, Quick Actions
    2. **Assets** (box) – List, Add Asset, Import, Tags, Categories
    3. **Lifecycle** (refresh-cw) – Check-out, Check-in, Maintenance, Reservations, Returns
    4. **Audits** (clipboard-check) – Sessions, Schedule, Discrepancies, History
    4. **Reports** (bar-chart-2) – Pre-built, Custom Builder, Scheduled
    5. **Administration** (settings) – Users, Roles, Sites, Webhooks, Branding, Billing (tenant admin+)
  - Collapsible via hamburger; shows only icons when collapsed
  - Active item highlighted with Primary color bar on left
  - Badge counts for overdue items, pending audits, alerts
- **Main Content Area:** Flexible, max-width 1400px centered, padding 24px (desktop), 16px (tablet)
- **Bottom Bar (Mobile only, 56px):** 5 primary tabs – Dashboard, Assets, Lifecycle, Audits, More

**Mobile (≤ 640px):**
- Top Bar (56px): Hamburger → Drawer, Search (expands), Avatar Menu
- Drawer: Full-height overlay with same navigation groups
- Bottom Tab Bar for primary flows

### System States (All Components Must Support)
1. **Default** – Normal interactive state
2. **Hover** – Desktop only, subtle background/scale change
3. **Focus** – Visible focus ring (Primary, 2px offset), never rely on outline:none
4. **Active/Pressed** – Scale 0.98, immediate feedback
5. **Disabled** – 40% opacity, cursor not-allowed, no focus ring
6. **Loading** – Skeleton screens for lists/tables; spinner for buttons; shimmer for cards
7. **Empty** – Illustration + descriptive text + primary action (e.g., "Add Asset")
8. **Error** – Inline error (red text + icon), toast for global, form field border red
9. **Permission Denied** – Lock icon + "You don't have access" + "Contact Admin" link
10. **Offline** – Banner "You're offline. Changes will sync when reconnected." + local-only indicator
11. **Destructive Confirmation** – Modal with red primary button, requires typing asset tag to confirm
12. **Success** – Toast (green) + subtle animation; inline for form submissions

### Reusable Component Library (Define Once, Use Everywhere)
1. **Button** – Variants: Primary, Secondary, Ghost, Destructive, Link. Sizes: Sm, Md, Lg. States: all 12 above. Icon support (leading/trailing).
2. **Input** – Text, Textarea, Select, Number, Date, DateTime, Search. Label, helper text, error message, prefix/suffix icon, clearable.
3. **Checkbox / Radio / Switch** – Label inline, group support, indeterminate for checkbox.
4. **Table** – Sortable columns, row selection (checkbox), pagination, column visibility toggle, density toggle, sticky header, horizontal scroll on mobile, row actions menu, expandable rows for details.
5. **Data Grid (Advanced)** – Virtualized, inline editing, bulk actions toolbar, column pinning, filtering row, export button.
6. **Card** – Media (image/avatar), title, subtitle, metadata badges, actions (dropdown), clickable whole card.
7. **Modal / Drawer** – Sizes: Sm, Md, Lg, Full. Backdrop blur, focus trap, ESC to close, prevent body scroll.
8. **Dropdown Menu** – Items with icons, dividers, dangerous section (red), keyboard navigation.
9. **Tabs** – Horizontal (default), Vertical (sidebar). Animated indicator.
10. **Breadcrumb** – Collapsible middle segments on mobile.
11. **Avatar** – Sizes: XS(24), Sm(32), Md(40), Lg(56), XL(72). Fallback: initials on colored circle.
12. **Badge** – Variants: Default, Success, Warning, Error, Info. Dot + text or text only.
13. **Tooltip / Popover** – Delay 200ms, smart positioning, dismiss on click outside.
14. **Toast / Snackbar** – Position: top-right (desktop), bottom (mobile). Auto-dismiss 5s, action button optional.
15. **Pagination** – Page numbers, prev/next, page size selector, total count.
16. **Filter Bar** – Collapsible sections, chips for active filters, clear all, save as view.
17. **Search Input** – Debounced, recent searches, suggested facets (asset, user, site, audit).
18. **Stepper / Progress** – Horizontal (forms), Vertical (wizard). Completed/current/pending states.
19. **File Upload** – Drag-drop zone, multiple, progress, remove, preview (images), validation errors.
20. **QR/Barcode Display** – SVG output, download PNG, print button, copy data URI.
21. **Scanner View (Mobile)** – Camera access, torch toggle, overlay guides, haptic on success, manual entry fallback.
22. **Label Preview** – Zoomable canvas, ZPL/EPL raw view, print dialog.
23. **Empty State Illustration** – Consistent style (outline, muted Primary), actionable.
24. **Confirmation Dialog** – Title, description, destructive/primary actions, optional text input for critical deletes.
25. **Sidebar Navigation Item** – Icon, label, badge, collapsible group, active indicator.

### Responsive Behavior Rules
- Tables → Cards on mobile (each row becomes a card with key fields)
- Filter Bar → Drawer on mobile
- Modal → Full-screen drawer on mobile (< 480px)
- Multi-column forms → Single column on mobile
- Sidebar → Overlay drawer on mobile
- Dense data grids → Horizontal scroll with sticky first column on tablet

### Accessibility Requirements (Non-Negotiable)
- Semantic HTML: proper heading hierarchy, landmarks (nav, main, aside, header, footer)
- Color contrast: ≥ 4.5:1 for text, ≥ 3:1 for UI components
- Focus visible: never remove focus styles; custom focus ring on all interactive elements
- Keyboard: all functionality reachable and operable via keyboard alone (Tab, Enter, Space, Arrows, Escape)
- ARIA: labels, descriptions, live regions for toasts/alerts, roles for custom components
- Reduced motion: respect `prefers-reduced-motion`; disable non-essential animations
- Screen reader: test with NVDA/VoiceOver; announce dynamic changes (filter results, toast)
- Language: `lang="en"` on html; `dir="ltr"`
- Touch targets: minimum 44x44px (mobile)

### Dark Mode
- Invert backgrounds: Slate 900/950 for backgrounds, Slate 50/100 for text
- Primary stays #3B82F6 (Blue 500) for contrast
- Surfaces: Slate 800/800 with subtle borders
- Shadows use rgba(0,0,0,0.3)
- All tokens defined for both light/dark; CSS custom properties for switching

### Print Styles
- Hide navigation, toolbars, actions
- Show full table content (no pagination)
- Asset labels: print-optimized ZPL/EPL preview → actual print via Zebra driver
- Page breaks: avoid breaking rows; repeat table headers

### Stitch Output Requirements
- Generate **Figma-compatible frames** for each screen
- Export **design tokens** as JSON (colors, spacing, typography, shadows, radii)
- Export **component variants** as separate frames (all 12 states per component)
- Include **responsive frames** for Mobile/Tablet/Desktop per screen
- Provide **interactive prototype links** for key flows (checkout, audit, maintenance)
- Annotate **accessibility notes** on each frame (focus order, ARIA labels, contrast)
- Mark **conditional features** (e.g., agent data panel only if agent enabled) with 🏷️ tag
- Use **realistic data** in designs (not lorem ipsum) – use sample asset tags: LPT-0001, MON-0042, DSK-0100

---

**After generating the Master Prompt output, STOP.** Do not proceed to Batch Prompts until the design system, shell, and component library are reviewed and approved. The client will confirm before we continue.
```

---

## BATCH PROMPTS (Run Sequentially After Master Approval)

### Batch 1: Authentication & Onboarding
```
Using the approved design system from Master Prompt, design the following screens:

1. **Landing Page (Public)** – Hero with tagline, feature highlights (Agent, Audit, Labels, Reports), customer logos, CTA "Start Free Trial", footer with links (Privacy, Terms, Security, Pricing).
2. **Sign In** – Email/password, "Forgot password?", "Sign in with SSO" buttons (Azure AD, Okta, Google), remember me, link to Sign Up.
3. **Sign Up (Trial)** – Organization name, subdomain (auto-suggest), admin name/email, plan selector (cards: Free, Pro, Enterprise), terms checkbox, reCAPTCHA.
4. **MFA Enrollment** – QR code for TOTP, manual entry code, backup codes download, "Skip for now" (if not enforced).
5. **Password Reset Request** – Email input, "Send reset link".
6. **Password Reset** – New password (strength meter), confirm, submit.
7. **First-Time Setup Wizard (4 Steps)** – 
   Step 1: Branding (logo, primary color picker)
   Step 2: Sites & Locations (add first site/location)
   Step 3: Invite Team (email list, role assign)
   Step 4: Asset Tag Format (prefix, numbering, preview)
   Each step: progress indicator, skip optional, complete → Dashboard.
8. **Invite Acceptance** – Tokenized link, set password, MFA optional, land on Dashboard.

All screens: responsive, accessible, loading/error/empty states where applicable. Use realistic sample data.
```

### Batch 2: Dashboard & Global Search
```
Using the approved design system, design:

1. **Main Dashboard (IT Asset Manager)** – 
   - Top: KPI cards (Total Assets, Assigned, In Repair, Overdue, Warranty Expiring ≤30d) – clickable to filtered list
   - Middle: Two columns:
     Left: Recent Activity Feed (asset created, checked out, maintenance completed, audit finished) – infinite scroll
     Right: My Assigned Assets (card grid: photo, tag, model, status, due date, quick actions)
   - Bottom: Quick Actions (Add Asset, Start Audit, Run Report, Scan Barcode)
   - Responsive: Stack on mobile, KPI cards 2x2 grid.
2. **Employee Self-Service Dashboard** – 
   - My Assets (cards), Request Asset button, Report Issue button, Recent Tickets.
3. **Global Search Results (Cmd+K Modal)** – 
   - Tabs: Assets, Users, Sites, Audits, Reports
   - Each result: icon, primary label, secondary metadata, tenant badge
   - Keyboard navigation (arrows, enter), recent searches, "View all in Assets" link.
4. **Notifications Center (Bell Dropdown → Full Page)** – 
   - Grouped by date, read/unread, actions (mark read, go to asset), filter by type.
5. **User Avatar Menu** – Profile, Settings, Switch Tenant (if multi-tenant), Theme, Help, Sign Out.

Responsive, accessible, dark mode, offline banner if applicable.
```

### Batch 3: Asset Registry (Core)
```
Using the approved design system, design:

1. **Asset List (Default View)** – 
   - Toolbar: Search, Filter Bar (collapsible: Status, Category, Site, Location, Department, Custodian, Date Range), View Toggle (Table/Card), Density, Column Picker, Export, Add Asset.
   - Table: Columns (selectable) – Tag, Photo, Make/Model, Serial, Category, Site/Location, Department, Custodian, Status, Purchase Date, Warranty, Actions.
   - Row hover: highlight, actions menu (View, Edit, Check-out, Maintenance, History, Delete).
   - Bulk Actions Bar (when rows selected): Check-out, Assign Location, Change Status, Export Selected, Delete.
   - Pagination (cursor), total count, page size.
   - Empty State: illustration + "No assets yet. Add your first asset."
2. **Asset List – Card View (Mobile/Tablet)** – 
   - Card: Photo/placeholder, Tag (large), Make/Model, Status badge, Location, Custodian avatar, quick action buttons.
3. **Asset Detail** – 
   - Header: Tag (copyable), Status badge, Photo carousel (thumbnails), Favorite/Watch button.
   - Tabs: Overview, Timeline, Documents, Audit History, Relationships.
   - Overview: Two-column grid of fields (Make, Model, Serial, Category, Site, Location, Department, Custodian, Purchase Date, Cost, Warranty, Notes).
   - Timeline: Chronological events (check-out, check-in, maintenance, audit scans, tag changes) with user, timestamp, diff.
   - Documents: Grid of attachments (preview, download, delete), Upload button.
   - Audit History: List of audit sessions this asset appeared in, result, discrepancies.
   - Relationships: Linked contracts, parent/child assets, associated tickets.
   - Actions: Edit, Check-out, Start Maintenance, Reserve, Print Label, Generate QR, Delete.
4. **Add/Edit Asset Form (Modal/Drawer)** – 
   - Sections: Identification (Tag*, Make*, Model, Serial, Category*), Assignment (Site*, Location*, Department, Custodian), Financial (Purchase Date, Cost, Currency, Warranty Expiry, Vendor), Custom Fields (dynamic), Notes.
   - Tag field: real-time normalization preview (uppercase, hyphens), uniqueness check (debounced).
   - Validation: inline errors, required markers, helpful hints.
   - Save Draft (localStorage), Submit, Cancel.
5. **Asset Import Preview** – 
   - Upload CSV/JSON → Preview table with validation columns (OK, Duplicate Tag, Missing Required, Invalid Reference).
   - Row-level accept/reject, "Accept All Valid", "Download Errors", "Commit Import".
   - Idempotency key shown.

Responsive, accessible, dark mode, loading skeletons, offline indicator for PWA.
```

### Batch 4: Lifecycle Workflows (Check-out, Check-in, Maintenance, Reserve, Return)
```
Using the approved design system, design:

1. **Check-out Flow** – 
   - Trigger: from Asset List (bulk), Asset Detail, or Dashboard Quick Action.
   - Step 1: Select Asset(s) (pre-filled if from detail).
   - Step 2: Select Custodian (user/group search, avatar, department).
   - Step 3: Expected Return Date (date picker, optional), Notes, Condition (Good/Fair/Needs Repair).
   - Step 4: Signature Capture (canvas, optional per policy), Photo of asset condition (optional).
   - Step 5: Confirmation → Success toast + PDF receipt (download/email).
   - Mobile: Full-screen stepper, camera for photo, signature canvas.
2. **Check-in Flow** – 
   - Similar stepper: Asset(s) → Condition Assessment (Good/Repair/Retire) → Notes → Signature → Photo → Confirm.
   - If Repair: auto-create Maintenance Work Order.
   - If Retire: branch to Disposal Flow.
3. **Maintenance Work Order** – 
   - List: Filterable (Open, In Progress, Completed, Overdue), Columns: WO#, Asset, Type, Technician, Started, Due, Status.
   - Detail: Asset info, Problem Description, Tasks Checklist (add/remove/reorder), Parts Used (select from inventory, qty, cost), Labor Hours, Downtime, Attachments, Notes.
   - Actions: Start Work, Pause, Complete, Add Part, Add Note, Print WO.
   - Mobile: Technician view – large touch targets, barcode scan to verify asset, voice-to-text for notes.
4. **Reserve Asset** – 
   - Modal: Asset, Requester, Start Date/Time, End Date/Time, Purpose, Approver (optional).
   - Calendar view showing asset availability.
5. **Lease / Return / Disposal** – 
   - Lease: Similar to check-out but with lease terms, recurring billing link, external customer.
   - Return: Lease return inspection, condition, refund/adjustment.
   - Disposal: Method (Recycle/Donate/Destroy/Resell), Vendor, Certificate Upload, Cost/Revenue, Final Audit Event.

All flows: stepper with progress, validation per step, save draft, offline-capable (cache steps), accessibility (focus management, ARIA live for errors).
```

### Batch 5: Audit & Inventory Sessions
```
Using the approved design system, design:

1. **Audit Dashboard** – 
   - Scheduled Audits (calendar view), In Progress, Completed, Overdue.
   - KPIs: Assets Audited This Month, Discrepancy Rate, Reconciliation Time Avg.
2. **Start Audit Session** – 
   - Scope Selector: Site, Location, Department, Category, or Custom Asset List (saved view).
   - Options: Assign Auditors (multi-select), Due Date, Notes.
   - "Start Now" → opens Scanner View.
3. **Scanner View (Mobile PWA – Critical)** – 
   - Full-screen camera with overlay (corner guides, center line).
   - Top Bar: Session name, progress (scanned/total), offline indicator, close (confirm).
   - Bottom: Manual Entry (large input), Torch, Switch Camera, History (last 5 scans).
   - On Scan Success: Haptic + sound, show asset card (tag, name, location match ✓/✗), quick status buttons (Found, Missing, Mismatched, Damaged), Notes, Photo.
   - Offline: "Cached 47/120 assets. 3 scans pending sync." Banner.
   - Swipe down to refresh/pull-to-sync.
4. **Audit Session Detail (Desktop)** – 
   - Summary Cards: Total, Found, Missing, Mismatched, Damaged.
   - Discrepancies Table: Asset Tag, Expected Location, Scanned Location, Status, Suggested Match (AI), Action (Confirm Match, Update Location, Mark Missing).
   - Reconciliation Panel: Side-by-side expected vs. found, bulk actions.
   - Export Discrepancy Report (PDF/CSV).
5. **Audit History** – 
   - List of completed sessions with summary stats, download report, re-open for review.

Scanner View must be highly optimized for mobile: large touch targets, minimal chrome, fast camera startup, works offline-first.
```

### Batch 6: Reports, Dashboards & Alerts
```
Using the approved design system, design:

1. **Report List** – 
   - Tabs: Pre-built, Custom, Scheduled.
   - Cards: Title, Description, Last Run, Next Run, Format, Actions (Run, Edit, Schedule, Delete, Duplicate).
   - Empty State for Custom: "Build your first custom report."
2. **Report Builder (Drag-and-Drop)** – 
   - Left Panel: Fields (Assets, Users, Sites, Events, Audit) – searchable, categorized.
   - Canvas: Drop zones for Rows, Columns, Values, Filters.
   - Visualization Picker: Table, Bar, Line, Pie, Area, Number, Pivot.
   - Preview Pane (live, sample data).
   - Settings: Title, Description, Default Filters, Permissions.
   - Save / Save As / Run / Schedule.
3. **Report Viewer** – 
   - Toolbar: Refresh, Export (CSV, XLSX, PDF), Share Link, Schedule, Edit.
   - Table: Sortable, filterable, pagination, column resize, totals row.
   - Chart: Interactive (hover tooltip, click to drill), responsive, legend toggle.
   - Parameters Bar (if report has prompts): Date Range, Site, etc. – apply without leaving page.
4. **Scheduled Report Config** – 
   - Recurrence: Daily, Weekly, Monthly, Quarterly, Custom Cron.
   - Recipients: Users, Groups, External Emails.
   - Format: PDF, CSV, XLSX.
   - Delivery: Email attachment, Link, Webhook, SFTP.
   - Timezone: Per-recipient or report default.
5. **Alert Builder** – 
   - Trigger: Asset Overdue, Warranty Expiring, Maintenance Due, Agent Offline, Audit Discrepancy, Custom Query.
   - Condition Builder: Field, Operator, Value (e.g., "Warranty Expiry ≤ 30 days").
   - Channels: Email, SMS, In-App, Webhook, Slack, Teams.
   - Throttling: Digest (daily/weekly), Immediate, Per-event.
   - Test Alert Button.

Responsive, accessible, dark mode, print styles for PDF export.
```

### Batch 7: Administration & Settings
```
Using the approved design system, design:

1. **User Management** – 
   - Table: Name, Email, Role, Status, Last Login, 2FA, Actions.
   - Invite User Modal: Email(s), Role, Send Invite.
   - Bulk Actions: Assign Role, Activate/Deactivate, Reset MFA, Delete.
   - User Detail: Profile, Roles, Permissions Matrix, Audit Log, Sessions, API Keys.
2. **Roles & Permissions** – 
   - Role Cards: Name, Description, User Count, Built-in/Custom badge.
   - Role Editor: Matrix (Resources × Actions) with checkboxes, inheritance from base role, custom role creation.
   - Permission Preview: "As IT Asset Manager, you can: [list]".
3. **Sites, Locations, Categories, Departments** – 
   - Each: Hierarchical tree (Sites > Locations), inline add/edit/delete, drag-drop reorder, bulk import.
   - Category/Department: Flat list with color/icon picker.
4. **Webhooks** – 
   - List: Name, URL, Events, Status, Last Delivery, Success Rate.
   - Create/Edit: URL, Secret (generate/copy), Events (checkbox grid), Retry Policy, Test Payload.
   - Delivery Log: Timestamp, Status, Response Code, Request/Response preview.
5. **Branding & Customization** – 
   - Logo (light/dark), Primary Color (picker with contrast check), Favicon, Login Background.
   - Preview in real-time.
6. **Subscription & Billing** – 
   - Current Plan, Usage (assets, users, storage), Upgrade/Downgrade, Payment Method, Invoices, Usage History.
7. **Audit Log (Admin)** – 
   - Filterable: Date, User, Action, Resource, IP.
   - Export, Immutable badge, Hash chain verification.
8. **Data Retention & Deletion** – 
   - Policy Table: Data Type, Retention Period, Action (Anonymize/Delete/Archive), Legal Hold.
   - DSR Request Tool: Search User, Preview Data, Execute Erasure/Export.

Responsive, accessible, confirmation dialogs for destructive actions.
```

### Batch 8: Endpoint Agent & Mobile PWA
```
Using the approved design system, design:

1. **Agent Management (Admin)** – 
   - Agent List: Asset Tag, Hostname, OS, Version, Last Seen, Status (Online/Offline/Stale), Actions.
   - Enrollment: Download links (MSI, PKG, DEB, RPM, AppImage), Enrollment Token (QR + copy), Group Policy/MDM instructions.
   - Configuration: Sync Interval, Data Categories (checkboxes), Privacy Mode, Auto-update.
   - Agent Log Viewer: Filterable, download.
2. **Agent Data Panel (Asset Detail – Conditional 🏷️)** – 
   - Shown only if agent enrolled and reporting.
   - Sections: Hardware (CPU, RAM, Disk, GPU, Battery), Software (installed list with versions, searchable, usage bars), OS (version, patch level, last reboot), Network (IP, VPN, SSID), Security (AV status, FW, Encryption), Last Sync.
   - "Refresh Now" button (sends push to agent).
3. **Mobile PWA – Install Prompt** – 
   - Smart banner (iOS Safari, Android Chrome), "Add to Home Screen" CTA.
   - Offline-first Service Worker registration flow.
4. **Mobile PWA – Home Screen** – 
   - Quick Actions: Scan Barcode, My Assets, Start Audit, Report Issue.
   - Recent Assets (horizontal scroll).
   - Sync Status Indicator.
5. **Mobile PWA – Settings** – 
   - Account, Notifications, Offline Data (clear cache, view size), Auto-sync (Wi-Fi only), Theme, Sign Out.

Agent screens: technical but clean. Mobile PWA: app-like, native feel, bottom tab bar.
```

### Batch 9: Label Designer & Printing
```
Using the approved design system, design:

1. **Label Template List** – 
   - Cards: Preview thumbnail, Name, Size (e.g., 2x1 in), Printer Type, Default badge.
   - Actions: Edit, Duplicate, Set Default, Delete, Print Test.
2. **Visual Label Designer** – 
   - Canvas: Zoomable, grid/snap, rulers, bleed area.
   - Left Palette: Elements – Barcode (Code128, QR, DataMatrix), Text Field (static/dynamic), Image/Logo, Line, Rectangle, Shape.
   - Right Panel: Element Properties – Content (bindings: {{asset_tag}}, {{serial_no}}, {{make}}, {{model}}, {{category}}, {{site}}, {{location}}, {{department}}, {{custodian}}, {{purchase_date}}, {{custom_field_x}}), Font, Size, Alignment, Color, Rotation, Barcode Settings (ECC level, module width).
   - Dynamic Field Picker: Searchable list of all asset fields + custom fields.
   - Preview: Live with sample asset data (cycle through 3 samples).
   - Toolbar: Undo/Redo, Save, Save As, Export ZPL/EPL, Export PDF, Print Test.
   - Template Variables Reference Panel (collapsible).
3. **Print Dialog** – 
   - Printer Selection (system printers + configured Zebra printers), Copies, Label Range (from/to asset tags), Cut Mode, Preview.
   - "Print to File" (ZPL/PDF) for batch printing via script.

Designer must feel like a modern design tool (Figma-lite). Keyboard shortcuts (V=select, T=text, B=barcode, I=image, Delete=remove, Cmd+Z=undo).
```

### Batch 10: Settings, Profile, Help & Edge Cases
```
Using the approved design system, design:

1. **User Profile** – 
   - Avatar, Name, Email, Phone, Timezone, Date/Time Format, Language, Theme.
   - Security: Password, MFA (add/remove), Sessions (list with revoke), API Keys.
   - Preferences: Notification defaults, Dashboard layout, Density, Compact mode.
2. **Organization Settings (Tenant Admin)** – 
   - General: Name, Subdomain, Logo, Timezone, Currency, Fiscal Year Start.
   - Security: Password Policy, MFA Enforcement, Session Timeout, IP Allowlist, SSO Config.
   - Data: Retention Policies, Export/Deletion Requests, Backup Schedule.
   - Integrations: Connected apps, API Keys, Webhooks.
3. **Help Center** – 
   - Search, Categories (Getting Started, Assets, Audits, Agent, Labels, Admin, Billing).
   - Article View: Table of Contents, Anchor Links, Copy Link, Feedback (Was this helpful?).
   - Contact Support Modal: Type, Subject, Description, Attachments, Priority.
4. **Empty States (All Variations)** – 
   - No assets, No audits, No results, No permissions, Offline, Error, Loading.
   - Consistent illustration style, actionable primary button.
5. **Error Pages** – 
   - 404, 403, 500, 503, Offline.
   - Friendly copy, "Go to Dashboard", "Contact Support", Retry button.
6. **Onboarding Tooltips / Feature Callouts** – 
   - Coach marks for new features, dismissible, "Don't show again".
7. **Command Palette (Cmd+K)** – 
   - Full design from Batch 2, but include all actions: "New Asset", "Start Audit", "Run Report", "Switch Tenant", "Settings", "Keyboard Shortcuts".

All screens: responsive, accessible, dark mode, consistent with shell.
```

---

## Design Review Checklist (Before Handoff to Engineering)

After all batches are generated, verify:

- [ ] All 12 system states exist for every component
- [ ] Responsive frames: Mobile, Tablet, Desktop for every screen
- [ ] Dark mode frames for every screen
- [ ] Design tokens exported as JSON (colors, spacing, typography, shadows, radii, breakpoints)
- [ ] Component library documented with variants and usage guidelines
- [ ] Accessibility annotations on every frame (focus order, ARIA, contrast ratios)
- [ ] Conditional features marked with 🏷️ (agent panel, label designer, AI features)
- [ ] Prototype links work for: Checkout flow, Audit scan flow, Maintenance WO, Report builder, Label designer
- [ ] Realistic sample data used throughout (no lorem ipsum)
- [ ] Print styles verified for label preview and report PDF
- [ ] Mobile PWA frames include: install prompt, offline banner, scanner view, bottom tab bar
- [ ] Stitch project shared with engineering team (view access)

---

## File Naming & Storage in Repository

All prompts and outputs stored under:

```
/docs/design/stitch/
├── prompts/
│   ├── 00-MASTER-PROMPT.md
│   ├── 01-BATCH-AUTH-ONBOARDING.md
│   ├── 02-BATCH-DASHBOARD-SEARCH.md
│   ├── 03-BATCH-ASSET-REGISTRY.md
│   ├── 04-BATCH-LIFECYCLE-WORKFLOWS.md
│   ├── 05-BATCH-AUDIT-INVENTORY.md
│   ├── 06-BATCH-REPORTS-ALERTS.md
│   ├── 07-BATCH-ADMIN-SETTINGS.md
│   ├── 08-BATCH-AGENT-MOBILE.md
│   ├── 09-BATCH-LABEL-DESIGNER.md
│   └── 10-BATCH-SETTINGS-EDGE-CASES.md
├── exports/
│   ├── design-tokens.json
│   ├── components/
│   └── screens/
└── README.md
```

---

## Next Steps

1. **Run Master Prompt** in Stitch → Review design system, shell, components.
2. **Client Approval** → Confirm visual direction, tokens, shell.
3. **Run Batch Prompts Sequentially** → Review each batch before proceeding.
4. **Final Review** → Complete checklist above.
5. **Handoff to Engineering** → Export tokens, components, frames; create implementation tickets.

---

*End of Stitch Design Prompts Document*