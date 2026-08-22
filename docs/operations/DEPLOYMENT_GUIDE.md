# Asset Maintenance Tool - Production Deployment Guide

## Overview

This guide covers deploying the Asset Maintenance Tool to a production environment using Docker containers with PostgreSQL, Redis, and MinIO.

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Nginx     │────▶│   Backend   │────▶│  PostgreSQL │
│  (Frontend) │     │   (API)     │     │  (Primary)  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌──────────┐  ┌──────────┐
              │  Redis   │  │  MinIO   │
              │ (Cache)  │  │ (Storage)│
              └──────────┘  └──────────┘
```

## Prerequisites

- Docker 24+ and Docker Compose 2+
- 4GB+ RAM, 2+ CPU cores
- 50GB+ disk space
- Domain name with SSL certificate
- SMTP server for emails
- AWS S3 bucket for backups (optional)

## Quick Start

### 1. Clone and Configure

```bash
git clone https://github.com/your-org/Asset_MaintanceTool.git
cd Asset_MaintanceTool

# Copy environment template
cp .env.example .env

# Edit with your values
vim .env
```

### 2. Required Environment Variables

Edit `.env` with these **required** values:

```bash
# Database
POSTGRES_PASSWORD=your_secure_password_here

# JWT (generate with: openssl rand -base64 64)
JWT_SECRET=your_64_char_base64_secret

# Storage
MINIO_ROOT_PASSWORD=your_secure_minio_password

# Email
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password

# Domain
FRONTEND_URL=https://your-domain.com
COOKIE_DOMAIN=your-domain.com
```

### 3. Deploy

```bash
# Start all services
docker compose up -d

# Run migrations
docker compose run --rm backend npx prisma migrate deploy

# Seed database (optional)
docker compose run --rm backend npm run db:seed
```

### 4. Verify Deployment

```bash
# Check service health
docker compose ps

# View logs
docker compose logs -f

# Test endpoints
curl http://localhost/health
curl http://localhost:3001/health
```

## Service Details

| Service | Port | Health Check |
|---------|------|--------------|
| Frontend (Nginx) | 80/443 | `/` |
| Backend API | 3001 | `/health` |
| PostgreSQL | 5432 | `pg_isready` |
| Redis | 6379 | `redis-cli ping` |
| MinIO | 9000/9001 | `/minio/health/live` |

## Production Checklist

### Security
- [ ] Strong passwords for all services
- [ ] JWT secret is 64+ chars, randomly generated
- [ ] SSL/TLS certificates configured
- [ ] Firewall rules: only 80/443 public, others internal
- [ ] Rate limiting enabled
- [ ] Helmet/CSP headers configured
- [ ] Database user has minimal privileges
- [ ] Regular security updates scheduled

### Reliability
- [ ] Health checks configured for all services
- [ ] Automatic restart policies set
- [ ] Resource limits (CPU/Memory) configured
- [ ] Database backups scheduled and tested
- [ ] WAL archiving configured for PostgreSQL
- [ ] Monitoring alerts configured

### Performance
- [ ] Connection pooling configured
- [ ] Redis caching enabled
- [ ] Gzip compression enabled
- [ ] Static asset caching (1 year)
- [ ] Database indexes created
- [ ] Connection limits configured

## SSL/TLS Configuration

### Using Let's Encrypt (Recommended)

```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal
systemctl enable certbot.timer
```

### Manual Certificate

Place certificates in `/etc/nginx/ssl/` and update nginx.conf:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    # ... rest of config
}
```

## Database Operations

### Migrations

```bash
# Apply pending migrations
docker compose run --rm backend npx prisma migrate deploy

# Create new migration
docker compose run --rm backend npx prisma migrate dev --name "migration_name"

# Check status
docker compose run --rm backend npx prisma migrate status

# Generate client after schema changes
docker compose run --rm backend npx prisma generate
```

### Backup

```bash
# Full backup
./scripts/backup.sh full

# Incremental (WAL-based)
./scripts/backup.sh incremental

# Schedule with cron
# 0 2 * * * /path/to/scripts/backup.sh full
```

### Restore

```bash
# List available backups
ls -lh /backups/assetmt_*.sql.gz

# Restore from backup
./scripts/restore.sh assetmt_full_20240115_020000.sql.gz
```

### Seed Database

```bash
# Seed with sample data
docker compose run --rm backend npm run db:seed
```

## Monitoring & Alerting

### Access Dashboards

| Tool | URL | Credentials |
|------|-----|-------------|
| Grafana | http://your-domain.com:3000 | admin / ${GRAFANA_ADMIN_PASSWORD} |
| Prometheus | http://your-domain.com:9090 | - |
| Alertmanager | http://your-domain.com:9093 | - |
| Grafana Loki | http://your-domain.com:3100 | - |

### Key Metrics to Monitor

| Metric | Warning | Critical |
|--------|---------|----------|
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 80% | > 95% |
| Disk Usage | > 70% | > 90% |
| DB Connections | > 80% | > 95% |
| Response Time | > 500ms | > 2s |
| Error Rate | > 1% | > 5% |
| Backup Age | > 26h | > 48h |

### Key Alerts

- Service down (immediate)
- Database connection pool exhausted
- Backup failed
- SSL certificate expiring (< 30 days)
- Disk space critical
- High error rate

## Log Management

### Access Logs

```bash
# Application logs
docker compose logs -f backend

# Nginx access logs
docker exec assetmt-frontend tail -f /var/log/nginx/access.log

# Database logs
docker exec assetmt-postgres tail -f /var/log/postgresql/postgresql.log
```

### Centralized Logging (Loki)

Access logs via Grafana Explore:
1. Open Grafana → Explore
2. Select Loki datasource
3. Query: `{container_name="assetmt-backend"}`

## Scaling

### Horizontal Scaling (Backend)

```yaml
# docker-compose.override.yml
services:
  backend:
    deploy:
      replicas: 3
    environment:
      - REDIS_URL=redis://redis:6379
```

### Database Read Replicas

```yaml
# Add to docker-compose.yml
postgres-replica:
  image: postgres:16-alpine
  environment:
    POSTGRES_MASTER_SERVICE: postgres
    POSTGRES_REPLICATION_MODE: replica
```

## Disaster Recovery

### RTO/RPO Targets

| Metric | Target |
|--------|--------|
| RTO (Recovery Time Objective) | < 1 hour |
| RPO (Recovery Point Objective) | < 1 hour (WAL) / 24 hours (full) |

### Recovery Procedures

1. **Service Failure**: `docker compose restart <service>`
2. **Database Corruption**: Restore from latest backup
3. **Complete Outage**: Provision new infrastructure, restore from backup
4. **Data Center Loss**: Failover to backup region (if configured)

## Maintenance Windows

### Weekly
- [ ] Review logs for errors
- [ ] Check backup completion
- [ ] Verify monitoring alerts
- [ ] Review disk space

### Monthly
- [ ] Apply security patches
- [ ] Rotate secrets/keys
- [ ] Test backup restore
- [ ] Review capacity planning
- [ ] Update dependencies

### Quarterly
- [ ] Disaster recovery drill
- [ ] Penetration testing
- [ ] Capacity review
- [ ] Update documentation

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Backend won't start | Check DATABASE_URL, run migrations |
| Frontend 502 | Check backend health, nginx proxy config |
| DB connection refused | Check postgres health, credentials |
| High memory | Check for leaks, restart service |
| Slow queries | Check indexes, analyze query plans |

### Debug Commands

```bash
# Enter container
docker exec -it assetmt-backend sh

# Check database
docker exec -it assetmt-postgres psql -U assetmt -d assetmt

# Redis CLI
docker exec -it assetmt-redis redis-cli

# Network debugging
docker network inspect assetmt-network
```

## Support Contacts

| Role | Contact |
|------|---------|
| DevOps Lead | devops@your-company.com |
| Database Admin | dba@your-company.com |
| Security Team | security@your-company.com |
| On-Call | +1-XXX-XXX-XXXX |

---

*Last Updated: $(date)*
*Version: 1.0.0*