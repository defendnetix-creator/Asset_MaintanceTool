// backend/src/plugins/index.ts
// Plugin registration for Fastify

import { FastifyInstance } from 'fastify';
import { prismaPlugin } from './prisma.js';
import { redisPlugin } from './redis.js';
import { authPlugin } from './auth.js';
import { bullmqPlugin } from './bullmq.js';
import { websocketPlugin } from './websocket.js';
import { metricsPlugin } from './metrics.js';
import { tracingPlugin } from './tracing.js';
import { uploadPlugin } from './upload.js';

export async function registerPlugins(app: FastifyInstance) {
  // Core infrastructure
  await app.register(prismaPlugin);
  await app.register(redisPlugin);

  // Auth & security
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
    errorMessage: 'Too many requests, please try again later.',
  });

  // Auth & security
  await app.register(authPlugin);

  // Background jobs
  await app.register(bullmqPlugin);

  // Real-time
  await app.register(websocketPlugin);

  // File uploads
  await app.register(import('@fastify/multipart'), {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
      files: 10,
    },
  });
  await app.register(uploadPlugin);

  // Observability
  await app.register(metricsPlugin);
  await app.register(tracingPlugin);
}