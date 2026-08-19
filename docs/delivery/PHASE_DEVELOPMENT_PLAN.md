# Asset Maintenance Tool - 5-Phase Development Plan

**Goal:** 99% feature-complete application (not deployment)
**Repository:** https://github.com/defendnetix-creator/Asset_MaintanceTool
**Current State:** Foundation blueprint complete, Prisma generates ✓, Route TypeScript errors fixed ✓, Auth plugin fixed ✓, Infrastructure errors remain

---

## Phase Overview

| Phase | Focus | Duration | Key Deliverable | Status |
|-------|-------|----------|-----------------|--------|
| **Phase 1** | **Core Stability** | 1-2 weeks | Zero TypeScript errors, working dev environment | 🔄 **IN PROGRESS** (~90%) |
| **Phase 2** | **API Completion** | 1-2 weeks | All endpoints tested, OpenAPI spec generated | ⏳ Pending |
| **Phase 3** | **Frontend Integration** | 2-3 weeks | All pages connected, real data flows | ⏳ Pending |
| **Phase 4** | **Advanced Features** | 2-3 weeks | Webhooks, PWA, offline, real-time | ⏳ Pending |
| **Phase 5** | **Hardening & Polish** | 1-2 weeks | Tests, security, performance, docs | ⏳ Pending |

---

## Phase 1: Core Stability (Week 1-2) - **IN PROGRESS**

**Objective:** Zero TypeScript errors, working dev stack, database migrations

### Completed ✅
- [x] Prisma schema generates successfully with tenant `status` field
- [x] Prisma client generated (`npx prisma generate`)
- [x] Private GitHub repo with all artifacts
- [x] Documentation (PRDs, ADRs, Stitch prompts, Evidence Index)
- [x] Backend scaffold (Fastify + plugins + 16 route modules)
- [x] **All 16 Route Files** ✅ **TypeScript errors FIXED**
  - auth.ts ✅
  - assets.ts ✅
  - audits.ts ✅
  - categories.ts ✅
  - contracts.ts ✅
  - departments.ts ✅
  - documents.ts ✅
  - maintenance.ts ✅
  - notifications.ts ✅
  - reports.ts ✅
  - settings.ts ✅
  - sites.ts ✅
  - users.ts ✅
  - webhooks.ts ✅
  - agents.ts ✅
  - admin.ts ✅
- [x] **Auth Plugin** ✅ **FIXED**
  - argon2 imports working
  - isPublicRoute moved inside plugin
  - tenant_id field mapping fixed
- [x] **BullMQ** ✅ Removed QueueScheduler (v5 compatible)
- [x] **Plugin Index** ✅ ES module imports with `.js` extensions
- [x] **Routes Index** ✅ ES module imports with `.js` extensions
- [x] **Middleware** ✅ Type declarations for user/tenantId consistency
- [x] **Rate Limit Plugin** ✅ Removed `errorMessage` option
- [x] Auth Dependencies ✅ `@fastify/jwt`, `@fastify/cookie`, `argon2` installed
- [x] Missing Plugin Dependencies ✅ `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit`, `@fastify/multipart`, `ioredis`, `redis`, `@types/ws` installed
- [x] Frontend scaffold (React 18 + Vite + Tailwind + PWA + 15 pages)
- [x] Docker infrastructure (PostgreSQL, Redis, MinIO, Caddy, Prometheus/Grafana)

### Remaining for Phase 1 Completion (~10%)
| Task | Blocker |
|------|---------|
| **Infrastructure TypeScript** | `src/index.ts` import paths need `.js` extensions (but files don't exist at runtime without build) |
| **WebSocket Plugin** | Type declarations need cleanup |
| **Upload Plugin** | Multipart types need fixing |
| **Tracing Plugin** | PrometheusExporter API mismatch |
| **Redis Plugin** | Type imports from `redis` vs `ioredis` |
| **Metrics Plugin** | Unknown type for result |
| **Tenant Context** | `user` declaration conflict with auth plugin |
| **Database Migrations** | Need Docker services running first |
| **Dev Environment** | `docker-compose up` → migrations → `npm run dev` |

---

## Phase 2: API Completion (Week 2-3)

**Objective:** All 100+ endpoints functional, tested, documented

### Tasks
- [ ] **Authentication Flow**
  - Login/logout with JWT cookies
  - Refresh token rotation
  - Password reset flow
  - MFA (TOTP) setup/verify
- [ ] **Asset Management CRUD**
  - List with filters/pagination/sort
  - Create/update/delete/bulk
  - Import preview/commit (CSV/JSON)
  - Export (CSV/JSON)
  - Custom fields
- [ ] **Audit/Inventory**
  - Session CRUD
  - Scanner WebSocket (mobile PWA)
  - Scan submit, reconcile discrepancies
  - Export reports (CSV/JSON)
- [ ] **Maintenance Work Orders**
  - Full lifecycle (create → start → complete)
  - Tasks, parts, labor, attachments, notes
  - Recurring work orders
- [ ] **Reports & Dashboards**
  - Prebuilt reports (20+)
  - Custom report builder
  - Scheduled reports
  - Dashboard widgets (KPIs, charts)
- [ ] **Admin & Settings**
  - Tenant settings (security, retention, SSO)
  - User management (invite, roles, MFA reset)
  - Branding, subscription, audit log
- [ ] **Webhooks**
  - CRUD, test delivery, retry logic
  - HMAC signature verification
- [ ] **OpenAPI/Swagger**
  - Generate from Zod schemas
  - Host at `/docs`

### Exit Criteria
- All endpoints return 200/400/401/403/404 correctly
- Postman collection exported
- OpenAPI spec at `/docs` renders

---

## Phase 3: Frontend Integration (Week 4-6)

**Objective:** All pages connected to real APIs, real data flows

### Tasks
- [ ] **Authentication Pages**
  - Login form with validation
  - Password reset flow
  - MFA setup screen
- [ ] **Dashboard**
  - KPI cards from `/reports/dashboard/widgets`
  - Charts (Recharts) for assets by status/category, work orders, audit trends
  - Quick actions
- [ ] **Assets**
  - List page with filters, pagination, sort
  - Detail page with tabs (overview, details, images, documents, history, custom fields)
  - Create/edit modal with custom fields
  - Bulk actions toolbar
  - Import/export buttons
- [ ] **Audits**
  - Session list with progress bars
  - Scanner page (mobile PWA) - camera + manual entry
  - Scan submit with status buttons
  - Discrepancy reconciliation UI
- [ ] **Maintenance**
  - Work order list with status badges
  - Detail with tasks, parts, labor, attachments, notes
  - Create/start/complete flow
- [ ] **Reports**
  - Prebuilt report browser with category accordion
  - Run report with format selection
  - Custom report builder (3-pane drag-drop)
  - Scheduled reports management
- [ ] **Users & Admin**
  - User table with invite, edit, reset password, MFA reset
  - Settings tabs (general, security, SSO, branding, subscription, audit log)
- [ ] **Settings**
  - Profile, password, MFA, notifications, appearance, regional
- [ ] **PWA Features**
  - Install prompt
  - Offline indicator
  - Background sync for scans

### Exit Criteria
- All 15 pages load data from API
- No mock data remaining
- Mobile responsive (375px, 768px, 1440px)
- PWA installs and works offline

---

## Phase 4: Advanced Features (Week 7-9)

**Objective:** Real-time, offline, integrations, agent

### Tasks
- [ ] **Endpoint Agent**
  - Enrollment token generation
  - Agent WebSocket (heartbeat, data sync, commands)
  - Software/hardware inventory collection
  - Agent management UI
- [ ] **Real-time WebSockets**
  - Scanner sync (audit sessions)
  - Agent data push
  - Notification broadcasting
- [ ] **Offline-First PWA**
  - IndexedDB for scan queue
  - Background sync on reconnect
  - Conflict resolution
- [ ] **Webhook Delivery**
  - Retry with exponential backoff
  - Dead letter queue
  - Delivery logs UI
- [ ] **Background Jobs (BullMQ)**
  - Import/export processing
  - Report generation
  - Scheduled reports
  - Webhook retries
  - Agent sync
- [ ] **File Handling**
  - ClamAV scanning
  - MinIO presigned URLs
  - Image optimization (sharp)
- [ ] **Label Designer & Printing**
  - Visual designer (ZPL/EPL)
  - Variable binding
  - Print preview

### Exit Criteria
- Agent enrolls, sends heartbeats, receives commands
- Scans work offline → sync on reconnect
- Webhooks retry and log deliveries
- Labels print to Zebra printer

---

## Phase 5: Hardening & Polish (Week 10-11)

**Objective:** Production-ready quality, security, performance

### Tasks
- [ ] **Testing**
  - Unit tests (Vitest) - 80% coverage target
  - Integration tests (API + DB)
  - E2E tests (Playwright) - critical paths
  - Load testing (k6) - 1000 concurrent users
- [ ] **Security**
  - CSP headers
  - Rate limiting
  - SQL injection prevention (Prisma)
  - XSS prevention (React)
  - CSRF protection
  - Audit log tamper verification
- [ ] **Performance**
  - Database indexes verified
  - Query optimization (N+1 prevention)
  - Bundle size analysis
  - Image optimization
  - Caching headers
- [ ] **Accessibility (WCAG 2.1 AA)**
  - Semantic HTML
  - ARIA labels
  - Keyboard navigation
  - Focus management
  - Color contrast
- [ ] **Documentation**
  - API reference (from OpenAPI)
  - User guide (key workflows)
  - Admin guide
  - Developer guide
  - Runbooks
- [ ] **Error Handling**
  - Global error boundaries
  - User-friendly error messages
  - Sentry integration
  - Structured logging

### Exit Criteria
- 0 critical/high security findings
- >80% test coverage
- p95 API latency < 200ms
- Lighthouse score > 90
- Zero console errors in production build

---

## Phase Gates

| Gate | Check | Status |
|------|-------|--------|
| **1→2** | `npm run build` passes, `docker-compose up` works | 🔄 |
| **2→3** | All API endpoints return correct responses, OpenAPI generated | ⏳ |
| **3→4** | All pages load real data, PWA installs | ⏳ |
| **4→5** | Agent works, offline scans sync, webhooks retry | ⏳ |
| **5→Done** | Tests pass, security scan clean, Lighthouse >90 | ⏳ |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| TypeScript errors block build | Fix incrementally, use `// @ts-ignore` sparingly with tickets |
| Prisma RLS complexity | Test multi-tenant isolation early with 2 test tenants |
| PWA offline complexity | Build scan queue first, add background sync later |
| WebSocket scaling | Use Redis pub/sub for multi-instance |
| Zod schema maintenance | Keep schemas in single source, generate types |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| TypeScript errors | 0 |
| API endpoints | 100+ working |
| Frontend pages | 15 connected |
| Test coverage | >80% |
| Security findings | 0 critical/high |
| Lighthouse score | >90 |
| Bundle size | <500KB gzipped |
| API p95 latency | <200ms |

---

## Current Blockers (Phase 1 Completion)

1. **Infrastructure TypeScript** - ES modules, middleware types, plugin deps
2. **Database not running** - Need Docker Compose to start PostgreSQL/Redis/MinIO
3. **Migrations not run** - Need `npx prisma migrate dev --name init` after DB is up

---

## Next Immediate Steps

```bash
# 1. Start Docker services
cd /path/to/Asset_MaintanceTool
docker-compose up -d postgres redis minio

# 2. Run Prisma migrations
cd backend && npx prisma migrate dev --name init

# 3. Fix infrastructure TypeScript errors
#    - Fix websocket plugin types (ws vs WebSocket)
#    - Fix upload plugin (multipart types)
#    - Fix tracing plugin (PrometheusExporter API)
#    - Fix redis plugin imports
#    - Fix tenant-context middleware user declaration
#    - Fix metrics plugin unknown type

# 4. Build and start dev
npm run build
npm run dev  # :3001

# 5. Frontend build
cd ../frontend && npm run build && npm run dev  # :3000
```

---

## Progress Summary (This Session)

| Item | Status |
|------|--------|
| Prisma schema | ✅ Generates successfully with tenant status |
| GitHub repo | ✅ All artifacts pushed to `docs/foundation-blueprint` |
| Phase 1 plan | ✅ Created and updated |
| **16 Route files TypeScript** | ✅ **ALL FIXED** |
| **Auth Plugin** | ✅ **COMPLETE** (argon2, isPublicRoute inside plugin) |
| **BullMQ** | ✅ v5 compatible (no QueueScheduler) |
| **Plugin/Route Index** | ✅ ES module imports with `.js` |
| **Rate Limit Plugin** | ✅ Removed `errorMessage` |
| **Middleware** | ✅ Type declarations fixed |
| Auth Dependencies | ✅ Installed |
| Missing Plugin Dependencies | ✅ Installed |
| Backend scaffold | ✅ Complete (needs infra fixes) |
| Frontend scaffold | ✅ Complete (needs integration) |
| Docker infra | ✅ Complete |
| Stitch design prompts | ✅ 12 prompts ready for review |
| Evidence Index | ✅ 19 files classified |
| PRDs (Biz + Tech) | ✅ Markdown + DOCX + PDF |
| ADRs | ✅ 5 decisions documented |