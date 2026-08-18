// backend/src/plugins/prisma.ts
// Prisma plugin with RLS middleware

import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tenantMiddleware } from '../middleware/tenant-middleware';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export const prismaPlugin: FastifyPluginAsync = async (app) => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });

  // Apply tenant middleware for RLS
  tenantMiddleware(prisma);

  // Graceful shutdown
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  app.decorate('prisma', prisma);
};

export default prismaPlugin;