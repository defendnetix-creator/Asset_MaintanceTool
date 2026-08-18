// backend/src/index.ts
// Main entry point for Asset_MaintanceTool Backend

import Fastify from 'fastify';
import { registerPlugins } from './plugins';
import { registerRoutes } from './routes';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { tenantContext } from './middleware/tenant-context';

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
        removeAdditional: 'all',
        coerceTypes: 'array'
      }
    }
  });

  // Register error handler first
  app.setErrorHandler(errorHandler);

  // Request logging
  await app.register(requestLogger);

  // Tenant context middleware (must be before routes)
  await app.register(tenantContext);

  // Register all plugins (Prisma, Redis, Auth, BullMQ, WebSocket, etc.)
  await registerPlugins(app);

  // Register all routes
  await registerRoutes(app);

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Ready check (checks dependencies)
  app.get('/ready', async (request, reply) => {
    try {
      // Check database
      await request.server.prisma.$queryRaw`SELECT 1`;
      
      // Check Redis
      await request.server.redis.ping();
      
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