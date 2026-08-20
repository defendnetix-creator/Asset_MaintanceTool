// backend/src/index.ts
// Main entry point for Asset_MaintanceTool Backend - register routes with app.register() for prefixes

import Fastify from 'fastify';
import fs from 'fs';
import path from 'path';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { PrismaClient } from '@prisma/client';
import { tenantMiddleware } from './middleware/tenant-middleware.js';
import { redisPlugin } from './plugins/redis.js';
import { authPlugin } from './plugins/auth.js';
import { bullmqPlugin } from './plugins/bullmq.js';
import { metricsPlugin } from './plugins/metrics.js';
import { tracingPlugin } from './plugins/tracing.js';
import { uploadPlugin } from './plugins/upload.js';
import { authRoutes } from './routes/auth.js';
import { assetRoutes } from './routes/assets.js';
import { auditRoutes } from './routes/audits.js';
import { maintenanceRoutes } from './routes/maintenance.js';
import { reportRoutes } from './routes/reports.js';
import { userRoutes } from './routes/users.js';
import { adminRoutes } from './routes/admin.js';
import { webhookRoutes } from './routes/webhooks.js';
import { documentRoutes } from './routes/documents.js';
import { agentRoutes } from './routes/agents.js';
import { siteRoutes } from './routes/sites.js';
import { categoryRoutes } from './routes/categories.js';
import { departmentRoutes } from './routes/departments.js';
import { contractRoutes } from './routes/contracts.js';
import { notificationRoutes } from './routes/notifications.js';
import { settingsRoutes } from './routes/settings.js';

async function main() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      } : undefined
    },
    ajv: {
      customOptions: {
        removeAdditional: false,
        coerceTypes: 'array'
      }
    }
  });

  // Register error handler first
  app.setErrorHandler(errorHandler);

  // Request logging
  await app.register(requestLogger);

  // Create Prisma client directly
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });

  // Apply tenant middleware for RLS
  tenantMiddleware(prisma);

  // Attach Prisma directly to app instance
  app.decorate('prisma', prisma);

  // Graceful shutdown
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  // Register Redis plugin - call directly (not app.register) so redis decoration is on main app instance
  await redisPlugin(app);

  // Register JWT plugins directly on main app (before authPlugin)
  const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || fs.readFileSync(path.resolve('keys/private.pem'), 'utf-8');
  const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || fs.readFileSync(path.resolve('keys/public.pem'), 'utf-8');
  const REFRESH_PRIVATE_KEY = process.env.JWT_REFRESH_PRIVATE_KEY || fs.readFileSync(path.resolve('keys/refresh-private.pem'), 'utf-8');
  const REFRESH_PUBLIC_KEY = process.env.JWT_REFRESH_PUBLIC_KEY || fs.readFileSync(path.resolve('keys/refresh-public.pem'), 'utf-8');
  const COOKIE_SECRET = process.env.COOKIE_SECRET || 'change-me-in-production';

  await app.register(import('@fastify/jwt'), {
    secret: { private: PRIVATE_KEY, public: PUBLIC_KEY },
    sign: { algorithm: 'RS256', expiresIn: '15m' },
    verify: { algorithms: ['RS256'] },
    cookie: { cookieName: 'accessToken', signed: false },
  });

  await app.register(import('@fastify/jwt'), {
    secret: { private: REFRESH_PRIVATE_KEY, public: REFRESH_PUBLIC_KEY },
    sign: { algorithm: 'RS256', expiresIn: '7d' },
    verify: { algorithms: ['RS256'] },
    cookie: { cookieName: 'refreshToken', signed: false },
    namespace: 'refresh',
  });

  // Auth plugin - call directly (not app.register) so it uses already-registered JWT
  await authPlugin(app);

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
    max: 1000,
    timeWindow: '1 minute',
    keyGenerator: (req: any) => req.tenantId || req.ip,
    errorMessage: 'Too Many Requests',
  });

  // Background jobs
  await app.register(bullmqPlugin);

  // File uploads
  await app.register(uploadPlugin);

  // Observability
  await app.register(metricsPlugin);
  await app.register(tracingPlugin);

  // Register all routes with app.register() for proper prefix handling
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(assetRoutes, { prefix: '/api/assets' });
  await app.register(auditRoutes, { prefix: '/api/audits' });
  await app.register(maintenanceRoutes, { prefix: '/api/maintenance' });
  await app.register(reportRoutes, { prefix: '/api/reports' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(webhookRoutes, { prefix: '/api/webhooks' });
  await app.register(documentRoutes, { prefix: '/api/documents' });
  await app.register(agentRoutes, { prefix: '/api/agents' });
  await app.register(siteRoutes, { prefix: '/api/sites' });
  await app.register(categoryRoutes, { prefix: '/api/categories' });
  await app.register(departmentRoutes, { prefix: '/api/departments' });
  await app.register(contractRoutes, { prefix: '/api/contracts' });
  await app.register(notificationRoutes, { prefix: '/api/notifications' });
  await app.register(settingsRoutes, { prefix: '/api/settings' });

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Ready check (checks dependencies)
  app.get('/ready', async (request, reply) => {
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      await app.redis.ping();
      return { status: 'ready', timestamp: new Date().toISOString() };
    } catch (error) {
      reply.code(503);
      return { status: 'not ready', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Start server
  const port = parseInt(process.env.PORT || '3001', 10);
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    console.log(`🚀 Server running at http://${host}:${port}`);
    console.log(`📚 API docs at http://${host}:${port}/docs`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

main().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});