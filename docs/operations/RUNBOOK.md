# Asset Maintenance Tool - Operations Runbook

## Daily Operations

### Morning Checks (9:00 AM)

```bash
# 1. Check all services running
docker compose ps

# 2. Verify health endpoints
curl -s https://your-domain.com/health
curl -s https://api.your-domain.com/health

# 3. Check backup status
ls -lh /backups/assetmt_$(date +"%Y%m%d")*.sql.gz

# 4. Check disk space
df -h /

# 5. Check for errors in logs (last 24h)
docker compose logs --since=24h backend | grep -i error | head -20
```

### Evening Checks (6:00 PM)

```bash
# 1. Verify backup completed
ls -lh /backups/assetmt_$(date +"%Y%m%d")*.sql.gz

# 2. Check disk space trends
df -h / | awk '{print $5}' | sed 's/%//'

# 3. Review any alerts
# Check Grafana/Alertmanager for any firing alerts
```

## Weekly Operations (Monday)

```bash
# 1. Full system health review
./scripts/health-check.sh

# 2. Database maintenance
docker exec assetmt-postgres psql -U assetmt -d assetmt -c "VACUUM ANALYZE;"

# 3. Check for stale sessions
docker exec assetmt-postgres psql -U assetmt -d assetmt -c "
  SELECT count(*) FROM sessions WHERE expires_at < NOW();"

# 4. Review capacity
docker stats --no-stream

# 5. Update documentation if needed
```

## Monthly Operations (1st of Month)

```bash
# 1. Security updates
apt-get update && apt-get upgrade -y

# 2. Rotate secrets
# - JWT_SECRET
# - Database passwords
# - API keys

# 3. Test backup restore
./scripts/restore.sh assetmt_full_$(date -d "last week" +"%Y%m%d")_020000.sql.gz

# 4. Capacity planning
# Review: disk growth, memory trends, CPU trends

# 4. Dependency updates
cd backend && npm audit fix
cd frontend && npm audit fix

# 5. Review and update documentation
```

## Quarterly Operations

```bash
# 1. Disaster recovery drill
# - Simulate complete outage
# - Time recovery
# - Document lessons learned

# 2. Penetration testing
# - External security audit

# 3. Capacity review
# - Project 6-month growth
# - Plan infrastructure scaling

# 4. Business continuity test
# - Failover to backup region (if applicable)

# 5. Compliance review
# - GDPR, SOC2, etc.
```

## Incident Response Procedures

### Severity Levels

| Severity | Response Time | Escalation |
|----------|---------------|------------|
| SEV-1 (Critical) | 15 minutes | Page on-call immediately |
| SEV-2 (Major) | 1 hour | Notify team lead |
| SEV-3 (Minor) | 4 hours | Next business day |
| SEV-4 (Low) | Next sprint | Backlog |

### SEV-1 Response (Service Down)

```bash
# 1. Acknowledge alert immediately
# 2. Check service status
docker compose ps

# 2a. If backend down
docker compose logs backend --tail=100
docker compose restart backend

# 2b. If database down
docker compose logs postgres --tail=100
docker compose restart postgres

# 2c. If frontend down
docker compose logs frontend --tail=100
docker compose restart frontend

# 3. Verify recovery
curl -s https://your-domain.com/health
curl -s https://api.your-domain.com/health

# 4. Post-incident: create incident report
```

### Database Issues

```bash
# High connection count
docker exec assetmt-postgres psql -U assetmt -d assetmt -c "
  SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Long running queries
docker exec assetmt-postgres psql -U assetmt -d assetmt -c "
  SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
  FROM pg_stat_activity 
  WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
  AND state = 'active';"

# Kill long running query
docker exec assetmt-postgres psql -U assetmt -d assetmt -c "
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
  WHERE pid = <PID>;"

# Lock contention
docker exec assetmt-postgres psql -U assetmt -d assetmt -c "
  SELECT * FROM pg_locks WHERE NOT granted;"
```

### High Memory/CPU

```bash
# Check container stats
docker stats --no-stream

# Backend memory leak?
docker compose restart backend

# Database memory
docker exec assetmt-postgres psql -U assetmt -d assetmt -c "
  SELECT * FROM pg_stat_database WHERE datname = 'assetmt';"

# Redis memory
docker exec assetmt-redis redis-cli INFO memory
```

## Backup & Recovery Procedures

### Verify Backup Integrity

```bash
# Test backup file
zcat /backups/assetmt_full_20240115_020000.sql.gz | head -20

# Check backup size
ls -lh /backups/assetmt_full_20240115_020000.sql.gz

# Verify checksum
sha256sum /backups/assetmt_full_20240115_020000.sql.gz
```

### Emergency Restore Procedure

```bash
# 1. STOP - Assess situation
# 2. Identify backup to restore
ls -lh /backups/assetmt_full_*.sql.gz | tail -5

# 3. Execute restore
./scripts/restore.sh assetmt_full_20240115_020000.sql.gz

# 3. Verify restore
curl -s https://api.your-domain.com/api/audits | jq '.data | length'

# 4. Notify stakeholders
```

## Scaling Procedures

### Scale Backend

```bash
# Scale to 3 replicas
docker compose up -d --scale backend=3

# Verify
docker compose ps backend

# Check load balancing
curl -s https://api.your-domain.com/health | jq '.instance'
```

### Database Scaling

```bash
# Add read replica
# 1. Add to docker-compose.yml
# 2. Configure replication
# 3. Update connection pooler (PgBouncer)
```

## Security Operations

### Certificate Renewal

```bash
# Check expiry
openssl x509 -in /etc/nginx/ssl/fullchain.pem -text -noout | grep "Not After"

# Renew (if using certbot)
certbot renew --nginx

# Verify
curl -sI https://your-domain.com | grep -i "strict-transport-security"
```

### Secret Rotation

```bash
# 1. Generate new secrets
openssl rand -base64 64  # JWT_SECRET
openssl rand -base64 32  # DB password

# 2. Update .env
vim .env

# 3. Restart services
docker compose up -d --force-recreate

# 4. Verify
curl -s https://api.your-domain.com/health
```

## Communication Templates

### Incident Notification (SEV-1)

```
Subject: [SEV-1] AssetMT - Service Degradation/Outage

Incident: #INC-XXXX
Status: INVESTIGATING
Impact: [Description of user impact]
Started: YYYY-MM-DD HH:MM UTC
Commander: @oncall-engineer

Updates:
- HH:MM - Initial detection
- HH:MM - Root cause identified: [cause]
- HH:MM - Mitigation applied: [action]
- HH:MM - Service restored

Next update: HH:MM
```

### Post-Incident Report Template

```
# Incident Report: #INC-XXXX

## Summary
- **Date**: YYYY-MM-DD
- **Duration**: HH:MM - HH:MM (X hours)
- **Severity**: SEV-X
- **Impact**: [Users affected, features unavailable]

## Timeline
- HH:MM - Detection
- HH:MM - Response started
- HH:MM - Root cause identified
- HH:MM - Mitigation deployed
- HH:MM - Service restored

## Root Cause
[Technical explanation]

## Resolution
[What fixed it]

## Action Items
- [ ] Action 1 (Owner, Due date)
- [ ] Action 2 (Owner, Due date)

## Lessons Learned
[What we learned]
```