# Stitch Prompt: Audit & Inventory Sessions
**Version:** 2.0.0  
**Depends on:** Master Prompt + 04-LIFECYCLE-WORKFLOWS  
**Generate after:** Lifecycle Workflows approved  

---

## Screen 1: Audit Dashboard
```
Using the approved design system, create the Audit Dashboard (landing page for Audits navigation group).

LAYOUT (Desktop):
- Shell: Top Bar + Sidebar (Audits active) + Main Content (max-width 1400px, padding 24px)
- Page Header: "Audits" (H1) + "Manage inventory audits" (Text Secondary) + "Start Audit" (Primary, Lg, right)

SECTION 1: KPI Cards (4 cards)
- Card 1: "Assets Audited This Month" — Value, Trend, Click → Report
- Card 2: "Discrepancy Rate" — Value (e.g., "2.3%"), Trend (Success if <5%, Warning if 5-10%, Error if >10%)
- Card 3: "Avg Reconciliation Time" — Value (e.g., "4.2 hrs"), Trend
- Card 4: "Overdue Audits" — Value (Warning if >0), Click → Scheduled Audits filtered: Overdue

SECTION 2: Two-Column Layout
LEFT (65%): Scheduled & In-Progress Audits
- Tabs: "Upcoming" | "In Progress" | "Completed" | "Overdue"
- Each Tab: List (Card per audit session)
  - Card: Session Name (H3), Scope (Site/Location/Department), Status Badge, Progress Bar (Scanned/Total), Assigned Auditors (Avatars), Due Date, Actions: "Continue" (if In Progress), "View Results" (if Completed), "Edit" (if Upcoming), "Delete"
  - Empty: "No audits scheduled" + "Schedule Audit"

RIGHT (35%): Quick Actions & Recent Discrepancies
- Quick Actions Card: "Start Audit" (Primary), "Schedule Recurring" (Secondary), "Import Audit Plan" (Ghost)
- Recent Discrepancies Card: List of last 5 discrepancies across audits (Asset Tag, Expected vs Scanned Location, Status, "Resolve" link)

LAYOUT (Mobile):
- KPI cards: 2x2 grid
- Tabs: Scrollable
- Cards stacked

REALISTIC DATA:
- KPIs: 1,247 audited, 2.3% discrepancy, 4.2 hrs avg, 2 overdue
- Sessions: "Q1 2024 HQ Audit" (Completed, 98%), "Warehouse Audit" (In Progress, 45%), "Annual 2024" (Upcoming)
```

---

## Screen 2: Start Audit Session (Wizard)
```
Using the approved design system, create Start Audit Session flow.

LAYOUT:
- Modal (Large) or Drawer (Large)
- Stepper: 1. Scope → 2. Auditors → 3. Schedule → 4. Confirm

STEP 1: SCOPE
- Scope Type (Radio): Site / Location / Department / Category / Custom Asset List
- If Site: Site Selector (Search, required) → Location Multi-select (dependent)
- If Department: Department Selector (Search, required)
- If Category: Category Selector (Search, required)
- If Custom Asset List: Saved View Selector (or Asset Picker Multi-select)
- Preview: "127 assets in scope" (updates live)
- "Next"

STEP 2: AUDITORS
- Assign Auditors (User Multi-select, avatar + name + role)
- Minimum 1, Lead Auditor (radio per selected)
- Notification: "Notify auditors via email" (Switch, default on)
- "Next"

STEP 3: SCHEDULE
- Start: Now / Scheduled (DateTime Picker)
- Due Date (Date Picker, required)
- Recurrence (Optional): One-time / Daily / Weekly / Monthly / Custom Cron
- Timezone (Select, default tenant timezone)
- "Next"

STEP 4: CONFIRM
- Summary: Scope, Auditors, Schedule, Estimated Assets
- "Start Audit" (Primary) → If "Now": opens Scanner View immediately; If Scheduled: creates session, notifies auditors

SUCCESS: "Audit session created" + Navigate to Scanner View (if now) or Audit Dashboard

REALISTIC DATA:
- Scope: Site: HQ-Building A > Locations: Floor 1, Floor 2 (127 assets)
- Auditors: John Doe (Lead), Sarah Smith, Mike Johnson
- Schedule: Start Now, Due: 2024-01-31
```

---

## Screen 3: Scanner View (Mobile PWA - CRITICAL)
```
Using the approved design system, create the Scanner View — the core mobile audit experience.

LAYOUT (Mobile-First, Full-Screen PWA):
- NO Top Bar, NO Sidebar — immersive scanner
- Status Bar: Session Name (truncated), Progress "47/120 scanned", Offline Indicator (WiFi/Signal icon + "Cached 120/120 assets"), Close (X, confirm "Leave audit? Progress will save locally.")

CAMERA VIEW (90% of screen):
- Full-screen camera feed (video element, rear camera default)
- Overlay: Corner brackets (L-shape, Primary color, 40px arms), Center crosshair line (dashed, Primary)
- Torch Toggle (bottom-left, floating): On/Off
- Switch Camera (bottom-right, floating): Rear/Front
- Manual Entry Button (center-bottom, large, Primary): "Enter Tag Manually" — opens large numeric/input keypad

SCAN RESULT OVERLAY (appears on successful scan, slides up from bottom, 60% screen):
- Asset Card: Photo (thumb), Tag (H2), Make/Model, Expected Location (with ✓/✗ match indicator), Current Status
- Status Buttons (Large, full-width, icon + label, haptic on press):
  1. "Found" (Success, check-circle) — matches expected location
  2. "Missing" (Error, x-circle) — not found at expected location
  3. "Mismatched" (Warning, alert-triangle) — found at wrong location
  4. "Damaged" (Warning, alert-octagon) — found but damaged
- Notes (Textarea, expandable, placeholder "Add notes...")
- Photo Capture (Camera icon, opens camera, preview thumbnail)
- "Save & Next" (Primary, full-width) → Saves scan, returns to camera

MANUAL ENTRY MODE (when "Enter Tag Manually" pressed):
- Full-screen keypad (Large buttons, tactile)
- Input: Asset Tag (auto-uppercase, hyphen formatting)
- "Search" → Shows asset card → Same status buttons
- "Cancel" → Back to camera

OFFLINE BANNER (Top, persistent when offline):
- Yellow banner: "⚠ Offline — Cached 120/120 assets. 3 scans pending sync." + "Sync Now" (when online, triggers background sync)

PULL-TO-SYNC:
- Pull down on camera view → Triggers sync (shows spinner, "Syncing 3 scans...")

SETTINGS (Gear icon, top-right):
- Audio Feedback (Switch, default on)
- Haptic Feedback (Switch, default on)
- Auto-advance (Switch, default on — auto-return to camera after save)
- Show Expected Location (Switch, default on)

HISTORY (Clock icon, top-left):
- Bottom Sheet: Last 10 Scans (Tag, Status, Time, Location Match ✓/✗)
- Tap → Re-open scan result for editing (if session not submitted)

STATES:
- Camera Permission Denied: Full-screen overlay with "Enable Camera" button → Settings
- Camera Error: Toast + Retry
- Scan Success: Haptic + Success Sound + Asset Card Slide-up
- Scan Not Found: Error Sound + "Tag not recognized" + Manual Entry focus
- Duplicate Scan: Warning Sound + "Already scanned" + Show previous result
- Session Complete: "All 120 assets scanned!" + "Submit Audit" (Primary) → Navigate to Reconciliation

REALISTIC DATA:
- Session: "Q1 2024 HQ Audit"
- Assets: LPT-0001 (Expected: Floor 2, Room 201), MON-0042 (Expected: Floor 2, Room 205)
- Scanned: 47/120, 3 pending sync
```

---

## Screen 4: Audit Session Detail (Desktop - Reconciliation)
```
Using the approved design system, create Audit Session Detail for reconciliation.

LAYOUT (Desktop):
- Shell + Main Content (max-width 1400px)
- Header: Session Name (H1), Status Badge, Progress "87/120 scanned (72%)", Actions: "Continue Scanning" (opens Scanner PWA in new tab), "Export Report", "Re-open Session"

SUMMARY CARDS (4 cards):
- Total in Scope, Scanned, Found, Discrepancies (Missing + Mismatched + Damaged)

DISCREPANCIES TABLE (Main Focus):
- Toolbar: Search (Tag, Location), Filter (Type: Missing, Mismatched, Damaged), "Show Resolved" Toggle
- Columns: Asset Tag (link), Photo, Make/Model, Expected Location, Scanned Location, Status (Badge: Missing=Error, Mismatched=Warning, Damaged=Warning), Discrepancy Details, Suggested Match (AI 🏷️: "Likely LPT-0002 at Floor 2, Room 203"), Action Buttons:
  - "Confirm Match" (Primary) → Updates location, resolves
  - "Update Location" (Secondary) → Location Picker
  - "Mark Missing" (Destructive) → Confirms missing
  - "Mark Damaged" (Warning) → Opens Damage Form
  - "Ignore" (Ghost) → Dismisses discrepancy
- Row Expansion: Click row → Side Panel with Asset Detail, Scan History, Photos, Notes
- Bulk Actions (when rows selected): "Confirm All Matches", "Mark All Missing", "Export Discrepancies"

RECONCILIATION PANEL (Right Side, Collapsible):
- "AI Suggestions" 🏷️: List of discrepancies with high-confidence matches
- "Unscanned Assets" (120-87=33): List with "Not Found" actions
- "Scan History": Timeline of all scans in session

COMPLETION:
- "Submit Audit" (Primary, Sticky Bottom) — only enabled when all discrepancies resolved or acknowledged
- Confirmation Modal: "Submit audit? Unresolved discrepancies will be recorded as-is."

LAYOUT (Tablet):
- Table horizontal scroll, Panel as drawer

LAYOUT (Mobile):
- Not applicable (Scanner is mobile, Detail is desktop)

REALISTIC DATA:
- Session: "Q1 2024 HQ Audit", 87/120 scanned
- Discrepancies: 5 (2 Missing: LPT-0045, MON-0088; 2 Mismatched: DSK-0100 found at Floor 1, Room 101 vs expected Floor 2; 1 Damaged: CHR-0234)
- AI Suggestions: DSK-0100 likely moved to Floor 1, Room 101 (95% confidence)
```

---

## Screen 5: Audit History
```
Using the approved design system, create Audit History list.

LAYOUT:
- Shell + Main Content
- Header: "Audit History" (H1) + "47 completed audits" + "Export All" (Ghost)

TABLE:
Columns: Session Name, Scope, Date Range, Auditors, Assets in Scope, Scanned, Found, Discrepancy Rate, Status, Report (Download PDF/CSV)
- Row Click → Audit Session Detail (read-only)
- Filters: Date Range, Scope Type, Auditor, Status
- Pagination, Sortable

CARD VIEW (Mobile):
- Card: Session Name, Date, Scope, Discrepancy Rate (Badge), Status, "View Report"

EMPTY: "No completed audits" + "Start Your First Audit"

REALISTIC DATA:
- "Q1 2024 HQ Audit" | HQ-Building A | Jan 1-15, 2024 | 3 auditors | 120 assets | 118 scanned | 98.3% | 2.3% discrepancy | Completed
- "Annual 2023" | All Sites | Dec 1-31, 2023 | 5 auditors | 1,247 assets | 1,240 scanned | 99.4% | 1.1% discrepancy | Completed
```