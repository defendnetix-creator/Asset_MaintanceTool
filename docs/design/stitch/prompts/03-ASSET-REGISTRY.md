# Stitch Prompt: Asset Registry (Core)
**Version:** 2.0.0  
**Depends on:** Master Prompt + 01-AUTH-ONBOARDING + 02-DASHBOARD-SEARCH  
**Generate after:** Dashboard approved  

---

## Screen 1: Asset List (Default View - Table)
```
Using the approved design system, create the primary Asset List screen (table view).

LAYOUT (Desktop):
- Shell: Top Bar + Left Sidebar (Assets group active) + Main Content (max-width 1400px, padding 24px)
- Page Header: "Assets" (H1) + "1,247 assets" (Text Secondary) + "Add Asset" (Primary, Lg, right)

TOOLBAR (sticky, below header, gap 16px, flex-wrap):
1. Search Input (width 300px, placeholder "Search by tag, serial, model...", clear button, recent searches dropdown)
2. Filter Bar (collapsible, trigger button "Filters (5)" with badge count):
   - Expandable sections: Status (checkboxes: In Stock, Assigned, In Repair, On Loan, Retired, Disposed), Category (multi-select), Site (multi-select), Location (multi-select, dependent on Site), Department (multi-select), Custodian (user search), Date Range (Purchase Date / Warranty Expiry)
   - Chips for active filters (removable), "Clear All", "Save as View"
3. View Toggle (Segmented: Table | Cards) — default Table
4. Density Toggle (Comfortable / Compact) — tooltip on hover
5. Column Picker (Dropdown: checkboxes for all columns, drag to reorder, persist in localStorage)
6. Export (Dropdown: CSV, XLSX, JSON — respects current filters/sort/columns)
7. Import (Secondary, Upload icon) → opens Import Preview modal

TABLE (Data Grid Component):
- Toolbar above: "1,247 assets" | Page size selector (25/50/100) | Pagination (Prev/Next, Page X of Y, Go to page)
- Columns (default visible, user-customizable):
  1. Selection (checkbox, header: select all on page / select all 1,247)
  2. Tag (copyable, link to Asset Detail, Primary color)
  3. Photo (thumbnail 48x48, hover zoom)
  4. Make / Model (Make bold, Model normal)
  4. Serial (monospace, copyable)
  5. Category (Badge, color-coded by category)
  6. Site / Location (Site > Location, truncate with tooltip)
  7. Department (Badge, muted)
  8. Custodian (Avatar + Name, link to User Profile, "Unassigned" muted)
  9. Status (Badge: In Stock=Default, Assigned=Primary, In Repair=Warning, On Loan=Info, Retired=Muted, Disposed=Error)
  10. Purchase Date (formatted per user locale)
  11. Warranty Expiry (Badge Warning if ≤30d, Error if expired)
  12. Actions (Dropdown Menu: View, Edit, Check-out, Start Maintenance, History, Print Label, Generate QR, Delete)

TABLE BEHAVIOR:
- Sortable columns (click header, tri-state: asc/desc/none), multi-sort (Shift+click)
- Row hover: highlight row, show actions button
- Row click (non-action): navigate to Asset Detail
- Sticky header, horizontal scroll with sticky Tag column
- Virtualized rows (1000+ performant)
- Loading: skeleton rows
- Empty: "No assets match your filters" + "Clear Filters" + "Add Asset"

BULK ACTIONS BAR (appears when ≥1 row selected, sticky bottom):
- Selected count: "3 selected"
- Actions: Check-out (Primary), Assign Location (Secondary), Change Status (Secondary), Export Selected (Ghost), Delete (Destructive, confirm modal)
- "Clear Selection"

LAYOUT (Tablet):
- Toolbar: horizontal scroll
- Table: horizontal scroll, sticky Tag column
- Bulk bar: stacked buttons

LAYOUT (Mobile):
- Toolbar: collapsible into Filter Bar drawer
- View: Card Grid (see Screen 2)
- No table

STATES:
- Default, Loading (skeleton rows + toolbar), Empty, Error (toast), Offline (banner)

REALISTIC DATA:
- 1,247 rows, sample tags: LPT-0001, LPT-0002, MON-0042, DSK-0100, PRN-0005, CHR-0234
- Mixed statuses, categories, sites, custodians
```

---

## Screen 2: Asset List (Card View - Mobile/Tablet)
```
Using the approved design system, create Asset List card view (default on mobile, toggle on tablet).

LAYOUT:
- Same shell, toolbar (View Toggle shows Cards active)
- Grid: 1-col mobile, 2-col tablet, 3-col desktop (when toggled)

CARD DESIGN (16:10 aspect for photo area):
- Photo: full-width, 16:10, object-fit cover, placeholder if none (box icon + "No photo")
- Overlay: Status Badge (top-right), Favorite/Watch icon (top-left, toggle)
- Content: Tag (H3, copyable), Make/Model (Body), Category Badge, Location (Caption + map-pin icon), Custodian Avatar + Name (link), Due Date (Warning if ≤7d)
- Actions Row (3 icons): View (eye), Check-out (log-out), More (dropdown: Edit, Maintenance, History, Label, QR, Delete)

INTERACTION:
- Tap card → Asset Detail
- Long press → multi-select mode (checkboxes appear, bulk bar shows)

EMPTY STATE: "No assets found" illustration + "Add Asset" (Primary)

REALISTIC DATA: Same as table, optimized for card layout
```

---

## Screen 3: Asset Detail
```
Using the approved design system, create Asset Detail screen (tabbed interface).

LAYOUT (Desktop):
- Shell + Main Content (max-width 1200px, padding 24px)
- HEADER (sticky top, background Surface, border-bottom):
  - Left: Back button (Ghost) + "Assets" link + " / " + Tag (H1, copyable)
  - Center: Status Badge (large), Favorite/Watch toggle
  - Right: Photo Carousel (thumbnails below, main image 400x300, zoom on click, full-screen modal), "Add Photo" (Ghost, Sm)
  - Actions: "Edit" (Secondary), "Check-out" (Primary, if In Stock), "Maintenance" (Warning, if not In Repair), "Print Label" (Ghost), "Generate QR" (Ghost), "More" (Dropdown: Reserve, Move, Dispose, History, Delete)

TABS (Horizontal, animated indicator, sticky below header):
1. OVERVIEW
2. TIMELINE
3. DOCUMENTS
4. AUDIT HISTORY
5. RELATIONSHIPS

TAB 1: OVERVIEW (Two-column grid, gap 24px)
LEFT COLUMN (60%):
- Section: Identification (Card)
  - Fields: Tag (copyable), Make, Model, Serial (monospace, copyable), Category (link to Category), Custom Fields (dynamic)
- Section: Assignment (Card)
  - Fields: Site > Location (link to Site), Department (link), Custodian (Avatar + Name, link to User, "Unassigned"), Assigned Date
- Section: Financial (Card)
  - Fields: Purchase Date, Cost (currency formatted), Vendor, Warranty Expiry (Badge Warning/Error), Depreciation (if enabled)
- Section: Notes (Card) — full-width, markdown render

RIGHT COLUMN (40%):
- Quick Actions Card: Check-out, Start Maintenance, Reserve, Print Label, Generate QR, Move, Dispose
- Related Links Card: Category, Site, Location, Department, Vendor, Contract (all links)
- Status History Card: Mini timeline (last 5 events)

TAB 2: TIMELINE (Chronological Events)
- Filter: Event Type (Check-out, Check-in, Maintenance, Lease, Audit, Tag Change, All)
- List (virtualized, grouped by date): Each event = Icon + Type + Description + User (Avatar+Name) + Timestamp + Diff (expandable)
- Diff View: Old Value → New Value (side-by-side, color-coded)
- "Load More" pagination

TAB 3: DOCUMENTS
- Grid: Thumbnail (PDF icon / image preview), Name, Type, Size, Uploaded By, Date
- Actions: Preview (modal), Download, Delete (confirm)
- Upload Button (Drag-drop zone, multiple, progress, validation)
- Empty: "No documents" + "Upload Document"

TAB 4: AUDIT HISTORY
- Table: Session Name, Date, Scope, Result (Found/Missing/Mismatch), Discrepancies, Report Link
- Click row → Audit Session Detail

TAB 5: RELATIONSHIPS
- Sections: Contracts (linked), Parent/Child Assets, Associated Tickets, Custom Links
- Each: Link to related entity, relationship type

LAYOUT (Mobile):
- Header collapsible, Tabs become scrollable bottom bar (or top sticky)
- Overview: Stacked sections, Quick Actions as sticky bottom bar
- Timeline: Full-width cards
- Documents: Single-column grid

STATES:
- Loading (skeleton per tab), Empty (per tab), Error (toast), Permission Denied (lock icon + message)

REALISTIC DATA:
- Asset: LPT-0001 | MacBook Pro 16" | M3 Max | Serial: C02XYZ123 | Category: Laptops | Site: HQ-Building A > Floor 2 > Room 201 | Dept: Engineering | Custodian: John Doe | Status: Assigned | Purchase: 2024-01-15 | Cost: $3,499 | Warranty: 2027-01-15
- Timeline: 12 events (check-out, check-in, maintenance, audit scans)
- Documents: 3 files (PDF spec, JPG photo, XLSX invoice)
- Audit History: 2 sessions (HQ-Floor-2, Annual-2024)
```

---

## Screen 4: Add/Edit Asset Form (Drawer/Modal)
```
Using the approved design system, create Add/Edit Asset form (Drawer on desktop/tablet, Full-screen on mobile).

LAYOUT (Desktop):
- Drawer (Large, 600px, from right, backdrop blur)
- Header: "Add Asset" / "Edit Asset: LPT-0001" (H2) + Close (Esc)
- Progress Stepper (top): Identification → Assignment → Financial → Custom → Notes → Complete
- Form validates per step before Next

STEP 1: IDENTIFICATION
- Asset Tag* (Input, real-time normalization: uppercase, hyphens only, debounced uniqueness check — shows "Available" / "Taken" with existing asset link)
- Make* (Input, autocomplete from existing makes)
- Model* (Input, autocomplete from existing models for selected make)
- Serial (Input, monospace, optional, uniqueness check)
- Category* (Select, searchable, shows category color badge)
- "Next" (Primary, disabled until required valid)

STEP 2: ASSIGNMENT
- Site* (Select, searchable, required)
- Location* (Select, searchable, dependent on Site, required)
- Department (Select, searchable)
- Custodian (User/Group Search, avatar + name, "Unassigned" option)
- Condition (Select: New, Good, Fair, Needs Repair)
- "Back" (Ghost) | "Next" (Primary)

STEP 3: FINANCIAL
- Purchase Date (Date Picker)
- Cost (Number Input, currency selector, 2 decimals)
- Vendor (Select, searchable, "Add New" link)
- Warranty Expiry (Date Picker, optional)
- "Back" | "Next"

STEP 4: CUSTOM FIELDS (Dynamic)
- Rendered from tenant's custom field definitions
- Each field: appropriate input type, validation, helper text
- "Back" | "Next"

STEP 5: NOTES
- Textarea (markdown support, preview toggle)
- "Back" | "Submit" (Primary, "Create Asset" / "Save Changes")

VALIDATION:
- Inline errors on blur/submit
- Required fields marked with *
- Tag: unique per tenant (real-time check), format enforced
- Serial: unique if provided
- Cost: positive number
- Warranty ≥ Purchase Date

STATES:
- Default, Focus, Error, Loading (submit), Success (toast + close drawer + navigate to Detail)

REALISTIC DATA:
- Pre-filled for Edit mode
- Category autocomplete: Laptops, Monitors, Desks, Chairs, Printers, Phones
- Site autocomplete: HQ-Building A, HQ-Building B, Warehouse-1, Remote
```

---

## Screen 5: Asset Import Preview
```
Using the approved design system, create Import Preview modal.

LAYOUT:
- Modal (Full-width, max-width 1200px, max-height 90vh)
- Header: "Import Assets" (H2) + Close
- Step 1: Upload (Drag-drop CSV/JSON, max 10MB, sample template download)
- Step 2: Preview Table (after parse):
  - Columns: Row #, Tag, Make, Model, Serial, Category, Site, Location, Status, Validation (Icon: ✓ OK / ⚠ Warning / ✗ Error), Message
  - Row-level: Checkbox accept/reject, inline edit for warnings
  - Toolbar: "Accept All Valid (1,240)", "Reject All Errors (7)", "Download Errors CSV", "Edit Template"
  - Pagination (50 rows/page), Search within preview
- Step 3: Commit
  - Summary: "1,240 will be created, 7 rejected"
  - Idempotency Key (shown, copyable)
  - "Commit Import" (Primary, Loading state with progress bar)
  - Result: Success toast with breakdown, "View Imported Assets" link

VALIDATION RULES (match FR-ASSET-013):
- Required: Tag, Make, Model, Category, Site
- Tag: unique, format enforced
- Serial: unique if provided
- Category/Site/Location/Department: must exist or "Create New" option
- Date formats: ISO 8601 or user locale
- Cost: numeric, positive

STATES:
- Upload (drag active), Parsing (spinner), Preview (table), Committing (progress), Success/Error

REALISTIC DATA:
- Sample CSV with 1,247 rows, 7 errors (duplicate tags, missing site, invalid category)
```