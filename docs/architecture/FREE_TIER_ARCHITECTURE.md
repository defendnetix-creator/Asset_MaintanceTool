# Free-Tier Architecture Specification

**Version:** 1.0.0  
**Status:** Accepted  
**Date:** 2024-08-17  
**Author:** Founding Product Architect  
**Scope:** Complete zero-cost, self-hosted architecture for Asset Maintenance Tool

---

## Executive Summary

This document specifies the complete **zero-cost, self-hosted architecture** for the Asset Maintenance Tool. Every component is open-source, self-hostable, and incurs **zero monthly cost**. The architecture supports multi-tenancy, real-time features, background jobs, file storage, and full observability — all on commodity hardware or free-tier cloud VMs.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ASSET MAINTENANCE TOOL STACK                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐  │
│  │   CLIENT     │    │   REVERSE    │    │   BACKEND    │    │  CACHE/  │  │
│  │  (PWA)       │◄──►│   PROXY      │◄──►│  (FASTIFY)   │◄──►│  QUEUE   │  │
│  │  React 18    │    │   (CADDY)    │    │  Fastify     │    │ (REDIS)  │  │
│  │  TypeScript  │    │  Auto HTTPS  │    │  TypeScript  │    │ BullMQ   │  │
│  │  Vite        │    │  Let's Encrypt│   │  Prisma ORM  │    │          │  │
│  │  Tailwind    │    │              │    │  JWT/Argon2  │    │          │  │
│  │  TanStack Q  │    │              │    │  BullMQ      │    │          │  │
│  │  PWA         │    │              │    │  WebSocket   │    │          │  │
│  └──────────────┘    └──────────────┘    └──────┬───────┘    └──────────┘  │
│                                                 │                          │
│                                                 ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐  │
│  │  DATABASE    │    │   STORAGE    │    │  MONITORING  │    │   CI/CD  │  │
│  │ (POSTGRESQL) │    │   (MINIO)    │    │  PROM/GRAFANA│    │  GHA     │  │
│  │  PostgreSQL  │    │   MINIO      │    │  Prometheus  │    │  GitHub  │  │
│  │  15+         │    │   S3 API     │    │  Grafana     │    │  Actions │  │
│  │  RLS + RLS   │    │   S3 Compat  │    │  Loki        │    │          │  │
│  │  PgBouncer   │    │   Versioned  │    │  Alertmanager│    │          │  │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────┘  │
│                                                                             │
│  ALL COMPONENTS: OPEN SOURCE • SELF-HOSTED • ZERO MONTHLY COST             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Frontend (PWA)

| Aspect | Technology | Version | License |
|--------|------------|---------|---------|
| Framework | React | 18.2+ | MIT |
| Language | TypeScript | 5.3+ | Apache-2.0 |
| Build Tool | Vite | 5.0+ | MIT |
| Styling | Tailwind CSS | 3.4+ | MIT |
| State (Server) | TanStack Query | 5.17+ | MIT |
| State (Client) | Zustand | 4.5+ | MIT |
| Forms | React Hook Form + Zod | 7.49+ / 3.22+ | MIT |
| UI Primitives | Radix UI | 1.0+ | MIT |
| Icons | Lucide React | 0.344+ | ISC |
| Charts | Recharts | 2.12+ | MIT |
| PWA | Vite PWA Plugin (Workbox) | 0.19+ | MIT |
| Storybook | Storybook | 8.0+ | MIT |
| Testing | Vitest + Playwright | 1.3+ / 1.42+ | MIT |

**PWA Features:**
- Offline-first audit scanner (IndexedDB + Background Sync)
- Install prompt (beforeinstallprompt + manual instructions)
- Background sync for agent data, audit scans
- Offline banner + cached asset data
- Service Worker with Workbox (precache + runtime caching)

### 2. Backend

| Aspect | Technology | Version | License |
|--------|------------|---------|---------|
| Runtime | Node.js | 20 LTS | MIT |
| Language | TypeScript | 5.3+ | Apache-2.0 |
| Framework | Fastify | 4.25+ | MIT |
| Validation | Zod | 3.22+ | MIT |
| ORM | Prisma | 5.9+ | Apache-2.0 |
| Auth | jose (JWT) + Argon2id | 5.2+ / MIT | MIT |
| Background Jobs | BullMQ | 5.6+ | MIT |
| WebSocket | fastify-websocket | 10.0+ | MIT |
| File Upload | fastify-multipart | 8.2+ | MIT |
| Malware Scan | ClamAV (clamdscan) | 1.0+ | GPL-2.0 |
| Logging | Pino | 8.17+ | MIT |
| Metrics | prom-client | 15.1+ | MIT |
| Tracing | @opentelemetry/api + SDK | 1.0+ | Apache-2.0 |

**Key Features:**
- JWT Access + Refresh tokens (rotating, HttpOnly cookies)
- Argon2id password hashing (memory: 64MB, iterations: 3)
- BullMQ queues: imports, exports, reports, webhooks, agent sync, notifications
- WebSocket for real-time scanner, agent push, notifications
- ClamAV streaming scan on upload
- Structured JSON logs (Pino) + Prometheus metrics + OpenTelemetry tracing

### 3. Database (PostgreSQL 15+)

| Aspect | Configuration |
|--------|---------------|
| Version | 15+ (16 recommended) |
| Extension | uuid-ossp, pgcrypto, pg_trgm, btree_gin |
| Multi-tenant | Shared schema + `tenant_id` + RLS |
| Connection Pool | PgBouncer (transaction mode) |
| Backup | pg_dump + pg_basebackup (WAL) |
| Extensions | uuid-ossp, pgcrypto, pg_trgm, btree_gin, pg_stat_statements |

**Multi-Tenant Strategy:**
- Shared schema, single database
- Every tenant table has `tenant_id UUID NOT NULL`
- Row-Level Security (RLS) on **every** tenant table
- Unique constraints per tenant: `UNIQUE (tenant_id, normalized_asset_tag)`
- Prisma middleware auto-injects `tenant_id` on create/update
- RLS policies: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`

### 3b. Connection Pooling (PgBouncer)

| Setting | Value |
|---------|-------|
| Pool Mode | transaction |
| Max Client Connections | 100 |
| Default Pool Size | 25 |
| Min Pool Size | 5 |
| Reserve Pool Size | 5 |
| Reserve Pool Timeout | 5s |
| Max Prepared Statements | 100 |

### 4. Cache & Queue (Redis 7+)

| Aspect | Configuration |
|--------|---------------|
| Version | 7.2+ |
| Persistence | AOF (everysec) + RDB |
| Max Memory | 256MB (configurable) |
| Eviction Policy | allkeys-lru |
| Modules | None required (BullMQ uses standard commands) |

**BullMQ Queues:**
- `imports` — CSV/JSON asset imports (concurrency: 2)
- `exports` — CSV/XLSX/PDF exports (concurrency: 2)
- `reports` — Scheduled report generation (concurrency: 1)
- `webhooks` — Outbound webhook delivery (concurrency: 5)
- `agent-sync` — Endpoint agent data ingestion (concurrency: 10)
- `notifications` — Email/SMS/push notifications (concurrency: 5)
- `audit-sync` — Mobile audit scan sync (concurrency: 5)

### 5. Object Storage (MinIO)

| Aspect | Configuration |
|--------|---------------|
| Version | Latest (RELEASE.2024+) |
| API | S3-compatible (v4 signatures) |
| Buckets | `assets`, `imports`, `exports`, `backups`, `labels` |
| Encryption | SSE-S3 (MinIO managed) |
| Versioning | Enabled on all buckets |
| Lifecycle | `imports`/`exports`: 30 days; `backups`: 90 days |
| Access | Presigned URLs (15 min TTL) |

### 6. Reverse Proxy & SSL (Caddy)

| Aspect | Configuration |
|--------|---------------|
| Version | 2.7+ |
| Auto HTTPS | Let's Encrypt (ACME) |
| Email | Admin email for ACME registration |
| Domains | `app.yourdomain.com`, `api.yourdomain.com` |
| Headers | Security headers (HSTS, CSP, etc.) |
| Compression | gzip, zstd |
| Rate Limiting | Built-in (per IP, per tenant) |

**Caddyfile Example:**
```caddyfile
{
    email admin@yourdomain.com
    acme_ca https://acme-v02.api.letsencrypt.org/directory
}

app.yourdomain.com {
    reverse_proxy frontend:3000
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:;"
    }
    encode zstd gzip
}

api.yourdomain.com {
    reverse_proxy backend:3001
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
    }
    rate_limit {
        zone api 10r/s
        key {remote_host}
    }
}
```

### 7. Monitoring Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Prometheus | 2.47+ | Metrics collection |
| Grafana | 10.2+ | Dashboards & alerting |
| Loki | 2.9+ | Log aggregation |
| Alertmanager | 0.26+ | Alert routing |
| Promtail | 2.9+ | Log shipping |

**Key Dashboards:**
- System: CPU, Memory, Disk, Network
- Application: Request rate, latency, error rate, active users
- Database: Connections, query latency, cache hit ratio, replication lag
- Redis: Memory, connected clients, command latency, queue depths
- MinIO: Storage usage, request rate, error rate
- Business: Active tenants, assets, audits, agents, revenue

**Key Alerts:**
- CPU > 80% for 5m
- Memory > 85% for 5m
- Disk > 80%
- PostgreSQL connections > 80% of max
- Redis memory > 85%
- API error rate > 1% for 5m
- Queue depth > 1000 for 5m
- SSL cert expiry < 30 days
- Backup failure

### 8. CI/CD (GitHub Actions)

**Workflows:**
1. **CI** (on PR): lint → typecheck → unit tests → integration tests → build → security scan
2. **CD** (on merge to main): build → test → deploy to staging → smoke tests → manual approval → deploy to production
3. **Security** (weekly): dependency audit, secret scan, container scan
4. **Backup Verify** (weekly): restore test from backup

**Free Tier Limits:**
- 2,000 minutes/month private repos
- 500MB artifact storage
- Self-hosted runners (unlimited, use your own hardware)

### 9. Hosting Options (All Free)

| Option | Specs | Best For |
|--------|-------|----------|
| **Oracle Cloud Always Free** | 4 ARM Ampere CPUs, 24GB RAM, 200GB storage | Primary production |
| **GitHub Codespaces** | 2 cores, 8GB RAM, 32GB storage | Development |
| **Railway Trial** | $5 credit | Testing |
| **Fly.io** | Free allowance (requires CC) | Testing |
| **Your Hardware** | Unlimited | Full control |

**Recommended: Oracle Cloud Always Free**
- 4 ARM Ampere CPUs, 24GB RAM
- 200GB block storage
- 10TB monthly network
- 2 AMD EPYC VMs (1/8 OCPU each)
- No credit card required for Always Free tier

---

## Data Flow Summary

```
1. USER → CADDY (HTTPS) → FRONTEND (React PWA)
2. FRONTEND → CADDY → BACKEND (Fastify) → REDIS (cache/session)
3. BACKEND → PGPOOLER → POSTGRESQL (RLS enforced)
4. BACKEND → REDIS (BullMQ) → BACKGROUND JOBS
5. BACKEND → MINIO (S3) → FILE STORAGE
6. BACKGROUND JOBS → POSTGRESQL / MINIO / WEBHOOKS / EMAIL
7. AGENT → CADDY → BACKEND (WebSocket/REST) → REDIS → POSTGRESQL
8. MOBILE PWA (OFFLINE) → INDEXEDDB → BACKGROUND SYNC → BACKEND
9. MONITORING → PROMETHEUS → GRAFANA → ALERTMANAGER → EMAIL/WEBHOOK
```

---

## Security Baseline

| Layer | Controls |
|-------|----------|
| **Network** | Caddy rate limiting, private networks (Docker), no public DB ports |
| **Transport** | TLS 1.3 everywhere (Caddy auto-HTTPS), HSTS, secure cookies |
| **Application** | JWT (RS256), Argon2id, rotating refresh tokens, CSP, HSTS, CSP |
| **Database** | RLS on every table, parameterized queries (Prisma), least privilege users |
| **Storage** | SSE-S3, presigned URLs (15 min), bucket policies, versioning |
| **Secrets** | Environment variables (never in code), GitHub Environments, `.env` in `.gitignore` |
| **Supply Chain** | `npm audit`, `cargo audit` (if Rust), SBOM generation, pinned dependencies |
| **Container** | Non-root user, read-only rootfs, distroless/base images, Trivy scan |

---

## Backup & Disaster Recovery

| Aspect | Strategy |
|--------|----------|
| **PostgreSQL** | Daily pg_dump (compressed) → MinIO `backups` bucket; WAL archiving for PITR |
| **Redis** | RDB snapshots (daily) + AOF → MinIO |
| **MinIO** | Versioning + replication (if multi-node); lifecycle policies |
| **Config/Code** | Git (GitHub) — already backed up |
| **Recovery Test** | Weekly automated restore to staging, verify data integrity |

**RPO/RTO Targets (Free Tier):**
- RPO: 24 hours (daily backups)
- RTO: 2-4 hours (manual restore from backup)

---

## Migration Path to Paid Services

| Component | Free (Current) | Paid Upgrade Path |
|----------|----------------|-------------------|
| **Database** | Self-hosted PostgreSQL | Neon, Supabase, Timescale, RDS, Cloud SQL |
| **Redis** | Self-hosted | Upstash, Redis Cloud, ElastiCache, Valkey Cloud |
| **Storage** | MinIO | AWS S3, Cloudflare R2, Cloudflare R2, Azure Blob, GCS |
| **Compute** | Self-hosted VM | Fly.io, Railway, Render, Cloud Run, ECS Fargate, EKS/GKE/AKS |
| **Monitoring** | Self-hosted Prom/Grafana | Grafana Cloud, Datadog, Honeycomb, New Relic |
| **SSL** | Caddy + Let's Encrypt | Cloudflare, AWS ACM, cert-manager |
| **CI/CD** | GitHub Actions | GitHub Actions (larger runners), CircleCI, Buildkite |

**Migration Strategy:**
1. Keep same Docker images & config
2. Swap connection strings / endpoints
3. Update DNS / Caddy config
4. Zero-downtime migration (blue-green)

---

## Operational Runbooks (To Be Created)

| Runbook | Priority |
|---------|----------|
| Deploy to production | P0 |
| Rollback deployment | P0 |
| Restore from backup | P0 |
| Add new tenant | P1 |
| Rotate secrets | P1 |
| Scale Redis/PostgreSQL | P2 |
| Update SSL certificates | P2 (auto via Caddy) |
| Update dependencies | P3 |
| Capacity planning | P3 |

---

## Conclusion

This architecture delivers **enterprise-grade multi-tenant SaaS infrastructure at $0/month** using only open-source, self-hosted components. It provides:

- ✅ Full multi-tenancy with RLS enforcement
- ✅ Real-time WebSocket for scanner/agent sync
- ✅ Background job processing with BullMQ
- ✅ S3-compatible object storage with MinIO
- ✅ Auto HTTPS with Caddy + Let's Encrypt
- ✅ Full observability (Prometheus/Grafana/Loki)
- ✅ CI/CD with GitHub Actions
- ✅ PWA with offline-first audit scanning
- ✅ Zero vendor lock-in — portable to any cloud

**All components are production-ready, battle-tested, and used by companies at scale.** The only cost is your hardware (or free-tier VM) and time to operate.

---

**Next Steps:**
1. Implement ADR 0002 (Multi-tenant PostgreSQL RLS)
2. Scaffold Docker Compose with all services
3. Scaffold backend (Fastify + Prisma + BullMQ)
4. Scaffold frontend (Vite + React + Tailwind + PWA)
5. Implement Auth → Multi-tenant core → Asset CRUD

---

*End of Free-Tier Architecture Specification*