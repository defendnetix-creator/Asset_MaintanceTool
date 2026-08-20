// backend/src/plugins/index.ts
// Plugin registration for Fastify - all plugins registered on main app for shared decorations

import { FastifyInstance } from 'fastify';
import { prismaPlugin } from './prisma.js';
import { redisPlugin } from './redis.js';
import { authPlugin } from './auth.js';
import { bullmqPlugin } from './bullmq.js';
import { metricsPlugin } from './metrics.js';
import { tracingPlugin } from './tracing.js';
import { uploadPlugin } from './upload.js';

export { prismaPlugin, redisPlugin, authPlugin, bullmqPlugin, metricsPlugin, tracingPlugin, uploadPlugin };

export async function registerPlugins(app: FastifyInstance) {
  // Register all plugins sequentially on main app (shared encapsulation scope)
  // This allows all plugins and routes to access each other's decorations
  
  // Core infrastructure
  await app.register(prismaPlugin);
  await app.register(redisPlugin);

  // Auth & security (can access prisma/redis)
  await app.register(authPlugin);

  // Security plugins
  await app.register(import('@fastify/helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'wss:', 'https:'],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  });

  await app.register(import('@fastify/cors'), {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-ID'],
  });

  await app.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req: any) => req.tenantId || req.ip,
  });

  // Background jobs
  await app.register(bullmqPlugin);

  // Real-time (disabled for Phase 1 - will be enabled in Phase 4)
  // await app.register(websocketPlugin);

  // File uploads
  // Note: uploadPlugin registers @fastify/multipart internally
  await app.register(uploadPlugin);

  // Observability
  await app.register(metricsPlugin);
  await app.register(tracingPlugin);
}