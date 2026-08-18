// backend/src/plugins/index.ts
// Plugin registration for Fastify

import { FastifyInstance } from 'fastify';
import { prismaPlugin } from './prisma';
import { redisPlugin } from './redis';
import { authPlugin } from './auth';
import { bullmqPlugin } from './bullmq';
import { websocketPlugin } from './websocket';
import { metricsPlugin } from './metrics';
import { tracingPlugin } from './tracing';
import { uploadPlugin } from './upload';

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
    keyGenerator: (req) => req.tenantId || req.ip,
    errorMessage: 'Too many requests, please try again later.',
  });
  
  // Auth & security
  await app.register(require('./auth').authPlugin);
  
  // Background jobs
  await app.register(require('./bullmq').bullmqPlugin);
  
  // Real-time
  await app.register(require('./websocket').websocketPlugin);
  
  // File uploads
  await app.register(require('./upload').uploadPlugin);
  
  // Observability
  await app.register(require('./metrics').metricsPlugin);
  await app.register(require('./tracing').tracingPlugin);
}