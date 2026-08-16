# Stitch Prompt: Settings, Profile, Help & Edge Cases
**Version:** 2.0.0  
**Depends on:** Master Prompt + 09-LABEL-DESIGNER  
**Generate after:** Label Designer approved  
**Final Batch — Complete End-to-End Design**

---

## Screen 1: User Profile
```
Using the approved design system, create User Profile screen (accessible from Avatar Menu).

LAYOUT (Desktop):
- Shell + Main Content (max-width 1000px, centered, padding 24px)
- Page Header: "Profile" (H1) + "Manage your account" (Text Secondary)

TABS (Horizontal):
1. PROFILE
2. SECURITY
3. PREFERENCES
4. SESSIONS
5. API KEYS

TAB 1: PROFILE
- Two-Column Grid:
  LEFT: Avatar (XL, Editable: Click → Upload Modal: Crop, Zoom, Save), Name*, Email*, Phone, Timezone*, Date Format (Select: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD), Time Format (12h/24h), Language (Select)
  RIGHT: Department, Title, Manager (User Search), Location (Site/Location), Bio (Textarea, Markdown)
- "Save Changes" (Primary), "Cancel" (Ghost)

TAB 2: SECURITY
- Section: Password
  - Current Password, New Password (Strength Meter), Confirm
  - "Update Password" (Primary)
  - "Password last changed: 45 days ago"
- Section: Two-Factor Authentication
  - Status: Enabled/Disabled (Badge)
  - If Disabled: "Enable 2FA" → MFA Enrollment Flow (QR, Backup Codes)
  - If Enabled: "Regenerate Backup Codes" (Secondary), "Disable 2FA" (Destructive, Confirm)
- Section: Passkeys (WebAuthn) 🏷️
  - "Add Passkey" → WebAuthn Ceremony
  - List Registered Passkeys (Name, Device, Last Used, Remove)

TAB 3: PREFERENCES
- Notification Defaults (Toggles per Channel: Email, SMS, In-App, Push):
  - Asset Overdue, Maintenance Due, Warranty Expiring, Audit Discrepancy, Agent Offline, Report Ready, Mention
- Dashboard Layout: Default View (KPIs First / My Assets First / Activity First)
- Density: Comfortable / Compact (Radio Cards)
- Auto-refresh Interval: Off / 30s / 1m / 5m / 15m
- Date/Time Format Override (Switch → Uses Profile settings)
- "Save Preferences" (Primary)

TAB 4: SESSIONS
- Current Session Card: Device, Browser, OS, IP, Location, Current (Badge), "This Session"
- Other Sessions List: Device, Browser, OS, IP, Location, Last Active, "Revoke" (Destructive)
- "Revoke All Other Sessions" (Warning, Confirm)

TAB 5: API KEYS
- List: Name, Scopes (Chips), Created, Last Used, Status (Active/Revoked), Actions: Copy Key (Only once on Create), Revoke
- "Create API Key" Modal: Name*, Scopes (Checkbox Grid: Assets:Read/Write, Audits:Read, Reports:Read, Webhooks:Manage, Admin:Read), Expiry (Never / 30d / 90d / 1y / Custom)
- On Create: Shows Key Once (Copy Button, "I've copied this key" Checkbox Required)

LAYOUT (Mobile):
- Tabs as Scrollable Bottom Bar
- Sections Stacked

REALISTIC DATA:
- Profile: John Doe, john@acme.com, +1-555-0123, Engineering, Senior Engineer, Manager: Jane Smith
- Security: 2FA Enabled (TOTP), 2 Passkeys (MacBook Pro, iPhone)
- Sessions: Current (Chrome on Mac), Safari on iPhone (2h ago), Edge on Windows (1d ago)
```

---

## Screen 2: Organization Settings (Tenant Admin)
```
Using the approved design system, create Organization Settings (Tenant Admin only).

LAYOUT (Desktop):
- Shell + Main Content (max-width 1200px)
- Page Header: "Organization" (H1) + "General, Security & Data settings" (Text Secondary)

TABS:
1. GENERAL
2. SECURITY
3. DATA
4. INTEGRATIONS
5. BRANDING (Link to Branding Screen)

TAB 1: GENERAL
- Organization Name*, Subdomain* (Editable, Real-time Availability Check), Logo (Link to Branding)
- Timezone* (Select, Default Tenant Timezone), Currency* (Select), Fiscal Year Start (Month Select)
- Date Format, Time Format, Number Format (Locale-based Defaults)
- "Save Changes" (Primary)

TAB 2: SECURITY
- Password Policy Card:
  - Min Length (Number, Default 12), Require Uppercase, Require Lowercase, Require Number, Require Symbol, Max Age (Days, 0=Never), History (Prevent Reuse, Default 5)
- MFA Enforcement Card:
  - Required for: All Users / Admins Only / Optional (Radio)
  - Allowed Methods: TOTP, Passkeys, SMS (Checkboxes)
- Session Policy Card:
  - Absolute Timeout (Minutes, Default 15), Idle Timeout (Minutes, Default 5), Concurrent Sessions (Number, 0=Unlimited)
- IP Allowlist Card:
  - Enabled (Switch), CIDR List (Textarea, One per Line), "My Current IP" Button (Auto-add)
- SSO Configuration Card (SAML 2.0 / OIDC) 🏷️:
  - Provider (Select: Azure AD, Okta, Google, Custom), Entity ID, SSO URL, SLO URL, Certificate (Upload), Attribute Mapping (Email, Name, Groups), JIT Provisioning (Switch), "Test Connection"
- "Save Security Settings" (Primary)

TAB 3: DATA
- Data Retention Policy Table:
  - Data Type (Audit Logs, Asset History, Deleted Records, Personal Data, Exports, Reports), Retention Period (Input: Days/Years, Default: 2y/7y/30d/90d/1y/1y), Action on Expiry (Anonymize / Delete / Archive), Legal Hold Override (Switch)
- Data Export/Deletion Requests:
  - "Export All Data" (Secondary) → Generates JSON/ZIP
  - "Request Deletion" (Destructive) → Admin Review Workflow
- Backup Schedule: Daily at 02:00 UTC (Configurable), Retain 30 Days, "Test Restore" (Ghost)
- "Save Data Settings" (Primary)

TAB 4: INTEGRATIONS
- Connected Apps Grid: Name, Status, Scopes, Connected By, Connected At, Actions (Configure, Disconnect)
- API Keys: Link to API Keys Screen
- Webhooks: Link to Webhooks Screen
- "Add Integration" → Marketplace Modal (Slack, Teams, ServiceNow, Jira, Azure AD, Okta, Custom Webhook)

REALISTIC DATA:
- Org: Acme Corporation, Subdomain: acme-corp
- Security: MFA Required for Admins, Session 15min/5min, IP Allowlist: 10.0.0.0/8, 192.168.0.0/16
- SSO: Azure AD Connected, JIT Provisioning On
- Retention: Audit Logs 2y, Asset History 7y, Personal Data 30d
```

---

## Screen 3: Help Center
```
Using the approved design system, create Help Center (Public + Authenticated).

LAYOUT (Desktop):
- Shell (Sidebar Collapsed) + Main Content (Two-Pane: Left Nav 300px, Right Content Flexible)
- Top Bar: "Help Center" (H1) + Search Input (Global, Debounced, Placeholder "Search help articles...")

LEFT NAV (Categories):
- Getting Started (5 articles)
- Assets & Inventory (8)
- Audits & Compliance (6)
- Maintenance & Work Orders (5)
- Reports & Analytics (4)
- Administration (7)
- Endpoint Agent (4)
- Mobile App (3)
- Billing & Subscription (3)
- API & Webhooks (4)
- Each Category: Collapsible, Article Count Badge, Search Within Category

RIGHT CONTENT:
- Article View: Title (H1), Last Updated, Read Time, Table of Contents (Sticky, Anchor Links), Body (Markdown Rendered: Headings, Code Blocks, Tables, Images, Callouts, Steps)
- Callout Components: Info (Blue), Success (Green), Warning (Amber), Error (Red)
- Step-by-Step: Numbered Steps with Screenshots Placeholders
- Feedback: "Was this article helpful?" (Yes/No) → If No: "What can we improve?" (Textarea)
- "Copy Link" (Ghost), "Print" (Ghost), "Share" (Ghost)
- Related Articles (Bottom, 3 cards)

ARTICLE SEARCH RESULTS (When Searching):
- Modal/Page: Results Grouped by Category, Highlighted Matches, Type Badge (Article / Video / Guide)

CONTACT SUPPORT MODAL (From "Contact Support" in Avatar Menu / Help Center):
- Type (Select: Technical Issue, Billing Question, Feature Request, Security Concern, Other)
- Subject (Required), Description (Required, Textarea), Priority (Low/Medium/High/Critical), Attachments (Drag-drop, Max 5, 10MB each)
- "Submit" → Creates Ticket, Auto-reply with Ticket ID

LAYOUT (Mobile):
- Left Nav as Drawer (Hamburger)
- Article Full-width
- Search as Top Bar

REALISTIC DATA:
- 50+ Articles, Search "check-out" → 12 Results
- Article: "How to Check Out an Asset" — Steps, Screenshots, Video Link
```

---

## Screen 4: Empty States (All Variations)
```
Using the approved design system, create Empty State Components (Reusable, Consistent Style).

DESIGN SYSTEM: Empty State Component
- Container: Centered, Max-Width 400px, Padding 48px
- Illustration: SVG (Outline Style, Primary Muted Color, 120x120px)
- Title (H3, Text Primary)
- Description (Body, Text Secondary, Max 2 Lines)
- Primary Action (Primary Button, Optional)
- Secondary Action (Ghost Button, Optional)
- Link (Optional)

VARIATIONS (Each as Separate Frame):

1. NO ASSETS (Asset List)
   - Illustration: Box with Search Icon
   - "No assets yet"
   - "Get started by adding your first asset"
   - Primary: "Add Asset" → Add Asset Form
   - Secondary: "Import Assets" → Import Modal

2. NO AUDITS (Audit Dashboard)
   - Illustration: Clipboard with Check
   - "No audits scheduled"
   - "Create your first audit session to begin tracking inventory"
   - Primary: "Start Audit" → Start Audit Wizard

3. NO RESULTS (Search/Filter)
   - Illustration: Magnifying Glass with Slash
   - "No results for 'query'"
   - "Try adjusting your filters or search terms"
   - Secondary: "Clear Filters"

4. NO PERMISSIONS (Permission Denied)
   - Illustration: Lock with Shield
   - "You don't have access"
   - "Contact your administrator to request permissions"
   - Secondary: "Contact Admin" → Mailto:admin@tenant.com

5. OFFLINE (Global Banner / Page)
   - Illustration: WiFi Slash
   - "You're offline"
   - "Changes will sync when reconnected. Cached data shown."
   - Primary: "Retry" (When Online)
   - Link: "View Offline Capabilities" → Help Center

6. ERROR (Generic Error Page)
   - Illustration: Alert Triangle
   - "Something went wrong"
   - "We couldn't load this page. Please try again."
   - Primary: "Retry"
   - Secondary: "Go to Dashboard"
   - Link: "Contact Support"

7. LOADING (Skeleton States - Not Empty but Related)
   - Table Skeleton: 5 Rows, Shimmer Animation
   - Card Grid Skeleton: 6 Cards, Shimmer
   - Form Skeleton: Field Placeholders, Shimmer
   - Chart Skeleton: Chart Area, Shimmer

8. NO DATA (Reports/Charts)
   - Illustration: Chart with Slash
   - "No data available"
   - "Add data or adjust filters to see results"
   - Secondary: "Clear Filters"

CONSISTENT STYLE:
- Illustration: 2px Stroke, Rounded Corners, Primary Muted (#93C5FD for Blue Primary)
- Title: 18px/24px, 600, Text Primary
- Description: 16px/24px, 400, Text Secondary
- Buttons: 40px Height, 16px/20px, 500
- Spacing: 24px between Illustration-Title, 16px Title-Description, 24px Description-Actions

DARK MODE:
- Illustration Stroke: Primary Light (#3B82F6)
- Background: Surface Elevated
- Text: Text Primary/Secondary (Inverted)

REALISTIC DATA:
- Each variation shown with actual copy from app
```

---

## Screen 5: Error Pages
```
Using the approved design system, create Error Pages (Full-Page, No Shell).

LAYOUT (All Errors):
- Minimal Layout: Centered Container (Max-Width 400px), Vertical Center
- Illustration (120x120, Outline, Primary Muted)
- Error Code (Display, 72px, Text Muted): 404 / 403 / 500 / 503
- Title (H1): "Page Not Found" / "Access Denied" / "Server Error" / "Service Unavailable"
- Description (Body): Friendly, Actionable Copy
- Primary Action (Primary Button, Large)
- Secondary Action (Ghost Button)
- "Powered by Asset Maintenance Tool" (Caption, Bottom)

404 - PAGE NOT FOUND:
- "The page you're looking for doesn't exist or has been moved."
- Primary: "Go to Dashboard" → /dashboard
- Secondary: "Search Assets" → Focus Global Search

403 - ACCESS DENIED:
- "You don't have permission to view this page."
- "If you believe this is an error, contact your administrator."
- Primary: "Go to Dashboard"
- Secondary: "Contact Admin" → Mailto

500 - SERVER ERROR:
- "Something went wrong on our end. We've been notified."
- "Please try again in a few minutes."
- Primary: "Retry" → Reload Page
- Secondary: "Go to Dashboard"

503 - SERVICE UNAVAILABLE:
- "We're performing scheduled maintenance. Back soon!"
- "Estimated return: [Time] — Check status at status.assetmt.com"
- Primary: "Retry" → Reload
- Link: "Status Page" → External

OFFLINE PAGE (PWA):
- "You're Offline"
- "This page isn't cached. Connect to the internet to load it."
- Primary: "Retry" (When Online)
- "View Cached Pages" → List of Available Offline Pages

DARK MODE: Full Support

REALISTIC COPY:
- All copy matches actual app tone
```

---

## Screen 6: Onboarding Tooltips / Feature Callouts
```
Using the approved design system, create Onboarding Coach Marks & Feature Callouts.

COMPONENT: Coach Mark (Reusable)
- Overlay: Full-Screen, Backdrop Blur (rgba(15,23,42,0.6))
- Target Element Highlight: Rounded Rectangle (4px), Pulse Animation (Primary, 2px Ring)
- Callout Card (Connected via Arrow, Max-Width 320px):
  - Title (H4), Description (Body), Step Indicator (1 of 3)
  - Illustration/Icon (Optional)
  - Actions: "Next" (Primary), "Skip" (Ghost), "Don't Show Again" (Checkbox + Label)
- Position: Auto (Top/Bottom/Left/Right), Smart Collision Avoidance
- Keyboard: Arrow Keys Navigate, Enter=Next, Esc=Skip

FEATURE CALLOUT (Banner/Toast for New Features):
- Banner (Top of Screen, Below Top Bar, Dismissible):
  - Icon (New Badge: Sparkles, Primary), Title, Description
  - "Try It" (Primary, Navigates to Feature), "Dismiss" (Ghost)
  - "Don't Show Again" (Checkbox)
- Toast (Bottom-Right, Auto-Dismiss 10s):
  - "New: Visual Label Designer — Design custom Zebra labels" + "Try It"

ONBOARDING FLOWS (Per Role):
1. IT ASSET MANAGER (First Login):
   - Step 1: Dashboard KPIs ("Your fleet at a glance")
   - Step 2: Asset List ("All assets in one place")
   - Step 3: Quick Actions ("Check-out, Audit, Report in one click")
   - Step 4: Settings ("Customize your workspace")

2. EMPLOYEE (First Login):
   - Step 1: My Assets ("Your assigned equipment")
   - Step 2: Request Asset ("Need something? Ask here")
   - Step 3: Report Issue ("Something broken? Let us know")

3. FIELD TECHNICIAN (First Login):
   - Step 1: Work Orders ("Your maintenance queue")
   - Step 2: Mobile Scanner ("Scan barcodes on the go")
   - Step 3: Complete Work ("Log parts, hours, done")

COACH MARK TRIGGERS:
- First Time User (localStorage Flag)
- New Feature Release (Version Flag)
- Admin Enables Feature (Per Tenant)

DISMISSAL:
- "Don't Show Again" → localStorage/Server Flag
- Skip All → Completes Flow
- Re-enable in Settings → "Reset Onboarding"

REALISTIC DATA:
- Coach Marks with Actual UI Targets (Asset List Toolbar, Quick Actions, Profile Menu)
```

---

## Screen 7: Command Palette (Cmd+K)
```
Using the approved design system, create Command Palette (Global, Cmd+K).

LAYOUT:
- Modal (Centered, 640px Wide, Backdrop Blur)
- Search Input (Full-Width, Auto-Focus, Placeholder "Type a command or search...", Clear Button, Shortcut Hint "⌘K")
- Sections (Collapsible, Keyboard Navigable):

SECTION 1: RECENT (Last 5 Actions)
- "Checked out LPT-0001" → Asset Detail
- "Started Audit: HQ-Floor-2" → Audit Session
- "Ran Report: Assets by Category" → Report Viewer

SECTION 2: QUICK ACTIONS (Categorized)
- Assets: "New Asset" → Add Asset Form, "Import Assets" → Import Modal, "Export Assets" → Export Modal
- Lifecycle: "Check Out Asset" → Check-out Wizard, "Start Maintenance" → Maintenance WO, "Reserve Asset" → Reserve Modal
- Audits: "Start Audit" → Start Audit Wizard, "Scan Barcode" → Scanner View (PWA)
- Reports: "Run Report" → Report List, "Create Report" → Report Builder, "Schedule Report" → Schedule Modal
- Admin: "Invite User" → Invite Modal, "Manage Roles" → Roles Screen, "Webhooks" → Webhooks Screen

SECTION 3: NAVIGATION (All Screens)
- "Dashboard" → /dashboard, "Assets" → /assets, "Lifecycle" → /lifecycle, "Audits" → /audits, "Reports" → /reports, "Admin" → /admin, "Profile" → /profile, "Settings" → /settings

SECTION 4: SETTINGS & HELP
- "Theme: Light/Dark/System" → Toggle, "Density: Comfortable/Compact" → Toggle, "Keyboard Shortcuts" → Help Article, "Contact Support" → Modal

SECTION 5: SEARCH RESULTS (Assets, People, Sites, Audits, Reports)
- Real-time Filter as Type (Debounced 150ms)
- Result: Icon, Primary Label, Secondary Metadata, Badge (Type), Keyboard Shortcut (if any)
- Enter → Navigate, Cmd+Enter → New Tab

KEYBOARD NAVIGATION:
- Arrow Up/Down: Navigate Results
- Enter: Execute/Navigate
- Cmd+Enter: New Tab
- Esc: Close
- Tab: Next Section, Shift+Tab: Previous Section
- Cmd+Number: Jump to Section (1-5)

VISUAL:
- Section Headers (Caption, Uppercase, Text Muted)
- Selected Item: Primary Light Background, Primary Left Border
- Icons: Lucide, 16x16, Text Secondary
- Shortcuts: Right-Aligned, Caption, Text Muted

STATES:
- Loading (Skeleton for Search Results)
- Empty ("No commands match")
- Error (Toast)

REALISTIC DATA:
- 50+ Commands, Search "asset" → 12 Results (New Asset, Import, Export, Check-out, Check-in, Detail, etc.)
```