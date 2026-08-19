// backend/src/middleware/request-logger.ts
// Request logging middleware

import { FastifyPluginAsync } from 'fastify';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    startTime?: bigint;
    tenantId?: string;
    user?: { id: string };
  }
}

export const requestLogger: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('onRequest', async (request: FastifyRequest) => {
    request.startTime = process.hrtime.bigint();
    app.log.info({
      req: {
        method: request.method,
        url: request.url,
        headers: {
          'user-agent': request.headers['user-agent'],
          'x-forwarded-for': request.headers['x-forwarded-for'],
          'x-real-ip': request.headers['x-real-ip'],
        },
        tenantId: request.tenantId,
        userId: request.user?.id,
      },
    }, 'Incoming request');
  });

  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const duration = Number(process.hrtime.bigint() - (request.startTime || process.hrtime.bigint())) / 1e6;
    app.log.info({
      res: {
        statusCode: reply.statusCode,
        responseTime: `${duration.toFixed(2)}ms`,
      },
      req: {
        method: request.method,
        url: request.url,
        tenantId: request.tenantId,
        userId: request.user?.id,
      },
    }, 'Request completed');
  });
};

export default requestLogger;