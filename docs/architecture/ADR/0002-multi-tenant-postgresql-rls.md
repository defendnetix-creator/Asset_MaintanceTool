# ADR 0002: Multi-Tenant PostgreSQL RLS Architecture

**Status:** Accepted  
**Date:** 2024-08-17  
**Author:** Founding Product Architect  
**Decision:** Shared schema with `tenant_id` + Row-Level Security (RLS) on every table

---

## Context

The Asset Maintenance Tool is a multi-tenant SaaS where multiple companies (tenants) share the same application instance. Each tenant's data must be completely isolated — no cross-tenant data leaks under any circumstances.

## Decision

We implement **shared-schema multi-tenancy** with **PostgreSQL Row-Level Security (RLS)**:

- Single database, single schema
- Every tenant-owned table has `tenant_id UUID NOT NULL`
- RLS policies enforce isolation at the **database level** (not just application)
- Unique constraints scoped to tenant
- Prisma middleware auto-injects `tenant_id` on create/update
- Tenant context set via `SET LOCAL app.current_tenant = 'uuid'` per request

---

## Schema Pattern

```sql
-- Enable RLS on every tenant table
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_sessions ENABLE ROW LEVEL SECURITY;
-- ... every tenant table

-- Create RLS policy: users only see their tenant's data
CREATE POLICY tenant_isolation ON assets
USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Same policy pattern for every tenant table
CREATE POLICY tenant_isolation ON users
USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation ON audit_sessions
USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- ... repeat for every tenant table
```

### Tenant Context Function

```sql
-- Function to get current tenant (called by middleware)
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
BEGIN
    RETURN current_setting('app.current_tenant')::uuid;
EXCEPTION
    WHEN undefined_object THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Simplified policy using function
CREATE POLICY tenant_isolation ON assets
USING (tenant_id = current_tenant_id());
```

---

## Unique Constraints Per Tenant

```sql
-- Asset tags unique per tenant
CREATE UNIQUE INDEX idx_assets_tenant_tag 
ON assets (tenant_id, normalized_asset_tag);

-- User emails unique per tenant
CREATE UNIQUE INDEX idx_users_tenant_email 
ON users (tenant_id, lower(email));

-- Site names unique per tenant
CREATE UNIQUE INDEX idx_sites_tenant_name 
ON sites (tenant_id, name);
```

---

## Prisma Middleware (Auto-Inject tenant_id)

```typescript
// prisma/middleware/tenant-middleware.ts
import { PrismaClient, Prisma } from '@prisma/client';

export function tenantMiddleware(prisma: PrismaClient) {
  prisma.$use(async (params, next) => {
    const tenantId = getCurrentTenantId(); // From request context
    
    if (!tenantId && params.model) {
      // Allow system operations (migrations, seeding) to proceed
      if (['migrate', 'seed', 'introspect'].includes(params.action)) {
        return next(params);
      }
    }

    // Inject tenant_id on create
    if (params.action === 'create' && params.args.data) {
      params.args.data = {
        ...params.args.data,
        tenant_id: tenantId,
      };
    }

    // Inject tenant_id on update (prevent tenant change)
    if (params.action === 'update' && params.args.data) {
      delete params.args.data.tenant_id; // Prevent tenant switching
    }

    // Inject tenant_id on upsert
    if (params.action === 'upsert') {
      if (params.args.create) {
        params.args.create = { ...params.args.create, tenant_id: tenantId };
      }
      if (params.args.update) {
        delete params.args.update.tenant_id;
      }
    }

    // Auto-filter reads by tenant
    if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy'].includes(params.action)) {
      if (!params.args.where) params.args.where = {};
      params.args.where = {
        ...params.args.where,
        tenant_id: tenantId,
      };
    }

    // Delete: ensure tenant_id match
    if (['delete', 'deleteMany'].includes(params.action)) {
      if (!params.args.where) params.args.where = {};
      params.args.where = {
        ...params.args.where,
        tenant_id: tenantId,
      };
    }

    return next(params);
  });
}

// Usage in app
const prisma = new PrismaClient();
tenantMiddleware(prisma);
```

### Request Context Helper

```typescript
// context/tenant-context.ts
import { AsyncLocalStorage } from 'async_hooks';

const tenantContext = new AsyncLocalStorage<string>();

export function runWithTenant<T>(tenantId: string, callback: () => T): T {
  return tenantContext.run(tenantId, callback);
}

export function getCurrentTenantId(): string | undefined {
  return tenantContext.getStore();
}

// Fastify hook
app.addHook('preHandler', async (request, reply) => {
  const tenantId = extractTenantFromRequest(request); // From JWT, subdomain, header
  if (tenantId) {
    request.tenantId = tenantId;
    return tenantContext.run(tenantId, () => {});
  }
});
```

---

## PgBouncer Configuration

```ini
; pgbouncer.ini
[databases]
assetmt = host=postgres port=5432 dbname=assetmt user=assetmt password=***

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 5
max_prepared_statements = 100
ignore_startup_parameters = app.current_tenant
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
stats_period = 60
```

**Important:** `ignore_startup_parameters = app.current_tenant` allows the `SET LOCAL app.current_tenant` command to pass through PgBouncer.

---

## Migration Strategy

```sql
-- 1. Add tenant_id to existing tables (for migration)
ALTER TABLE assets ADD COLUMN tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE users ADD COLUMN tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
-- ... all tenant tables

-- 2. Create indexes
CREATE INDEX idx_assets_tenant ON assets (tenant_id);
CREATE INDEX idx_users_tenant ON users (tenant_id);
-- ... all tenant tables

-- 3. Backfill tenant_id for existing data (single tenant migration)
UPDATE assets SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id = '00000000-0000-0000-0000-000000000000';

-- 4. Make tenant_id NOT NULL (after backfill)
ALTER TABLE assets ALTER COLUMN tenant_id SET NOT NULL;
-- ... all tenant tables

-- 5. Enable RLS and create policies
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON assets USING (tenant_id = current_setting('app.current_tenant')::uuid);
-- ... all tenant tables

-- 6. Add unique constraints per tenant
CREATE UNIQUE INDEX idx_assets_tenant_tag ON assets (tenant_id, normalized_asset_tag);
-- ... all unique constraints
```

---

## Testing RLS

```sql
-- Test as tenant_a
SET LOCAL app.current_tenant = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
SELECT * FROM assets; -- Should only show tenant_a assets

-- Test as tenant_b
SET LOCAL app.current_tenant = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
SELECT * FROM assets; -- Should only show tenant_b assets

-- Test cross-tenant insert prevention
SET LOCAL app.current_tenant = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
INSERT INTO assets (tenant_id, asset_tag, ...) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'LPT-0001', ...);
-- Should fail or be overridden by middleware
```

---

## Consequences

### Positive
- **Database-enforced isolation** — impossible to leak data even with app bugs
- **Zero cross-tenant queries** — RLS handles filtering automatically
- **Audit trail** — every query automatically scoped to tenant
- **Compliance ready** — database-level isolation meets strict requirements

### Negative
- **Every query needs tenant context** — middleware must be bulletproof
- **PgBouncer complexity** — must ignore `app.current_tenant` parameter
- **Migration complexity** — existing data needs backfill
- **Debugging harder** — must set `app.current_tenant` for manual queries

---

## References

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Prisma Middleware](https://www.prisma.io/docs/orm/prisma-client/client-extensions/middleware)
- [PgBouncer Configuration](https://www.pgbouncer.org/config.html)
- [Multi-Tenant Patterns](https://www.citus.io/blog/2019/02/04/multi-tenancy-postgres/)

---

**Next:** ADR 0003 — Free Frontend Stack