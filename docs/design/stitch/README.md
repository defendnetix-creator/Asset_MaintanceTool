# Stitch Design Workspace

**Owner:** Founding Product Architect  
**Status:** Prompts ready for generation; awaiting client review  
**Last updated:** 2026-08-15

## Purpose

This folder contains all Google Stitch prompts and generated design artifacts for the Asset Maintenance Tool. The design process follows a **Master Prompt → Batch Prompts** sequence to ensure consistency across the entire application.

## Structure

```
docs/design/stitch/
├── prompts/
│   ├── STITCH_DESIGN_PROMPTS.md          # Complete prompt pack (master + 10 batches)
│   ├── 00-MASTER-PROMPT.md               # Extracted master prompt (for easy copy-paste)
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
│   ├── design-tokens.json                # Generated after Master Prompt approval
│   ├── components/                       # Component variants (all 12 states)
│   └── screens/                          # Screen frames (Mobile/Tablet/Desktop + Dark Mode)
└── README.md                             # This file
```

## Generation Process

### Phase 1: Design System Foundation (Master Prompt)
1. Copy `prompts/00-MASTER-PROMPT.md` into Stitch
2. Review generated:
   - Design tokens (colors, spacing, typography, shadows, radii, breakpoints)
   - Application shell (top bar, sidebar, mobile drawer, bottom tab bar)
   - Component library (25 components × 12 states each)
   - Responsive behavior rules
   - Accessibility annotations
   - Dark mode tokens
3. **Client Approval Required** before proceeding

### Phase 2: Screen Batches (Sequential)
After Master approval, run each batch prompt in order:
1. **Batch 1:** Authentication & Onboarding
2. **Batch 2:** Dashboard & Global Search
3. **Batch 3:** Asset Registry (Core)
4. **Batch 4:** Lifecycle Workflows
5. **Batch 6:** Audit & Inventory Sessions
6. **Batch 6:** Reports, Dashboards & Alerts
7. **Batch 7:** Administration & Settings
8. **Batch 8:** Endpoint Agent & Mobile PWA
9. **Batch 9:** Label Designer & Printing
10. **Batch 10:** Settings, Profile, Help & Edge Cases

After each batch, review frames for:
- Consistency with design system
- All 12 states present
- Mobile/Tablet/Desktop + Dark Mode frames
- Accessibility annotations
- Realistic sample data
- Prototype links for key flows

### Phase 3: Final Export & Handoff
When all batches approved:
1. Export `design-tokens.json`
2. Export component library
3. Export all screen frames
4. Share Stitch project with engineering team (view access)
4. Create implementation tickets referencing frame names

## Current Status

| Step | Status | Notes |
|------|--------|-------|
| Master Prompt | ✅ Written | Ready for Stitch |
| Batch Prompts (1-10) | ✅ Written | Ready for sequential generation |
| Design Tokens | ⏳ Pending | After Master Prompt run |
| Component Library | ⏳ Pending | After Master Prompt run |
| Screen Frames | ⏳ Pending | After batch execution |
| Client Review | ⏳ Pending | Awaiting your approval |

## How to Use

### In Stitch Web App
1. Create new project: "Asset Maintenance Tool – SaaS UI Design"
2. Paste Master Prompt → Generate
3. Review & approve design system
4. Paste Batch 1 Prompt → Generate → Review
5. Repeat for Batches 2-10

### In Repository
- Prompts are version-controlled in `prompts/`
- Exports are committed to `exports/` after generation
- Each batch generates a commit with its frames

## Key Design Decisions (from PRD)

- **Endpoint Agent Panel** – Conditional feature (🏷️); only shown if agent enrolled
- **Label Designer** – Full visual editor (Figma-lite); keyboard shortcuts
- **Mobile PWA** – Offline-first audit scanner; bottom tab bar; install prompt
- **Asset Tag Uniqueness** – Real-time validation in Add/Edit forms
- **Role-Based Field Masking** – Serial numbers hidden from Read-Only roles in exports
- **Dark Mode** – Full token support; CSS custom properties
- **Accessibility** – WCAG 2.1 AA non-negotiable; focus management, ARIA, contrast

## Related Documents

- **PRD:** `../../prd/source/PRD-v1.0.0.md`
- **Technical PRD:** `../../prd/source/PRD-TECHNICAL-v1.0.0.md`
- **Feature Specs:** `../../features/`
- **Architecture:** `../../architecture/`

## Next Action Required

**Client Review:** Please review the Master Prompt (`prompts/00-MASTER-PROMPT.md` or the full `prompts/STITCH_DESIGN_PROMPTS.md`) and confirm:
- Visual direction (colors, typography, tone)
- Application shell layout
- Component library scope
- Any modifications before generation begins

Once approved, I will execute the Master Prompt in Stitch and share the generated design system for your review.

---

*This workspace is the single source of truth for all UI/UX designs. No design decisions should be made in code without a corresponding Stitch frame.*