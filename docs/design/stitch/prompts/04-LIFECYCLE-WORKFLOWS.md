# Stitch Prompt: Lifecycle Workflows
**Version:** 2.0.0  
**Depends on:** Master Prompt + 03-ASSET-REGISTRY  
**Generate after:** Asset Registry approved  

---

## Screen 1: Check-out Wizard (5 Steps)
```
Using the approved design system, create the Check-out flow (triggered from Asset List bulk, Asset Detail, or Dashboard Quick Action).

LAYOUT (Desktop):
- Drawer (Large, 600px) or Full-page (if from Dashboard)
- Header: "Check Out Assets" (H2) + Close
- Progress Stepper (top, 5 steps): 1. Select Assets → 2. Select Custodian → 3. Details → 4. Verify → 5. Complete
- Step content area, Back/Next/Submit actions

STEP 1: SELECT ASSETS
- If pre-selected (from Asset List bulk or Asset Detail): Show selected tags as removable chips, "Add More" button
- If not: Asset Picker (Search + Multi-select Table: Tag, Make/Model, Status, Location — only In Stock assets)
- Minimum 1 asset required
- "Next" disabled until ≥1 asset

STEP 2: SELECT CUSTODIAN
- User/Group Search (Combobox: avatar, name, email, department, role)
- Show current custodian if asset already assigned (warning)
- Option: "Assign to different custodians per asset" (toggle → shows per-asset custodian selector in summary)
- "Next"

STEP 3: DETAILS
- Expected Return Date (Date Picker, optional, default +30 days)
- Condition (Select: Good, Fair, Needs Repair — default Good)
- Notes (Textarea, placeholder "Reason for check-out, special instructions...")
- Signature Required (Switch, per policy default) — if on, Signature Capture canvas appears in Step 4
- Photo Required (Switch) — if on, Photo Capture in Step 4
- "Next"

STEP 4: VERIFY (Signature + Photo Capture)
- Summary Card per Asset: Tag, Make/Model, Custodian, Expected Return, Condition
- If Signature Required: Signature Canvas (full-width, 400x200, "Sign here", Clear, "Required" badge)
- If Photo Required: Camera Upload (Drag-drop + Camera icon, preview, retake)
- "Back" | "Confirm Check-out" (Primary, Loading)

STEP 5: COMPLETE
- Success Animation (Check circle, green)
- "Check-out Complete" (H2)
- Summary: X assets checked out to [Custodian]
- PDF Receipt Button (Download, includes signatures/photos)
- Email Receipt Button (Ghost)
- "Done" → Close drawer, navigate to Asset List (filtered to checked-out)

LAYOUT (Mobile):
- Full-screen stepper, bottom navigation (Back/Next)
- Signature Canvas: full-width, touch-optimized
- Camera: native camera integration

STATES:
- Each step validates before Next
- Loading on submit
- Success toast + PDF generation
- Error: "Asset no longer available", "Custodian not found"

REALISTIC DATA:
- Assets: LPT-0001, LPT-0002
- Custodian: John Doe (Engineering)
- Expected Return: +30 days
- Signature: captured
- Photo: uploaded
```

---

## Screen 2: Check-in Wizard (4 Steps)
```
Using the approved design system, create the Check-in flow.

LAYOUT: Same shell as Check-out, 4 steps.

STEP 1: SELECT ASSETS
- Pre-filled if from Asset Detail
- Otherwise: Asset Picker (only Assigned/On Loan assets, filter by Custodian)

STEP 2: CONDITION ASSESSMENT
- Per Asset: Condition (Radio: Good → Status=In Stock, Needs Repair → Status=In Repair + auto-create Maintenance WO, Retire → branch to Disposal)
- Notes per asset (Textarea)
- Signature Capture (if policy)
- Photo Capture (if policy)

STEP 3: VERIFY
- Summary per asset: Tag, Previous Custodian, Condition, Notes
- "Back" | "Confirm Check-in"

STEP 4: COMPLETE
- Success: "X assets checked in"
- If any "Needs Repair": "Maintenance Work Orders created: WO-0042, WO-0043" with links
- If any "Retire": "Disposal workflow started for: DSK-0100" with link
- PDF Receipt, Email, Done

BRANCHING LOGIC:
- Good → Asset Status = In Stock, Custodian cleared
- Needs Repair → Asset Status = In Repair, Maintenance WO auto-created (link to WO Detail)
- Retire → Redirect to Disposal Flow (Screen 7)

STATES: Same as Check-out

REALISTIC DATA:
- 3 assets: 2 Good, 1 Needs Repair
- Maintenance WO created with problem description pre-filled from notes
```

---

## Screen 3: Maintenance Work Order List
```
Using the approved design system, create Maintenance Work Order List.

LAYOUT (Desktop):
- Shell: Top Bar + Sidebar (Lifecycle active) + Main Content
- Page Header: "Maintenance" (H1) + "23 open work orders" + "New Work Order" (Primary)

TOOLBAR:
- Search (WO#, Asset Tag, Technician)
- Filters: Status (Open, In Progress, On Hold, Completed, Overdue), Type (Preventive, Corrective, Calibration), Technician, Date Range
- View Toggle: Table | Cards
- Export (CSV, XLSX)

TABLE:
Columns: WO# (link), Asset (Tag + link), Type (Badge), Problem (truncated), Technician (Avatar+Name), Started, Due, Status (Badge: Open=Default, In Progress=Primary, On Hold=Warning, Completed=Success, Overdue=Error), Actions (View, Start, Complete, Print)
- Row hover: highlight
- Bulk Actions: Assign Technician, Change Status, Print Selected
- Pagination, Virtualized

CARD VIEW (Mobile/Tablet):
- Card: WO# (large), Asset Tag + Photo, Type Badge, Problem, Technician Avatar, Due Date (Warning if overdue), Status Badge, Actions: View, Start, Complete

EMPTY STATE: "No work orders match filters" + "Create Work Order"

REALISTIC DATA:
- WO-0042: LPT-0001, Corrective, "Screen flickering", John Doe, Started: 2024-01-10, Due: 2024-01-12, In Progress
- WO-0043: MON-0042, Preventive, "Annual calibration", Sarah Smith, Started: —, Due: 2024-01-15, Open
- WO-0044: PRN-0005, Corrective, "Paper jam sensor", Mike Johnson, Started: 2024-01-08, Due: 2024-01-09, Overdue
```

---

## Screen 4: Maintenance Work Order Detail
```
Using the approved design system, create Maintenance WO Detail.

LAYOUT (Desktop):
- Shell + Main Content (max-width 1000px)
- Header: WO# (H1) + Status Badge + Asset Tag (link) + Asset Photo Thumbnail + Actions: Edit, Print, Duplicate, Delete

TABS:
1. DETAILS
2. TASKS
3. PARTS
4. LABOR
5. ATTACHMENTS
6. HISTORY

TAB 1: DETAILS (Two-column grid)
LEFT: Problem Description (markdown), Root Cause (markdown), Resolution (markdown), Type (Badge), Priority (Badge: Low/Medium/High/Critical), Asset Info (Tag, Make/Model, Serial, Location)
RIGHT: Technician (Avatar+Name, reassign dropdown), Started, Completed, Due Date, Downtime (Hours), Total Cost (Parts + Labor), Status (Dropdown: Open → In Progress → On Hold → Completed), Condition After (Select: Serviceable, Needs Replacement, Retire)

TAB 2: TASKS (Checklist)
- Add Task (Input + Add), Reorder (drag), Checkbox complete, Description, Assigned To, Completed At
- Progress Bar: "3/5 tasks complete"

TAB 3: PARTS (Table)
- Columns: Part Name, SKU, Quantity, Unit Cost, Total Cost, Source (Inventory/Purchase), Received (Checkbox)
- "Add Part" → Modal: Search Inventory (or Manual), Qty, Cost
- Totals Row: Parts Subtotal

TAB 4: LABOR
- Table: Technician, Date, Hours, Rate, Total Cost, Notes
- "Add Labor Entry" → Modal
- Totals Row: Labor Subtotal

TAB 5: ATTACHMENTS
- Grid: Preview, Name, Type, Size, Uploaded By, Date
- Upload (Drag-drop, multiple, progress)
- Actions: Download, Delete

TAB 6: HISTORY
- Timeline: Status changes, Task completions, Parts added, Labor logged, Notes added
- Each: Icon, Description, User, Timestamp

ACTIONS (Sticky Bottom Bar on Detail tab):
- If Open: "Start Work" (Primary) → Status=In Progress, Started=now
- If In Progress: "Pause" (Secondary) → On Hold | "Complete" (Success) → Opens Completion Modal
- If On Hold: "Resume" (Primary) → In Progress
- If Completed: "Reopen" (Warning) → Open

COMPLETION MODAL (when clicking Complete):
- Condition After (Required: Serviceable / Needs Replacement / Retire)
- Resolution Notes (Required, Textarea)
- Final Cost Review (Parts + Labor, editable)
- Signature Capture (if policy)
- "Complete Work Order" → Status=Completed, Asset Status updated per Condition After

LAYOUT (Mobile):
- Tabs as sticky bottom bar
- Detail sections stacked
- Tasks: Swipe to complete
- Completion Modal: Full-screen

REALISTIC DATA:
- WO-0042: LPT-0001, Corrective, "Screen flickering", John Doe, Parts: LCD Panel ($450), Labor: 2.5h @ $75/h, Total: $637.50, Status: In Progress, 2/3 tasks done
```

---

## Screen 5: Reserve Asset Modal
```
Using the approved design system, create Reserve Asset flow.

LAYOUT:
- Modal (Medium, 500px)
- Header: "Reserve Asset" (H2)
- Stepper: 1. Asset → 2. Dates → 3. Confirm

STEP 1: ASSET
- Asset Picker (Search, only In Stock assets)
- Show: Tag, Make/Model, Photo, Location

STEP 2: DATES & DETAILS
- Requester (auto-fill current user, changeable if admin)
- Start Date/Time (DateTime Picker)
- End Date/Time (DateTime Picker, min = Start)
- Purpose (Textarea)
- Approver (Optional, User Search, if policy requires approval)
- Calendar Preview: Shows asset availability timeline (green=available, red=reserved)

STEP 3: CONFIRM
- Summary, "Submit Reservation" (Primary)
- If approval required: "Submitted for approval" + Notify Approver

SUCCESS: "Asset reserved" + Calendar .ics download + Email confirmation

LAYOUT (Mobile): Full-screen stepper

REALISTIC DATA:
- Asset: LPT-0005 (In Stock)
- Dates: 2024-02-01 09:00 → 2024-02-15 17:00
- Purpose: "New hire onboarding - Jane Smith"
```

---

## Screen 6: Lease / Lease Return
```
Using the approved design system, create Lease and Lease Return flows (similar to Check-out/Check-in but for external customers).

LEASE FLOW (5 Steps):
1. Select Asset(s) → 2. Customer (External: Name, Email, Company, Address) → 3. Terms (Start, End, Recurring Billing Link, Deposit) → 4. Signature + Photo → 5. Complete → Lease Agreement PDF

LEASE RETURN FLOW (4 Steps):
1. Select Lease → 2. Condition Assessment (Good/Repair/Retire) → 3. Inspection Notes + Signature + Photo → 4. Complete → Refund/Adjustment Calculation + Return Receipt PDF

KEY DIFFERENCES FROM CHECK-OUT:
- Customer is external (not user in system)
- Lease Agreement PDF generated
- Recurring billing integration point (webhook)
- Deposit handling
- Return includes financial settlement

REALISTIC DATA:
- Customer: "Acme Corp", jane@acme.com
- Lease: 12 months, $150/mo, $500 deposit
```

---

## Screen 7: Disposal / Retirement Flow
```
Using the approved design system, create Disposal/Retirement flow.

LAYOUT:
- Modal or Drawer (Large)
- Stepper: 1. Select Assets → 2. Method & Details → 3. Certificates → 4. Confirm

STEP 1: SELECT ASSETS
- Asset Picker (Retired/In Repair assets, or any if forced)

STEP 2: METHOD & DETAILS
- Per Asset: Disposal Method (Radio: Recycle, Donate, Destroy, Resell, Return to Vendor)
- Vendor/Recipient (Search or Manual)
- Cost/Revenue (Number, positive=cost, negative=revenue)
- Certificate Required (Switch per method: Recycle=Yes, Donate=Yes, Destroy=Yes, Resell=No)
- Notes

STEP 3: CERTIFICATES
- Upload Certificate per asset (Drag-drop, PDF/JPG, required if flagged)
- Preview, Remove

STEP 4: CONFIRM
- Warning: "This action is irreversible. Assets will be permanently removed from active inventory."
- Type asset tags to confirm (Input per asset, must match)
- "Dispose Assets" (Destructive, Loading)

SUCCESS:
- Assets marked Disposed, Status=Disposed, Disposed Date=now
- Disposal Certificates attached
- Final Audit Event created
- Disposal Report PDF (all assets, methods, certificates, financials)
- "Done"

REALISTIC DATA:
- 2 assets: DSK-0100 (Recycle, $50 cost, certificate uploaded), CHR-0234 (Donate, $0, certificate uploaded)
```