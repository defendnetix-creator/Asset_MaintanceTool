## SaaS Recovery — Lessons from Asset_MaintanceTool Recovery Session

### Trigger Conditions
Use when:
- Application is in broken state after Docker operations (up/down/restart cycles)
- Prisma migrations fail with column type mismatches (UUID vs TEXT)
- Authentication returns DATABASE_ERROR or INVALID_CREDENTIALS
- Database tables are missing after migration reset
- Need to restart services from clean state

### Core Recovery Procedure

#### Step 1: Diagnose the Failure
- Check `docker compose ps` — identify which services are running/healthy
- Check backend logs: `docker compose logs backend --tail 30`
- Check database state via Prisma or SQL
- Common failure patterns:
  - `_AuditAuditors` table column type mismatch (UUID vs TEXT)
  - Migration records stuck in `_prisma_migrations` with `applied_steps_count = 0`
  - Database schema reset needed after multiple up/down cycles
  - Missing User table from failed migrations

#### Step 2: Fix Migration Type Mismatches
**Root Cause**: Prisma `String @default(uuid())` maps to PostgreSQL `TEXT`, but migration files may define columns as `UUID`

**Fix**: Edit `backend/prisma/migrations/{migration_name}/migration.sql` to change:
- `UUID` → `TEXT` for columns that reference `String @default(uuid())`
- Example: Change `"A" UUID NOT NULL` → `"A" TEXT NOT NULL`
- Re-apply: `npx prisma migrate deploy`

#### Step 3: Clean Database Reset (when migrations are stuck)
```bash
docker compose down -v
docker volume prune -f
docker volume rm assetmt-postgres-data assetmt-minio-data assetmt-redis-data
docker compose up -d postgres redis minio
# Wait for services to be healthy
docker compose up -d backend
npx prisma migrate reset --force
npx prisma generate
npx prisma db seed
```

#### Step 4: Verify Core Services
- Backend health: `curl http://localhost:3001/health` → `{"status":"ok"}`
- Frontend: `http://localhost` should serve React/Vite SPA
- Database tables exist: User, Tenant, Session, _AuditAuditors
- **Seed data verified**: Run `npx tsx prisma/seed.ts` to ensure demo tenant and admin user exist

#### Step 5: Test Authentication Flow
1. Login with seeded credentials: `admin@example.com` / `Admin@123`
2. Verify JWT token + Set-Cookie returned
3. Test protected endpoint: `GET /api/auth/me` with Bearer token
4. Test browser login flow

#### Step 6: Test Core User Workflows
- Create asset
- View asset 
- Edit asset
- Search/filter assets
- Assign/unassign assets
- Archive/delete assets
- Logout

### Common Fixes

#### Fix 1: UUID→TEXT Migration Issue
**File**: `backend/prisma/migrations/20260820230000_add_audit_auditors_relation/migration.sql`
**Problem**: Column types `UUID` conflict with Prisma `String @default(uuid())` which maps to PostgreSQL `TEXT`
**Solution**: Change all UUID columns to TEXT in the migration SQL, then reset/redeploy migrations

#### Fix 2: Healthcheck Probe Configuration
**File**: `docker-compose.uat.yml` (or local docker-compose.yml)
**Problem**: `wget -q --spider http://localhost/health` fails inside containers
**Solution**: Change to `curl -f http://localhost/health`

#### Fix 3: Rate Limit Plugin Build Failure
**File**: `backend/src/plugins/rate-limit.js` (or similar)
**Problem**: `keyGenerator` and `errorMessage` fields cause build failures
**Solution**: Remove these fields from the rate-limit plugin configuration

#### Fix 4: JWT Verification Type Cast
**File**: `backend/src/plugins/auth.ts`
**Problem**: TypeScript strict checking on `jwtVerify` result
**Solution**: Add `(accessToken as any)` cast while preserving runtime JWT verification

#### Fix 5: Import Path Fix
**File**: `backend/src/index.ts`
**Problem**: Import from `'./plugins/auth.js'` instead of `'./plugins/auth'`
**Solution**: Fix import path to match actual file extension

### Recovery Checklist
- [ ] All Docker services healthy (postgres, redis, minio, backend, frontend)
- [ ] Migration SQL files have correct TEXT types (not UUID)
- [ ] `_prisma_migrations` table reflects correct applied state
- [ ] User table exists with demo data
- [ ] Login API returns 200 + JWT token + Set-Cookie
- [ ] Protected endpoint `/api/auth/me` works with Bearer token
- [ ] Frontend at `http://localhost` loads without errors
- [ ] No TypeScript compilation errors in Docker
- [ ] All API health checks passing

### Evidence Capture
Record working application states under `tests/evidence/`:
- `tests/evidence/application-load/` — Frontend load verification
- `tests/evidence/login/` — Login API and browser flow
- `tests/evidence/dashboard/` — Dashboard functionality
- `tests/evidence/assets/` — Asset workflow tests
- `tests/evidence/logout/` — Logout flow verification

### New — Database Seed Verification
**Critical**: After any Docker reset or migration restart, always verify seeded data exists.

**Seed command**: `npx tsx prisma/seed.ts` (from backend directory)

**Verify seed data**:
- Demo tenant exists (slug: 'demo')
- Admin user exists: `admin@example.com` with role `TENANT_ADMIN`
- Password hash populated for admin user
- Tenant relationship valid for all users

**If seed fails**:
- Check DATABASE_URL in .env matches PostgreSQL container
- Verify prisma/schema.prisma model definitions match seed.ts
- Ensure npx/tsx is available in the backend container
- Re-run: `npx prisma db seed --preview-feature`

### Seed Data Reference
**Tenant**: Demo Organization, slug: 'demo', plan: FREE
**Admin User**: admin@example.com, role: TENANT_ADMIN, status: ACTIVE
**Password**: Admin@123 (hashed via argon2 in seed.ts)

### Prisma Seed Script Location
`backend/prisma/seed.ts` — contains `export default defineSchema({ ... })` with tenant and user creation

**Key seed fields**:
- Tenant: name, slug, plan, status, timezone, currency, date_format, time_format, max_assets, max_users, max_storage_gb
- User: email, password_hash (argon2), first_name, last_name, role, tenant_id, status