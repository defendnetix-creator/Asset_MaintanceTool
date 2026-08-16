# Stitch Design Master Prompt – Asset Maintenance Tool
**Version:** 2.0.0 (Updated with V7.1 Evidence Patterns)  
**Status:** Ready for Generation  
**Last updated:** 2026-08-16  
**Owner:** Founding Product Architect  

---

You are an expert SaaS product designer creating a comprehensive design system and UI for **Asset Maintenance Tool**, a modern, multi-tenant asset-management application. The product helps growing organizations track physical assets (laptops, monitors, furniture, etc.) through their full lifecycle: procurement, assignment, maintenance, audit, and disposal.

## Critical Design Reference: V7.1 Behavioral Evidence Patterns

**The following patterns were OBSERVED in the reference application (AssetTiger) and MUST be preserved in workflow structure** — visual design is modern/original, but **information architecture, navigation, screen layouts, and interaction flows follow these proven patterns:**

### Observed Navigation Structure (from 149 routes, 285 screens)
- **Left Sidebar Navigation Groups** (exact groupings from evidence):
  1. **Dashboard** → Overview, My Assets, Quick Actions
  2. **Assets** → List, Add, Import, Customize Form, Tags, Categories
  3. **Lifecycle** → Check-out, Check-in, Maintenance, Lease, Lease Return, Reserve, Move, Dispose
  4. **Audits** → Sessions, Schedule, Discrepancies, History
  5. **Reports** → Pre-built (by tag, category, site, custodian, warranty, checkout, lease, audit), Custom Builder, Scheduled
  6. **Documents** → Gallery, Images
  7. **Administration** → Users, Roles, Sites, Locations, Categories, Departments, Webhooks, Branding, Company/Subscription

### Observed Screen Layout Patterns (from 258 forms, 87 tables)

#### Asset List (Primary Workspace)
- **Toolbar**: Search → Filter Bar (collapsible) → View Toggle (Table/Card) → Density → Column Picker → Export → Add Asset
- **Table Columns** (observed): Tag, Photo, Make/Model, Serial, Category, Site/Location, Department, Custodian, Status, Purchase Date, Warranty, Actions
- **Row Actions**: View, Edit, Check-out, Maintenance, History, Delete (dropdown menu)
- **Bulk Actions Bar** (when rows selected): Check-out, Assign Location, Change Status, Export, Delete
- **Card View** (mobile): Photo, Tag (large), Make/Model, Status Badge, Location, Custodian Avatar, Quick Actions

#### Asset Detail (Tabbed Interface — Observed Tabs)
1. **Overview** — Two-column grid: Identification (Tag, Make, Model, Serial, Category) | Assignment (Site, Location, Department, Custodian) | Financial (Purchase Date, Cost, Warranty, Vendor) | Notes
2. **Timeline/Events** — Chronological: Check-out, Check-in, Maintenance, Lease, Audit Scans, Tag Changes (user, timestamp, diff)
3. **Documents/Images** — Grid with preview, download, delete, upload
4. **Audit History** — Sessions this asset appeared in, result, discrepancies
5. **Relationships** — Linked contracts, parent/child assets, associated tickets

#### Add/Edit Asset Form (Observed Sections)
1. **Identification** — Asset Tag* (real-time normalization: uppercase, hyphens only), Make*, Model, Serial, Category*
2. **Assignment** — Site*, Location*, Department, Custodian (user/group search)
3. **Financial** — Purchase Date, Cost, Currency, Warranty Expiry, Vendor
4. **Custom Fields** — Dynamic (tenant-defined)
4. **Notes** — Free text
- **Tag Field Behavior**: Real-time normalization preview, debounced uniqueness check, inline error if duplicate

#### Lifecycle Workflows (Observed Stepper Patterns)
**Check-out Wizard** (5 steps): Select Assets → Select Custodian → Expected Return Date/Condition/Notes → Signature Capture (canvas) + Photo → Confirm → PDF Receipt
**Check-in Wizard**: Select Assets → Condition Assessment (Good/Repair/Retire) → Notes → Signature → Photo → Confirm
**Maintenance Work Order**: Problem → Tasks Checklist → Parts Used (qty/cost) → Labor Hours → Downtime → Attachments → Complete

#### Audit Scanner (Mobile PWA — Critical Pattern)
- **Full-screen camera** with corner guides + center line overlay
- **Top Bar**: Session name, progress (scanned/total), offline indicator, close (confirm)
- **Bottom**: Manual Entry (large input), Torch, Switch Camera, History (last 5 scans)
- **On Scan**: Haptic + sound → Asset card (tag, name, location match ✓/✗) → Status buttons (Found, Missing, Mismatched, Damaged) → Notes → Photo
- **Offline Banner**: "Cached X/Y assets. Z scans pending sync."
- **Pull-to-sync** on reconnect

#### Reports (Observed Categories)
- **Pre-built Tabs**: By Asset Tag, Category, Site/Location, Department, Custodian, Warranty, Checkout, Lease, Audit
- **Custom Builder**: Drag-drop fields (Assets, Users, Sites, Events, Audit) → Rows/Columns/Values/Filters → Visualization (Table, Bar, Line, Pie, Pivot)
- **Scheduled**: Recurrence, Recipients, Format (PDF/CSV/XLSX), Delivery (Email/Link/Webhook)

---

## Brand & Visual Direction (OUR Original Design — NOT cloned)

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
  - Scale: Display 48/56/700, H1 36/44/700, H2 30/38/600, H3 24/32/600, Body Large 18/28/400, Body 16/24/400, Body Small 14/20/400, Caption 12/16/500, Code 13/20/400 (JetBrains Mono)
- **Spacing Scale:** 4px base unit (4, 8, 12, 16, 24, 32, 48, 64)
- **Border Radius:** Small 4px, Medium 8px, Large 12px, Full 9999px
- **Elevation/Shadow:** Level 1 (card): 0 1px 2px rgba(15,23,42,0.05), Level 2 (dropdown): 0 4px 6px -1px rgba(15,23,42,0.1), Level 3 (modal): 0 20px 25px -5px rgba(15,23,42,0.1)
- **Motion:** Fast 150ms ease-out, Normal 250ms ease-in-out, Slow 350ms ease-in-out
- **Iconography:** Lucide icons (consistent stroke 2px, 24x24 base)
- **Density Options:** Comfortable (default), Compact (power users)

---

## Application Shell (Persistent Layout — Matches Observed Structure)

### Desktop/Tablet (≥ 641px)
- **Top Bar (64px):** 
  - Left: Logo + Product Name (clickable → Dashboard)
  - Center: Global Search (Cmd+K) – searches assets, users, sites, audits
  - Right: Notifications (bell), User Avatar Menu (Profile, Settings, Switch Tenant, Sign Out), Theme Toggle (Light/Dark/System)
- **Left Sidebar (280px expanded, 72px collapsed):**
  - Navigation groups with icons **(exact observed groupings):**
    1. **Dashboard** (home) – Overview, My Assets, Quick Actions
    2. **Assets** (box) – List, Add Asset, Import, Customize Form, Tags, Categories
    3. **Lifecycle** (refresh-cw) – Check-out, Check-in, Maintenance, Lease, Lease Return, Reserve, Move, Dispose
    4. **Audits** (clipboard-check) – Sessions, Schedule, Discrepancies, History
    5. **Reports** (bar-chart-2) – Pre-built, Custom Builder, Scheduled
    6. **Documents** (file-text) – Gallery, Images
    7. **Administration** (settings) – Users, Roles, Sites, Locations, Categories, Departments, Webhooks, Branding, Company/Subscription
  - Collapsible via hamburger; shows only icons when collapsed
  - Active item highlighted with Primary color bar on left
  - Badge counts for overdue items, pending audits, alerts
- **Main Content Area:** Flexible, max-width 1400px centered, padding 24px (desktop), 16px (tablet)
- **Bottom Bar (Mobile only, 56px):** 5 primary tabs – Dashboard, Assets, Lifecycle, Audits, More

### Mobile (≤ 640px)
- Top Bar (56px): Hamburger → Drawer, Search (expands), Avatar Menu
- Drawer: Full-height overlay with same navigation groups
- Bottom Tab Bar for primary flows

---

## System States (All Components Must Support)
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

---

## Reusable Component Library (Define Once, Use Everywhere)
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

---

## Responsive Behavior Rules
- Tables → Cards on mobile (each row becomes a card with key fields)
- Filter Bar → Drawer on mobile
- Modal → Full-screen drawer on mobile (< 480px)
- Multi-column forms → Single column on mobile
- Sidebar → Overlay drawer on mobile
- Dense data grids → Horizontal scroll with sticky first column on tablet

---

## Accessibility Requirements (Non-Negotiable)
- Semantic HTML: proper heading hierarchy, landmarks (nav, main, aside, header, footer)
- Color contrast: ≥ 4.5:1 for text, ≥ 3:1 for UI components
- Focus visible: never remove focus styles; custom focus ring on all interactive elements
- Keyboard: all functionality reachable and operable via keyboard alone (Tab, Enter, Space, Arrows, Escape)
- ARIA: labels, descriptions, live regions for toasts/alerts, roles for custom components
- Reduced motion: respect `prefers-reduced-motion`; disable non-essential animations
- Screen reader: test with NVDA/VoiceOver; announce dynamic changes (filter results, toast)
- Language: `lang="en"` on html; `dir="ltr"`
- Touch targets: minimum 44x44px (mobile)

---

## Dark Mode
- Invert backgrounds: Slate 900/950 for backgrounds, Slate 50/100 for text
- Primary stays #3B82F6 (Blue 500) for contrast
- Surfaces: Slate 800/800 with subtle borders
- Shadows use rgba(0,0,0,0.3)
- All tokens defined for both light/dark; CSS custom properties for switching

---

## Print Styles
- Hide navigation, toolbars, actions
- Show full table content (no pagination)
- Asset labels: print-optimized ZPL/EPL preview → actual print via Zebra driver
- Page breaks: avoid breaking rows; repeat table headers

---

## Stitch Output Requirements
- Generate **Figma-compatible frames** for each screen
- Export **design tokens** as JSON (colors, spacing, typography, shadows, radii, breakpoints)
- Export **component variants** as separate frames (all 12 states per component)
- Include **responsive frames** for Mobile/Tablet/Desktop per screen
- Provide **interactive prototype links** for key flows (checkout, audit, maintenance)
- Annotate **accessibility notes** on each frame (focus order, ARIA labels, contrast)
- Mark **conditional features** (e.g., agent data panel only if agent enabled) with 🏷️ tag
- Use **realistic data** in designs (not lorem ipsum) – sample asset tags: LPT-0001, MON-0042, DSK-0100

---

**After generating the Master Prompt output, STOP.** Do not proceed to Batch Prompts until the design system, shell, and component library are reviewed and approved. The client will confirm before we continue.