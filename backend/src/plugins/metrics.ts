// backend/src/plugins/metrics.ts
// Prometheus metrics plugin

import { FastifyPluginAsync } from 'fastify';
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export const metricsPlugin: FastifyPluginAsync = async (app) => {
  const register = new Registry();
  collectDefaultMetrics({ register, prefix: 'assetmt_' });

  // Custom metrics
  const httpRequestsTotal = new Counter({ 
    name: 'http_requests_total', 
    help: 'Total HTTP requests', 
    labelNames: ['method', 'route', 'status', 'tenant'],
    registers: [register] 
  });
  
  const httpRequestDuration = new Histogram({ 
    name: 'http_request_duration_seconds', 
    help: 'HTTP request duration in seconds', 
    labelNames: ['method', 'route'], 
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [register] 
  });
  
  const activeTenants = new Gauge({ 
    name: 'active_tenants', 
    help: 'Number of active tenants', 
    registers: [register] 
  });
  
  const queueDepth = new Gauge({ 
    name: 'queue_depth', 
    help: 'Job queue depth', 
    labelNames: ['queue'], 
    registers: [register] 
  });

  const dbConnections = new Gauge({ 
    name: 'db_connections_active', 
    help: 'Active database connections', 
    registers: [register] 
  });

  const cacheHitRatio = new Gauge({ 
    name: 'cache_hit_ratio', 
    help: 'Redis cache hit ratio', 
    registers: [register] 
  });

  // Metrics endpoint
  app.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });

  // Hook for HTTP metrics
  app.addHook('onRequest', async (request) => {
    request.startTime = process.hrtime.bigint();
  });

  app.addHook('onResponse', async (request, reply) => {
    const duration = Number(process.hrtime.bigint() - request.startTime!) / 1e9;
    httpRequestsTotal.inc({ 
      method: request.method, 
      route: request.routeOptions?.url || 'unknown', 
      status: reply.statusCode.toString(), 
      tenant: request.tenantId || 'none' 
    });
    httpRequestDuration.observe({ 
      method: request.method, 
      route: request.routeOptions?.url || 'unknown' 
    }, duration);
  });

  // Update queue depth gauge periodically
  setInterval(async () => {
    if (app.queues) {
      for (const [name, queue] of Object.entries(app.queues)) {
        const counts = await queue.getJobCounts();
        queueDepth.set({ queue: name }, counts.waiting + counts.active);
      }
    }
  }, 30000);

  // Update DB connections gauge
  setInterval(async () => {
    try {
      const result = await app.prisma.$queryRaw`SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'` as Array<{ count: bigint }>;
      dbConnections.set(Number(result[0]?.count || 0));
    } catch {}
  }, 30000);

  // Update cache hit ratio
  setInterval(async () => {
    try {
      const info = await app.redis.info('stats');
      const hits = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || '0');
      const misses = parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || '0');
      const total = hits + misses;
      if (total > 0) {
        cacheHitRatio.set(hits / total);
      }
    } catch {}
  }, 30000);
};

export default metricsPlugin;