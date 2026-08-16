# Stitch Prompt: Authentication & Onboarding Screens
**Version:** 2.0.0  
**Depends on:** Master Prompt (design system, tokens, shell)  
**Generate after:** Master Prompt approved  

---

## Screen 1: Landing Page (Public)
```
Using the approved design system, create a public landing page for Asset Maintenance Tool.

LAYOUT (Desktop):
- Full-width hero section (min-height 90vh)
- Top Bar: Logo left, "Sign In" ghost button right, "Start Free Trial" primary button right
- Hero: H1 "Know what you own. Trust where it is." (Display 48px), sub-headline (Body Large), CTA group: "Start Free Trial" (Primary, Lg) + "Watch Demo" (Ghost, Lg)
- Feature highlights (3-column grid): 
  1. "Continuous Inventory" (box icon) - Endpoint agent for laptops
  2. "Audit in Seconds" (clipboard-check icon) - Mobile barcode scanner
  3. "Labels That Work" (tag icon) - Zebra-compatible designer
- Trust indicators: "SOC 2 Type II Certified", "99.9% Uptime", "GDPR Compliant"
- Footer: Product, Company, Resources, Legal links

LAYOUT (Mobile):
- Stack hero, single-column features, bottom CTA sticky

STATES:
- Default, Hover (cards lift), Focus (CTA ring), Loading (skeleton hero)

REALISTIC DATA:
- Feature cards with actual icons, not placeholders
```

---

## Screen 2: Sign In
```
Using the approved design system, create the Sign In screen.

LAYOUT (Desktop):
- Centered card (max-width 420px) on branded background (Primary Light)
- Top Bar: Logo only (clickable → Landing)
- Card: Logo + Product Name, H2 "Welcome back", Form:
  - Email Input (label, placeholder "you@company.com", autocomplete="email")
  - Password Input (label, placeholder "••••••••", show/hide toggle, autocomplete="current-password")
  - Checkbox "Remember me" (left) + "Forgot password?" link (right)
  - Primary Button "Sign In" (full-width, Lg)
  - Divider "or continue with"
  - SSO Buttons (Ghost, full-width, icon + text): Azure AD, Okta, Google Workspace
  - Link "Don't have an account? Sign up" (bottom center)
- Empty State: Illustration if no tenants exist

LAYOUT (Mobile):
- Full-screen, top bar minimal, card fills viewport

STATES:
- Default, Hover (buttons), Focus (inputs + button), Loading (spinner in button), Error (inline under field: "Invalid email or password"), Disabled (while submitting)

VALIDATION:
- Email: required, valid format
- Password: required, min 8 chars
- Show inline error on blur/submit

REALISTIC DATA:
- Pre-filled demo@company.com (placeholder only)
```

---

## Screen 3: Sign Up (Trial)
```
Using the approved design system, create the trial sign-up screen.

LAYOUT (Desktop):
- Centered card (max-width 480px) on branded background
- Steps: 1. Organization → 2. Admin → 3. Plan → 4. Complete
- Step 1: Organization name (required), Subdomain (auto-suggest from name, e.g., "acme.assetmt.com", editable, real-time availability check), Industry (Select), Company Size (Select)
- Step 2: Admin name, Email, Phone (optional), Password (strength meter), Confirm Password
- Step 3: Plan cards (Free/Pro/Enterprise) with feature comparison, radio selection
- Step 4: Terms checkbox (required), reCAPTCHA, "Create My Workspace" (Primary, Lg)
- Progress indicator (Stepper) at top

LAYOUT (Mobile):
- Full-screen stepper, swipe or Next/Back navigation

STATES:
- Default, Hover, Focus, Loading (per step), Error (inline), Success (Step 4 → redirect to Dashboard)

VALIDATION:
- Org name: required, 2-50 chars
- Subdomain: required, alphanumeric + hyphen, unique (debounced check)
- Email: required, valid, not already registered
- Password: 12+ chars, strength meter (weak/fair/strong)
- Terms: required checked

REALISTIC DATA:
- Sample org: "Acme Corporation" → subdomain "acme-corp"
```

---

## Screen 4: MFA Enrollment
```
Using the approved design system, create MFA enrollment (TOTP).

LAYOUT (Desktop):
- Centered card (max-width 420px)
- H2 "Add two-factor authentication"
- Step 1: QR Code (large, centered), "Scan with Google Authenticator, Authy, or 1Password"
- Step 2: Manual Entry Code (monospace, copy button)
- Step 3: 6-digit Code Input (6 separate inputs, auto-advance, paste support)
- Backup Codes: "Save these codes" (10 codes, 8 chars each, copy all / download .txt)
- "Skip for now" (Ghost, if not enforced by policy)

LAYOUT (Mobile):
- Stacked, QR code full-width

STATES:
- Default, Focus (code inputs), Loading (verifying), Error ("Invalid code"), Success (toast + redirect)

REALISTIC DATA:
- Sample QR, code "123 456", backup codes list
```

---

## Screen 5: Password Reset Request
```
Using the approved design system, create password reset request.

LAYOUT:
- Centered card, H2 "Reset your password"
- Email Input, "Send reset link" (Primary)
- "Back to Sign In" link

STATES: Default, Focus, Loading, Success ("Check your email"), Error

REALISTIC DATA: Placeholder email
```

---

## Screen 6: Password Reset (New Password)
```
Using the approved design system, create new password screen (token in URL).

LAYOUT:
- Centered card, H2 "Create new password"
- New Password Input (strength meter), Confirm Password Input
- "Update Password" (Primary)
- Validation: 12+ chars, strength meter

STATES: Default, Focus, Loading, Error (mismatch, weak, token expired), Success → Sign In

REALISTIC DATA: Strength meter examples
```

---

## Screen 7: First-Time Setup Wizard (4 Steps)
```
Using the approved design system, create 4-step setup wizard for new tenant.

LAYOUT (Desktop):
- Full-screen with progress stepper (Branding → Sites → Team → Tags → Complete)
- Sidebar: Step list with icons, current highlighted
- Main: Step content, Next/Back/Submit actions

STEP 1 - Branding:
- Logo upload (drop zone, preview, light/dark versions)
- Primary color picker (with contrast preview against white/dark)
- Favicon upload
- "Preview Login Page" link

STEP 2 - Sites & Locations:
- Add Site modal: Name, Address, City, Country, Timezone
- Nested Locations per site (inline add/edit)
- "Add Site" button, list with edit/delete

STEP 3 - Invite Team:
- Bulk email input (textarea, one per line, validate each)
- Role dropdown per email (IT Asset Manager, Employee, Auditor, Read-Only)
- "Send Invites" (Primary)

STEP 4 - Asset Tag Format:
- Prefix input (e.g., "LPT-", "MON-", "AST-")
- Numbering: Start number, Padding (e.g., 0001)
- Live preview: "LPT-0001", "LPT-0002"
- "Complete Setup" → redirect to Dashboard

STATES: Each step validates before Next, Loading on submit, Error inline, Success toast

REALISTIC DATA: Sample logo, color, sites, invites, tag format
```

---

## Screen 8: Invite Acceptance
```
Using the approved design system, create invite acceptance (tokenized link).

LAYOUT:
- Centered card, shows inviting org logo/name
- "You've been invited to [Org Name] as [Role]"
- Set Password (strength meter), Confirm
- MFA Enrollment (optional, "Skip for now")
- "Accept Invitation" → redirect to Dashboard

STATES: Default, Focus, Loading, Error (invalid/expired token), Success

REALISTIC DATA: "Acme Corporation", "IT Asset Manager"
```