# ADR 0005: Free Infrastructure

**Status:** Accepted  
**Date:** 2024-08-17  
**Author:** Founding Product Architect  
**Decision:** Docker Compose + Caddy + Prometheus/Grafana/Loki + GitHub Actions — all self-hosted, zero cost

---

## Context

The entire Asset Maintenance Tool stack must run with **zero monthly cost** using only open-source, self-hosted components. Infrastructure must provide: container orchestration, reverse proxy with auto-HTTPS, monitoring, logging, alerting, CI/CD, and backup strategy — all free.

## Decision

We adopt a **fully self-hosted infrastructure stack** using Docker Compose for orchestration:

| Component | Technology | Version | License | Purpose |
|-----------|------------|---------|---------|---------|
| Container Orchestration | Docker Compose | 2.24+ | Apache-2.0 | Local dev & single-host prod |
| Reverse Proxy/SSL | Caddy | 2.7+ | Apache-2.0 | Auto HTTPS via Let's Encrypt |
| Monitoring (Metrics) | Prometheus | 2.47+ | Apache-2.0 | Metrics collection |
| Monitoring (Dashboards) | Grafana | 10.2+ | AGPL-3.0 | Visualization & alerting |
| Monitoring (Logs) | Loki | 2.9+ | AGPL-3.0 | Log aggregation |
| Monitoring (Agent) | Promtail | 2.9+ | AGPL-3.0 | Log shipping |
| Alerting | Alertmanager | 0.26+ | Apache-2.0 | Alert routing |
| CI/CD | GitHub Actions | N/A | Free for private repos | CI/CD pipeline |
| Backup | pg_dump + MinIO | N/A | PostgreSQL/AGPL | Automated backups |

---

## Docker Compose (Full Stack)

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ─────────────────────────────────────────────────────────────
  # DATABASE
  # ─────────────────────────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    container_name: assetmt-postgres
    environment:
      POSTGRES_DB: assetmt
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-rls.sql:/docker-entrypoint-initdb.d/init-rls.sql
      - ./pgbouncer.ini:/etc/pgbouncer/pgbouncer.ini:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d assetmt"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 512M

  pgbouncer:
    image: edoburu/pgbouncer:latest
    container_name: assetmt-pgbouncer
    environment:
      DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/assetmt
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 100
      DEFAULT_POOL_SIZE: 25
      MIN_POOL_SIZE: 5
      RESERVE_POOL_SIZE: 5
      RESERVE_POOL_TIMEOUT: 5
      IGNORE_STARTUP_PARAMETERS: app.current_tenant
    volumes:
      - ./pgbouncer.ini:/etc/pgbouncer/pgbouncer.ini:ro
    ports:
      - "6432:6432"
    depends_on:
      postgres:
        condition: service_healthy

  # ─────────────────────────────────────────────────────────────
  # CACHE & QUEUE
  # ─────────────────────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: assetmt-redis
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 128M

  # ─────────────────────────────────────────────────────────────
  # OBJECT STORAGE
  # ─────────────────────────────────────────────────────────────
  minio:
    image: minio/minio:latest
    container_name: assetmt-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 256M

  # ─────────────────────────────────────────────────────────────
  # BACKEND
  # ─────────────────────────────────────────────────────────────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: assetmt-backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@pgbouncer:6432/assetmt?pgbouncer=true
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ""
      MINIO_ENDPOINT: minio:9000
      MINIO_ACCESS_KEY: ${MINIO_ROOT_USER}
      MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
      MINIO_BUCKET: assets
      JWT_PRIVATE_KEY: ${JWT_PRIVATE_KEY}
      JWT_PUBLIC_KEY: ${JWT_PUBLIC_KEY}
      JWT_REFRESH_PRIVATE_KEY: ${JWT_REFRESH_PRIVATE_KEY}
      JWT_REFRESH_PUBLIC_KEY: ${JWT_REFRESH_PUBLIC_KEY}
      COOKIE_SECRET: ${COOKIE_SECRET}
      JWT_SECRET: ${JWT_SECRET}
      CLAMAV_HOST: clamav
      CLAMAV_PORT: 3310
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      EMAIL_FROM: ${EMAIL_FROM}
      FRONTEND_URL: https://${DOMAIN}
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      pgbouncer:
        condition: service_started
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 256M

  # ─────────────────────────────────────────────────────────────
  # FRONTEND
  # ─────────────────────────────────────────────────────────────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: assetmt-frontend
    environment:
      VITE_API_URL: https://${DOMAIN}/api
      VITE_WS_URL: wss://${DOMAIN}/ws
    ports:
      - "3000:3000"
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ─────────────────────────────────────────────────────────────
  # REVERSE PROXY & SSL
  # ─────────────────────────────────────────────────────────────
  caddy:
    image: caddy:2-alpine
    container_name: assetmt-caddy
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    environment:
      DOMAIN: ${DOMAIN}
      EMAIL: ${ACME_EMAIL}
    depends_on:
      - frontend
      - backend
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:2019/metrics"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ─────────────────────────────────────────────────────────────
  # MONITORING
  # ─────────────────────────────────────────────────────────────
  prometheus:
    image: prom/prometheus:v2.47.0
    container_name: assetmt-prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3

  grafana:
    image: grafana/grafana:10.2.0
    container_name: assetmt-grafana
    environment:
      GF_SECURITY_ADMIN_USER: ${GRAFANA_ADMIN_USER}
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}
      GF_INSTALL_PLUGINS: grafana-piechart-panel
      GF_SERVER_ROOT_URL: https://${DOMAIN}/grafana
      GF_SERVER_SERVE_FROM_SUB_PATH: "true"
    volumes:
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./grafana/datasources:/etc/grafana/provisioning/datasources:ro
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  loki:
    image: grafana/loki:2.9.0
    container_name: assetmt-loki
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - ./loki-config.yaml:/etc/loki/local-config.yaml:ro
      - loki_data:/loki
    ports:
      - "3100:3100"
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3100/ready"]
      interval: 30s
      timeout: 10s
      retries: 3

  promtail:
    image: grafana/promtail:2.9.0
    container_name: assetmt-promtail
    volumes:
      - ./promtail-config.yaml:/etc/promtail/config.yml:ro
      - /var/log:/var/log:ro
      - ./backend/logs:/app/logs:ro
    depends_on:
      - loki

  alertmanager:
    image: prom/alertmanager:v0.26.0
    container_name: assetmt-alertmanager
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - alertmanager_data:/alertmanager
    ports:
      - "9093:9093"
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:9093/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ─────────────────────────────────────────────────────────────
  # CLAMAV (Malware Scanning)
  # ─────────────────────────────────────────────────────────────
  clamav:
    image: mk0x/docker-clamav:latest
    container_name: assetmt-clamav
    environment:
      CLAMD_STARTUP_TIMEOUT: 180
    volumes:
      - clamav_db:/var/lib/clamav
    ports:
      - "3310:3310"
    healthcheck:
      test: ["CMD", "clamdscan", "--fdpass", "/dev/null"]
      interval: 60s
      timeout: 30s
      retries: 3

  # ─────────────────────────────────────────────────────────────
  # BACKUP SERVICE
  # ─────────────────────────────────────────────────────────────
  backup:
    image: postgres:16-alpine
    container_name: assetmt-backup
    environment:
      POSTGRES_HOST: postgres
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: assetmt
      MINIO_ENDPOINT: minio:9000
      MINIO_ACCESS_KEY: ${MINIO_ROOT_USER}
      MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
      MINIO_BUCKET: backups
      BACKUP_SCHEDULE: "0 2 * * *"  # Daily at 2 AM UTC
      BACKUP_RETENTION_DAYS: 30
    volumes:
      - ./backup.sh:/backup.sh:ro
    depends_on:
      - postgres
      - minio
    entrypoint: ["/bin/sh", "-c", "chmod +x /backup.sh && /backup.sh"]

volumes:
  postgres_data:
  redis_data:
  minio_data:
  prometheus_data:
  grafana_data:
  loki_data:
  alertmanager_data:
  clamav_db:
  caddy_data:
  caddy_config:

networks:
  default:
    name: assetmt-network
    driver: bridge
```

---

## Caddyfile (Auto HTTPS)

```caddyfile
# Caddyfile
{
    email {$EMAIL}
    acme_ca https://acme-v02.api.letsencrypt.org/directory
    admin off
}

{$DOMAIN} {
    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
        Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
    }
    
    # Rate limiting
    rate_limit {
        zone api 10r/s
        key {remote_host}
    }
    
    # Frontend
    handle_path /assets/* {
        reverse_proxy frontend:3000
    }
    
    handle_path /api/* {
        reverse_proxy backend:3001 {
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
            header_up X-Real-IP {remote_host}
        }
    }
    
    handle_path /ws/* {
        reverse_proxy backend:3001 {
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }
    
    handle_path /grafana/* {
        reverse_proxy grafana:3000 {
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }
    
    handle_path /api/* {
        reverse_proxy backend:3001
    }
    
    # Default to frontend
    handle {
        reverse_proxy frontend:3000
    }
    
    # Compression
    encode zstd gzip
    
    # Logging
    log {
        output file /var/log/caddy/access.log {
            roll_size 100mb
            roll_keep 7
            roll_local_time
        }
        format json
    }
}

# API subdomain (optional)
api.{$DOMAIN} {
    reverse_proxy backend:3001
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
    }
    rate_limit {
        zone api 20r/s
        key {remote_host}
    }
}
```

---

## Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'assetmt-prod'
    environment: 'production'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - '/etc/prometheus/rules/*.yml'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'caddy'
    static_configs:
      - targets: ['caddy:2019']

  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'minio'
    static_configs:
      - targets: ['minio:9000']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
```

---

## Grafana Datasources Provisioning

```yaml
# grafana/datasources/datasources.yml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    access: proxy
    isDefault: true
    editable: false
    jsonData:
      timeInterval: "15s"
      queryTimeout: "60s"
      httpMethod: "POST"

  - name: Loki
    type: loki
    url: http://loki:3100
    access: proxy
    editable: false
    jsonData:
      maxLines: 1000
      derivedFields:
        - name: "traceID"
          matcherRegex: "traceID=(\\w+)"
          url: "http://jaeger:16686/trace/$${__value.raw}"
          datasourceUid: "jaeger"
```

---

## Alertmanager Configuration

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m
  smtp_smarthost: '${SMTP_HOST}:${SMTP_PORT}'
  smtp_from: '${EMAIL_FROM}'
  smtp_auth_username: '${SMTP_USER}'
  smtp_auth_password: '${SMTP_PASS}'
  smtp_require_tls: true

route:
  group_by: ['alertname', 'tenant']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'email'
  routes:
    - match:
        severity: critical
      receiver: 'email-critical'
      continue: true
    - match:
        severity: warning
      receiver: 'email-warning'

receivers:
  - name: 'email'
    email_configs:
      - to: '${ALERT_EMAIL}'
        send_resolved: true
        headers:
          subject: '[AssetMT] {{ .GroupLabels.alertname }} - {{ .Status }}'
  
  - name: 'email-critical'
    email_configs:
      - to: '${ALERT_EMAIL_CRITICAL}'
        send_resolved: true
        headers:
          subject: '[CRITICAL] AssetMT {{ .GroupLabels.alertname }}'
  
  - name: 'email-warning'
    email_configs:
      - to: '${ALERT_EMAIL_WARNING}'
        send_resolved: true

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'tenant']
```

---

## Prometheus Alert Rules

```yaml
# prometheus/rules/alerts.yml
groups:
  - name: infrastructure
    interval: 30s
    rules:
      - alert: HostHighCpuLoad
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU load on {{ $labels.instance }}"
          description: "CPU load > 80% for 5 minutes"

      - alert: HostHighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage > 85% for 5 minutes"

      - alert: HostDiskAlmostFull
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk almost full on {{ $labels.instance }}"
          description: "Less than 10% disk space remaining"

      - alert: PostgresConnectionsHigh
        expr: pg_stat_database_numbackends / pg_settings_max_connections * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "PostgreSQL connections > 80%"

      - alert: PostgresReplicationLag
        expr: pg_replication_lag > 30
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL replication lag > 30s"

      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis memory usage > 85%"

      - alert: MinIODiskUsageHigh
        expr: minio_disk_usage_percent > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "MinIO disk usage > 80%"

  - name: application
    interval: 30s
    rules:
      - alert: APIHighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "API error rate > 1%"
          description: "Error rate {{ $value | humanizePercentage }} for 5 minutes"

      - alert: APIHighLatency
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API P95 latency > 2s"
          description: "Route {{ $labels.route }} P95 latency {{ $value }}s"

      - alert: QueueDepthHigh
        expr: queue_depth > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Queue {{ $labels.queue }} depth > 1000"

      - alert: SSLCertExpiringSoon
        expr: ssl_certificate_expiration_days < 30
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "SSL certificate expiring in {{ $value }} days"

  - name: business
    interval: 1m
    rules:
      - alert: BackupFailed
        expr: backup_last_success_timestamp < time() - 86400
        for: 1h
        labels:
          severity: critical
        annotations:
          summary: "Backup failed - last success > 24h ago"

      - alert: TenantStorageQuotaExceeded
        expr: tenant_storage_bytes / tenant_storage_limit_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Tenant {{ $labels.tenant }} storage quota > 90%"
```

---

## Backup Script

```bash
#!/bin/bash
# backup.sh

set -euo pipefail

# Configuration
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_USER="${POSTGRES_USER}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
POSTGRES_DB="${POSTGRES_DB:-assetmt}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-minio:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY}"
MINIO_BUCKET="${MINIO_BUCKET:-backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="assetmt_${DATE}.sql.gz"

echo "Starting backup at $(date)"

# Dump database
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${POSTGRES_HOST}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  --no-owner --no-privileges \
  --format=custom \
  --compress=9 \
  --no-tablespaces \
  | gzip > "/tmp/${BACKUP_FILE}"

# Check backup size
BACKUP_SIZE=$(stat -c%s "/tmp/${BACKUP_FILE}")
echo "Backup size: ${BACKUP_SIZE} bytes"

# Upload to MinIO
mc alias set minio "http://${MINIO_ENDPOINT}" "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}" --api S3v4
mc cp "/tmp/${BACKUP_FILE}" "minio/${MINIO_BUCKET}/${BACKUP_FILE}"

# Verify upload
mc stat "minio/${MINIO_BUCKET}/${BACKUP_FILE}"

# Cleanup local
rm "/tmp/${BACKUP_FILE}"

# Cleanup old backups (older than retention days)
mc ls "minio/${MINIO_BUCKET}" --json | \
  jq -r --arg date "$(date -d "-${BACKUP_RETENTION_DAYS} days" +%Y-%m-%d)" \
  'select(.time < $date) | .key' | \
  while read -r key; do
    mc rm "minio/${MINIO_BUCKET}/${key}"
    echo "Deleted old backup: ${key}"
  done

echo "Backup completed at $(date)"
```

---

## GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    name: Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: assetmt_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: [5432:5432]
        options: >-
          --health-cmd "pg_isready -U test -d assetmt_test"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: [6379:6379]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  build:
    name: Build & Push
    runs-on: ubuntu-latest
    needs: [lint, test]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest,${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    name: Deploy Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging
        run: |
          echo "Deploy to staging server"
          # ssh deploy@staging "docker-compose pull && docker-compose up -d"
      - name: Smoke tests
        run: |
          sleep 30
          curl -f https://staging.assetmt.com/health || exit 1

  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: |
          echo "Deploy to production (manual approval required)"
          # Manual approval step in GitHub UI
          # ssh deploy@prod "docker-compose pull && docker-compose up -d"
      - name: Smoke tests
        run: |
          sleep 30
          curl -f https://app.assetmt.com/health || exit 1
      - name: Notify
        run: |
          curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"Production deployment successful :rocket:"}' \
            $SLACK_WEBHOOK_URL
```

---

## Consequences

### Positive
- **Zero cost** — all components free, self-hosted
- **Full control** — no vendor lock-in, data sovereignty
- **Production-ready** — battle-tested components (PostgreSQL, Redis, MinIO, Caddy, Prometheus, Grafana)
- **Scalable** — same stack runs on managed services later
- **Observable** — full metrics, logs, traces, alerts from day one
- **Secure** — auto-HTTPS, security headers, rate limiting, malware scanning

### Negative
- **Operational overhead** — you manage updates, backups, patches
- **No managed SLA** — uptime depends on your infrastructure
- **Learning curve** — Docker, Caddy, Prometheus, Loki, Grafana
- **Single-host limitation** — Docker Compose doesn't scale horizontally (upgrade to K8s when needed)

---

## Migration Path

| Component | Free (Current) | Paid Upgrade |
|-----------|----------------|--------------|
| Database | Self-hosted PostgreSQL | Neon, Supabase, Timescale, RDS |
| Cache | Self-hosted Redis | Upstash, Redis Cloud, Valkey Cloud |
| Storage | MinIO | AWS S3, Cloudflare R2, GCS |
| Compute | Self-hosted VM | Fly.io, Railway, Render, Cloud Run, ECS Fargate |
| Monitoring | Prometheus/Grafana/Loki | Grafana Cloud, Datadog, Honeycomb |
| SSL/CDN | Caddy + Let's Encrypt | Cloudflare Pro, CloudFront |
| CI/CD | GitHub Actions | GitHub Actions (larger), CircleCI |

---

## References

- [Docker Compose](https://docs.docker.com/compose/)
- [Caddy Documentation](https://caddyserver.com/docs/)
- [Prometheus](https://prometheus.io/docs/)
- [Grafana](https://grafana.com/docs/)
- [Loki](https://grafana.com/docs/loki/)
- [MinIO](https://min.io/docs/minio/linux/index.html)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Oracle Cloud Always Free](https://www.oracle.com/cloud/free/)

---

**Previous:** ADR 0004 — Free Backend Stack  
**Next:** Implementation begins — Scaffold → Auth → Multi-tenant Core → Asset CRUD