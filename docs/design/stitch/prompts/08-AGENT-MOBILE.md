# Stitch Prompt: Endpoint Agent & Mobile PWA
**Version:** 2.0.0  
**Depends on:** Master Prompt + 07-ADMIN-SETTINGS  
**Generate after:** Administration approved  

---

## Screen 1: Agent Management (Admin)
```
Using the approved design system, create Agent Management for endpoint agents.

LAYOUT (Desktop):
- Shell: Top Bar + Sidebar (Administration > Agents active) + Main Content (max-width 1400px, padding 24px)
- Page Header: "Endpoint Agents" (H1) + "1,247 enrolled" (Text Secondary) + "Enrollment Guide" (Ghost, right)

TOOLBAR:
- Search (Asset Tag, Hostname, OS, Version)
- Filters: Status (Online=Success, Offline=Warning, Stale=Error, Never Connected=Muted), OS (Windows, macOS, Linux), Version, Group
- Column Picker, Export (CSV, XLSX)

TABLE:
Columns: Asset Tag (Link), Hostname, OS (Icon + Version), Agent Version, Last Seen (Relative, Badge: Online=Green Pulse, Offline=Yellow, Stale=Red), Status (Badge), Enrolled At, Actions (View, Configure, Unenroll, View Logs)
- Row Hover: Highlight
- Row Click → Agent Detail Drawer
- Bulk Actions: Configure Selected, Unenroll Selected, Export Selected
- Pagination, Virtualized

CARD VIEW (Mobile):
- Card: Asset Tag (Large), Hostname, OS Badge, Status Badge (with Pulse Animation for Online), Last Seen, Actions

EMPTY STATE: "No agents enrolled" + "Download Agent" (Primary)

AGENT DETAIL DRAWER (Click Row → Large Drawer):
- Header: Asset Tag (Link), Hostname, OS + Version, Status Badge with Pulse
- SECTIONS:
  1. HARDWARE: CPU, RAM, Disk (Total/Used/%), GPU, Battery Health (%), Serial Number
  2. SOFTWARE: Installed Apps Table (Name, Version, Publisher, Install Date, Usage % — Searchable, Sortable, "Export")
  3. OS: Version, Build, Patch Level, Last Reboot, Uptime
  4. NETWORK: IP (Internal/External), VPN (Connected/Disconnected), SSID, DNS
  5. SECURITY: AV Status (Running/Outdated/Disabled), Firewall (On/Off), Disk Encryption (On/Off), Screen Lock (On/Off)
  5. SYNC: Last Sync, Next Sync, Sync Interval, Data Categories Enabled
- ACTIONS: "Refresh Now" (Primary, sends push), "Configure" (Modal), "View Logs" (Modal), "Unenroll" (Destructive)

ENROLLMENT GUIDE MODAL (Click "Enrollment Guide"):
- Tabs: Windows (MSI), macOS (PKG), Linux (DEB/RPM/AppImage), MDM/Group Policy
- Each Tab: Download Link (Signed, Versioned), Silent Install Command, Enrollment Token (QR + Copy), Config File Template
- Prerequisites: .NET 6 Runtime (Windows), Admin Rights, Network Access to *.assetmt.com
- Troubleshooting: Common Errors, Firewall Ports, Proxy Config

REALISTIC DATA:
- 1,247 agents: 1,198 Online, 32 Offline, 17 Stale
- OS: Windows 11 (892), Windows 10 (245), macOS 14 (89), Ubuntu 22.04 (21)
- Versions: 2.1.4 (1,100), 2.1.3 (147)
```

---

## Screen 2: Agent Data Panel (Asset Detail - Conditional 🏷️)
```
Using the approved design system, create Agent Data Panel (shown only when asset has enrolled agent).

LAYOUT:
- Integrated into Asset Detail (Tab or Accordion in Overview)
- Header: "Live Agent Data" (H3) + Status Badge (Online/Offline/Stale) + "Refresh Now" (Ghost, Sm) + Last Sync

ACCORDION SECTIONS (Collapsible, Default Open: Hardware):
1. HARDWARE
   - Grid: CPU (Model, Cores, Current %), RAM (Total/Used/%), Disk (C: Total/Used/%), GPU, Battery (Health %, Cycle Count, Status: Charging/Discharging)
   - "View Full Hardware Report" → Modal with detailed specs

2. SOFTWARE
   - Searchable Table: Name, Version, Publisher, Install Date, Usage % (Last 7d), Size
   - Filter: Category (Productivity, Security, Development, System, Other)
   - "Export Software List" (CSV)
   - "Detect Unauthorized" (Secondary) → Compares against approved list

3. OPERATING SYSTEM
   - OS Version, Build, Patch Level, Last Reboot, Uptime, Pending Updates Count
   - "View Patch History" → Modal

4. NETWORK
   - Internal IP, External IP, VPN Status (Connected/Disconnected, Provider), SSID, DNS Servers
   - "Network Diagnostics" → Modal (Ping, Traceroute, Speed Test)

5. SECURITY POSTURE
   - Cards: Antivirus (Running/Outdated/Disabled — Detail: Definitions Date, Last Scan), Firewall (On/Off, Profile), Disk Encryption (On/Off, Type: BitLocker/FileVault/LUKS), Screen Lock (On/Off, Timeout)
   - Overall Score: "Secure" / "Attention Needed" / "Critical"
   - "Run Security Scan" (Primary) → Triggers agent scan

6. LAST SYNC
   - Timestamp, Duration, Data Categories Synced, Next Scheduled Sync
   - "Sync Now" (Primary) → Pushes immediate sync request

CONDITIONAL VISIBILITY:
- Only render if asset.agent_enrolled = true
- Show "No agent data" message with "Enroll Agent" button if false

LAYOUT (Mobile):
- Accordions stacked, Hardware open by default
- Tables horizontal scroll

REALISTIC DATA:
- Asset: LPT-0001
- Hardware: Apple M3 Max, 12C CPU, 64GB RAM, 2TB SSD (45%), Apple GPU 40C, Battery 92% (312 cycles)
- Software: 147 apps (Chrome 120.0, VS Code 1.85, Slack 4.32, Docker 25.0)
- OS: macOS 14.2.1 (23C71), Patch: 2024-01-15, Uptime: 3d 14h
- Network: 10.0.1.45, VPN: Corporate (Connected), SSID: HQ-WiFi-5G
- Security: XProtect (Running, Defs: 2024-01-15), Firewall On, FileVault On, Screen Lock 5min
```

---

## Screen 3: Mobile PWA - Install Prompt
```
Using the approved design system, create PWA Install Prompt (Smart Banner).

LAYOUT (Mobile Safari / Chrome):
- Top Banner (Non-intrusive, dismissible, localStorage remembers dismissal 30 days):
  - Icon (App Logo), "Install Asset Maintenance Tool"
  - "Add to Home Screen for offline audits, barcode scanning & instant access"
  - Buttons: "Install" (Primary) / "Later" (Ghost)
  - "Install" → Triggers beforeinstallprompt → Shows Native Install Dialog

ALTERNATIVE (If beforeinstallprompt not fired):
- Bottom Sheet (on Dashboard visit, once per session):
  - "Get the App Experience"
  - Features: Offline Audits, Barcode Scanner, Push Notifications, Background Sync
  - "Add to Home Screen" (Primary, triggers manual install instructions per browser)
  - "Not Now" (Ghost)

DESKTOP (Chrome/Edge):
- Address Bar Install Icon (Auto-shown by browser when criteria met)
- Custom Install Button in Avatar Menu: "Install App" → Triggers beforeinstallprompt

SERVICE WORKER REGISTRATION:
- On First Load: "Registering offline capabilities..." Toast
- Success: "Ready for offline use" (Subtle, auto-dismiss)
- Failure: Silent (Logged)

OFFLINE INDICATOR (Persistent when offline):
- Top Banner (Yellow): "⚠ You're offline. Cached data shown. Changes sync when reconnected."
- "Sync Now" Button (When online, triggers background sync)

REALISTIC DATA:
- App Name: "Asset Maintenance Tool"
- Short Name: "AssetMT"
- Icons: 192x192, 512x512 (Maskable)
- Start URL: /dashboard
- Display: Standalone
- Theme Color: #2563EB
- Background Color: #F8FAFC
```

---

## Screen 4: Mobile PWA - Home Screen (Dashboard)
```
Using the approved design system, create Mobile PWA Home Screen (Dashboard).

LAYOUT (Mobile, Standalone Mode):
- NO Browser Chrome (Standalone)
- Top Bar (56px, Fixed): Logo (Left), Page Title (Center), Avatar Menu (Right)
- Bottom Tab Bar (56px, Fixed, Safe Area Inset):
  1. Dashboard (Home icon, Active)
  2. Assets (Box icon, Badge: Count)
  3. Scan (Scan icon, Primary Highlight) → Opens Scanner View
  4. Audits (Clipboard-check icon, Badge: In Progress)
  5. More (Menu icon) → Drawer: Profile, Settings, Theme, Help, Sign Out

CONTENT (Dashboard Tab):
- Pull-to-Refresh (Native feel)
- KPI Cards (2x2 Grid, Tap → Navigate):
  - Total Assets, Assigned to Me, Overdue, Warranty Expiring
- My Assets (Horizontal Scroll Cards):
  - Card: Photo, Tag, Model, Status Badge, Due Date
  - Tap → Asset Detail (Mobile)
- Quick Actions (Grid 2x2, Large Touch Targets):
  - "Scan Barcode" (Primary, Scan Icon) → Scanner View
  - "Report Issue" (Alert Icon)
  - "Request Asset" (Plus Icon)
  - "My Tickets" (Ticket Icon)
- Recent Activity (List, Tap → Detail)

SYNC STATUS INDICATOR (Top Bar, Right of Title):
- Online: Green Dot + "Synced 2 min ago"
- Offline: Yellow Dot + "Offline - 3 pending"
- Syncing: Spinner + "Syncing..."

GESTURES:
- Swipe Right from Left Edge → Open More Drawer
- Swipe Left on Asset Card → Quick Actions (Return, Report Issue)
- Pull Down → Refresh + Sync
- Long Press Asset Card → Multi-select Mode

REALISTIC DATA:
- KPIs: 1,247 Total | 3 Assigned | 1 Overdue | 0 Warranty
- My Assets: LPT-0001 (MacBook Pro), MON-0042 (Dell 27"), DSK-0100 (Standing Desk)
- Activity: Check-out LPT-0001 (2h ago), Maintenance WO-0042 Completed (1d ago)
```

---

## Screen 5: Mobile PWA - Settings
```
Using the approved design system, create Mobile PWA Settings.

LAYOUT (Mobile, Standalone):
- Top Bar: "Settings" (H1) + Close (X)
- Sections (Cards, Inset Grouped):

SECTION 1: ACCOUNT
- Avatar, Name, Email, Role
- "Edit Profile" → Profile Screen
- "Sign Out" (Destructive, Confirm)

SECTION 2: NOTIFICATIONS
- Push Notifications (Switch, System Permission Link if Denied)
- In-App Notifications (Switch)
- Alert Types (Toggles): Asset Overdue, Maintenance Due, Warranty Expiring, Audit Discrepancy, Agent Offline
- Quiet Hours (Time Range Picker, e.g., 22:00-07:00)

SECTION 3: OFFLINE & SYNC
- Auto-sync (Switch, Default On)
- Sync on Wi-Fi Only (Switch, Default On)
- Background Sync (Switch, Default On)
- Offline Data Size: "47 MB" + "Clear Cache" (Warning, Confirm)
- Last Sync: "2 minutes ago" + "Sync Now" (Primary)

SECTION 4: APPEARANCE
- Theme: Light / Dark / System (Radio Cards)
- Density: Comfortable / Compact (Radio Cards)
- Language: Select (English, Spanish, French, German...)

SECTION 5: ABOUT
- Version: 2.1.4 (Build 2024.01.15)
- "Check for Updates" (Secondary)
- Terms of Service, Privacy Policy, Licenses
- "Send Feedback" (Ghost) → Feedback Modal

STATES:
- Permission Denied: Show "Enable in Settings" Link
- Syncing: Spinner on "Sync Now"
- Cache Cleared: Toast "Offline data cleared"

REALISTIC DATA:
- Version: 2.1.4
- Offline Cache: 47 MB
- Last Sync: 2 min ago
- Theme: System
```