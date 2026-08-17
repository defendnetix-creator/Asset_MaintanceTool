# ADR 0001: Free-Tier Architecture Overview

**Status:** Accepted  
**Date:** 2024-08-17  
**Author:** Founding Product Architect  
**Decision:** Build entire stack on zero-cost, self-hosted, open-source components

---

## Context

The Asset Maintenance Tool must be built with **zero monthly cost** until revenue justifies paid services. Every component must be:
- Open-source (MIT/Apache/BSD licensed)
- Self-hostable on commodity hardware
- Free of vendor lock-in
- Production-ready and scalable

## Decision

We adopt a **fully self-hosted, zero-cost architecture**:

| Layer | Technology | License | Cost |
|-------|------------|---------|------|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS | MIT | $0 |
| **Backend** | Node.js 20 LTS + Fastify + TypeScript | MIT | $0 |
| **Database** | PostgreSQL 15+ (self-hosted) | PostgreSQL License | $0 |
| **Cache/Queue** | Redis 7+ (self-hosted) | BSD-3-Clause | $0 |
| **Object Storage** | MinIO (S3-compatible) | AGPL-3.0 | $0 |
| **Auth** | JWT (jose) + Argon2id | MIT/Apache-2.0 | $0 |
| **Background Jobs** | BullMQ (Redis) | MIT | $0 |
| **Reverse Proxy/SSL** | Caddy (auto Let's Encrypt) | Apache-2.0 | $0 |
| **CI/CD** | GitHub Actions | Free for private repos | $0 |
| **Monitoring** | Prometheus + Grafana + Loki | Apache-2.0 | $0 |
| **Containerization** | Docker + Docker Compose | Apache-2.0 | $0 |
| **Hosting** | Self-hosted (own hardware / Oracle Cloud Always Free / free VPS) | N/A | $0 |

## Consequences

### Positive
- **$0/month** operational cost indefinitely
- **Zero vendor lock-in** — own every layer
- **Full data sovereignty** — data never leaves your infrastructure
- **Scales to paid** — same stack runs on managed services later
- **No surprise bills** — predictable zero cost

### Negative
- **Operational burden** — you manage updates, backups, security patches
- **No managed SLAs** — uptime depends on your infrastructure
- **Time investment** — initial setup requires DevOps knowledge
- **Scaling effort** — manual scaling vs. auto-scaling managed services

## Mitigation

- **Automation first**: GitHub Actions CI/CD, automated backups, health checks
- **Documentation**: Runbooks for every operational task
- **Migration path**: Same stack deploys to managed services (Neon, Upstash, R2, Fly.io) when budget allows
- **Monitoring**: Full observability stack (Prometheus/Grafana/Loki) from day one

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Supabase Free Tier | 500MB DB limit, 2GB bandwidth, row limits — too restrictive for asset management |
| Firebase Free Tier | NoSQL only, 1GB storage, 50k reads/day — unsuitable for relational asset data |
| PlanetScale Free | 1 database, 5GB storage — but no foreign keys, no RLS equivalent |
| Railway Free Trial | $5 credit only, then paid — not sustainable |
| Fly.io Free Allowance | Limited hours, requires credit card — not truly free |
| Oracle Cloud Always Free | Viable for hosting, but ARM instances, limited regions |

## Implementation Order

1. **ADR 0002**: Multi-tenant PostgreSQL RLS schema
2. **ADR 0003**: Frontend stack (React + Vite + Tailwind + PWA)
3. **ADR 0004**: Backend stack (Fastify + Prisma + BullMQ)
4. **ADR 0005**: Infrastructure (Docker Compose, Caddy, Monitoring)
5. **Implementation**: Scaffold repo → Auth → Multi-tenant core → Asset CRUD → Lifecycle → Audit → Reports

## References

- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Prisma Multi-Tenant Middleware](https://www.prisma.io/docs/orm/prisma-client/client-extensions/middleware)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Caddy Automatic HTTPS](https://caddyserver.com/docs/automatic-https)
- [GitHub Actions Free Tier](https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration)

---

**Next:** ADR 0002 — Multi-tenant PostgreSQL RLS Schema