# Stitch Prompt: Label Designer & Printing
**Version:** 2.0.0  
**Depends on:** Master Prompt + 08-AGENT-MOBILE  
**Generate after:** Agent & Mobile approved  

---

## Screen 1: Label Template List
```
Using the approved design system, create Label Template List.

LAYOUT (Desktop):
- Shell: Top Bar + Sidebar (Lifecycle > Label Designer active) + Main Content (max-width 1400px, padding 24px)
- Page Header: "Label Templates" (H1) + "Design & print asset labels" (Text Secondary) + "Create Template" (Primary, Lg, right)

GRID (3-col desktop, 2-col tablet, 1-col mobile):
- Card per Template:
  - Preview Thumbnail (200x100, rendered from template, shows sample data)
  - Name (H3), Size Badge (e.g., "2×1 in", "3×1 in", "4×2 in")
  - Printer Type Badge (Zebra ZPL / EPL / PDF)
  - Default Badge (Primary, if is_default)
  - Actions (Hover): Edit (Primary), Duplicate (Ghost), Set Default (Ghost), Delete (Destructive, Confirm), Print Test (Ghost, opens Print Dialog with sample)

EMPTY STATE: "No label templates yet" + Illustration + "Create Template" (Primary)

CREATE TEMPLATE: Opens Label Designer (Screen 2)

REALISTIC DATA:
- "Standard 2×1 ZPL" (Default, Zebra, 2×1 in)
- "Large 3×1 PDF" (PDF, 3×1 in)
- "Compact 1.5×0.75 EPL" (EPL, 1.5×0.75 in)
```

---

## Screen 2: Visual Label Designer (FIGMA-LITE)
```
Using the approved design system, create the Visual Label Designer — a Figma-lite canvas for designing Zebra-compatible labels.

LAYOUT (Desktop, Full-Viewport Canvas):
- Top Bar (56px, Fixed): 
  - Left: Back to List (Ghost), Template Name (Editable Inline, H3), "Unsaved" Badge (Warning)
  - Center: Zoom Controls (Zoom Out, Zoom Level Input 50-300%, Zoom In, Fit to Screen), Grid Toggle (Show/Hide), Snap Toggle, Rulers Toggle
  - Right: Undo/Redo (Ghost, Cmd+Z/Cmd+Shift+Z), Save (Primary), Save As (Ghost), Export ZPL (Ghost), Export EPL (Ghost), Export PDF (Ghost), Print Test (Primary)

LEFT PANEL (300px, Collapsible): ELEMENT PALETTE
- Search Elements (Input)
- Categories (Accordion):
  1. BARCODES: Code 128, QR Code, Data Matrix, PDF417, UPC-A, EAN-13
  2. TEXT: Static Text, Dynamic Field ({{asset_tag}}, {{serial_no}}, {{make}}, {{model}}, {{category}}, {{site}}, {{location}}, {{department}}, {{custodian}}, {{purchase_date}}, {{warranty_expiry}}, {{custom_field_X}})
  3. IMAGES: Logo/Upload, Static Image
  4. SHAPES: Line, Rectangle, Rounded Rectangle, Circle, Ellipse
  5. CONTAINERS: Group, Frame (for repeat regions)
- Each Element: Drag Handle, Icon, Name, Shortcut Key Hint (V=Select, T=Text, B=Barcode, I=Image, R=Rectangle, L=Line)

CANVAS (Center, Flexible):
- Rulers (Top/Left, px and inches/mm toggle)
- Grid (4px base, configurable), Snap to Grid
- Label Boundary (Dashed outline, shows Printable Area vs Bleed)
- Page Size Presets (Dropdown): 2×1 in, 3×1 in, 4×2 in, 4×3 in, 4×6 in, Custom (W×H)
- Orientation: Portrait / Landscape
- Units: Inches / Millimeters / Pixels (at 203/300/600 DPI)
- DPI Selector: 203 / 300 / 600 (affects barcode module width)
- Multiple Labels per Sheet (for PDF): Rows × Cols, Gap, Margins

RIGHT PANEL (350px, Collapsible): ELEMENT PROPERTIES (Context-sensitive)
- When Nothing Selected: Template Settings (Name, Size, Orientation, DPI, Units, Margins, Bleed)
- When Element Selected: Tabs → Content | Style | Position | Data Binding | Advanced

CONTENT TAB (per Element Type):
- BARCODE: Symbology (Code128/QR/DataMatrix/PDF417/UPC/EAN), Data Source (Static / Dynamic Field / Concatenation), Module Width (dots), Height, Quiet Zone, ECC Level (QR), Show Human-Readable (Switch), Font/Size/Position for Human-Readable
- TEXT: Content (Static / Dynamic Field / Expression), Font Family, Size, Weight, Color, Alignment, Line Height, Letter Spacing, Rotation, Max Width (Wrap/Truncate/Scale)
- IMAGE: Source (Upload / Dynamic Field / URL), Fit (Cover/Contain/Fill/Scale), Opacity, Border Radius
- SHAPE: Fill (Color/Gradient/None), Stroke (Color/Width/Style), Corner Radius (Rect), Rotation
- GROUP: Children List, Layout (None/Flex/Grid), Gap

STYLE TAB:
- Opacity, Blend Mode, Filters (Blur/Shadow), Transform (Scale/Rotate/Flip)

POSITION TAB:
- X, Y (Input + Arrow Step), Width, Height, Lock Aspect Ratio, Alignment (Relative to Canvas/Center/Parent), Z-Index

DATA BINDING TAB (for Dynamic Elements):
- Field Picker (Searchable: All Asset Fields + Custom Fields)
- Expression Builder (Concatenate: {{asset_tag}} - {{model}}, Conditionals: {{#if warranty_expired}}EXPIRED{{/if}})
- Formatter (Date: MM/DD/YYYY, Number: 1,234.56, Uppercase, Lowercase, Truncate)
- Sample Data Preview (Cycles through 3 sample assets)

ADVANCED TAB:
- Print Condition (Expression: {{#if show_barcode}}true{{/if}})
- ZPL/EPL Raw Output Preview (Read-only, Updates Live)
- Accessibility: Alt Text, Tab Order

TOOLBAR (Canvas Context Menu - Right Click):
- Copy/Paste/Duplicate/Delete
- Align (Left/Center/Right/Top/Middle/Bottom)
- Distribute Horizontally/Vertically
- Group/Ungroup
- Bring to Front/Send to Back
- Lock/Unlock
- Convert to Dynamic/Static

KEYBOARD SHORTCUTS (All Visible in Help Menu):
- V: Select Tool | T: Text | B: Barcode | I: Image | R: Rectangle | L: Line | G: Group | Cmd+G: Group | Cmd+Shift+G: Ungroup
- Cmd+C/V/X: Copy/Paste/Cut | Cmd+D: Duplicate | Delete: Remove
- Arrow Keys: Nudge (1px), Shift+Arrow: Nudge (10px)
- Cmd+Arrow: Align | Cmd+Shift+Arrow: Distribute
- Cmd+Z/Y: Undo/Redo | Cmd+S: Save | Cmd+Shift+S: Save As
- +/-: Zoom | Cmd+0: Fit | Cmd+1: 100%

LIVE PREVIEW (Bottom Bar, Toggle):
- Cycles through 3 Sample Assets (LPT-0001, MON-0042, DSK-0100)
- Shows Rendered Label at Actual Size (with DPI simulation)
- ZPL/EPL Raw Output Side-by-Side

LAYOUT (Tablet):
- Left/Right Panels as Drawers
- Canvas Full-width

LAYOUT (Mobile):
- Not Supported (Designer is Desktop-Only) — Show "Label Designer available on desktop"

REALISTIC DATA:
- Sample Assets: LPT-0001 (MacBook Pro 16"), MON-0042 (Dell 27"), DSK-0100 (Standing Desk)
- Dynamic Fields: {{asset_tag}}, {{serial_no}}, {{make}}, {{model}}, {{category}}, {{site}}, {{location}}, {{department}}, {{custodian}}, {{purchase_date}}, {{warranty_expiry}}, {{custom_field_1}}
```

---

## Screen 3: Print Dialog
```
Using the approved design system, create Print Dialog for labels.

LAYOUT:
- Modal (Large, 600px)
- Stepper: 1. Select Labels → 2. Configure → 3. Print

STEP 1: SELECT LABELS
- Source (Radio): Single Asset (Search), Multiple Assets (Multi-select from Asset List), From Audit Session (Scanned Assets), From Report (Filtered Results), Custom Range (Start Tag → End Tag)
- Preview: Shows First 3 Labels Rendered
- "Next"

STEP 2: CONFIGURE
- Printer Selection (Dropdown: System Printers + Configured Zebra Printers, "Add Printer" Link)
- Copies Per Label (Number, Default 1)
- Label Range (If Continuous: From Tag / To Tag)
- Cut Mode (Radio: After Each / After Batch / None)
- Print Speed / Darkness (If Zebra: Sliders 1-10)
- Media Type (Label / Receipt / Continuous)
- "Print to File" (Checkbox) → ZPL / EPL / PDF Download
- "Next"

STEP 3: PRINT
- Final Preview (First 5 Labels)
- "Print" (Primary, Loading: "Sending to printer...")
- Success: "Sent to [Printer Name]" + "Print Another Batch" (Ghost) + "Done"
- Error: "Printer error: [Message]" + Retry

BATCH PRINT VIA SCRIPT (Advanced):
- "Generate Print File" → Downloads .zpl/.epl/.pdf
- Documentation Link: "Automate with CLI: assetmt print --template standard --assets-file tags.txt"

REALISTIC DATA:
- Template: "Standard 2×1 ZPL"
- Printer: "Zebra ZT410 (USB)"
- Assets: LPT-0001 through LPT-0050 (50 labels)
```

---

## Screen 4: Template Variables Reference
```
Using the approved design system, create Variables Reference Panel (Collapsible in Designer Right Panel).

LAYOUT:
- Collapsible Panel in Right Panel (Data Binding Tab)
- Search Variables (Input)
- Categories (Accordion):
  1. ASSET IDENTIFICATION: {{asset_tag}}, {{serial_no}}, {{make}}, {{model}}, {{category}}, {{category_color}}, {{category_icon}}
  2. ASSIGNMENT: {{site}}, {{site_code}}, {{location}}, {{location_code}}, {{department}}, {{department_code}}, {{custodian_name}}, {{custodian_email}}, {{custodian_avatar}}
  3. FINANCIAL: {{purchase_date}}, {{purchase_date_iso}}, {{cost}}, {{cost_formatted}}, {{currency}}, {{vendor}}, {{warranty_expiry}}, {{warranty_expiry_iso}}, {{warranty_status}}
  4. STATUS & DATES: {{status}}, {{status_color}}, {{created_at}}, {{updated_at}}, {{assigned_at}}, {{last_audit_at}}
  5. CUSTOM FIELDS: {{custom_field_1}} ... {{custom_field_N}} (Dynamic per tenant)
  6. COMPUTED: {{age_days}}, {{age_years}}, {{depreciation}}, {{depreciation_formatted}}, {{is_overdue}}, {{is_warranty_expiring}}
  7. SYSTEM: {{tenant_name}}, {{tenant_subdomain}}, {{current_date}}, {{current_datetime}}, {{print_batch_id}}, {{label_sequence}}
  8. BARCODE SPECIFIC: {{barcode_data}} (Auto: asset_tag), {{qr_data}} (Auto: JSON with tag, serial, url)

EXPRESSION HELPERS:
- {{#if condition}}...{{/if}} — Conditional
- {{#each array}}...{{/each}} — Loop (for multi-value fields)
- {{variable | formatter}} — Pipe: uppercase, lowercase, truncate:20, date:MM/DD/YYYY, currency, number

COPY BUTTON per Variable (Copies {{variable}} to Clipboard)
INSERT BUTTON (Inserts at Cursor in Expression Builder)

REALISTIC DATA:
- All variables shown with Sample Values from LPT-0001
```