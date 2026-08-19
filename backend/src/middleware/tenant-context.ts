// backend/src/middleware/tenant-context.ts
// Tenant context middleware - extracts tenant from request and sets RLS context

import { FastifyPluginAsync, FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    tenantId?: string;
    tenant?: { id: string; status: string; slug: string };
    user?: { id: string; tenantId: string; role: string; email: string };
  }
}

export const tenantContext: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip for health checks
    if (request.url === '/health' || request.url === '/ready' || request.url === '/metrics') {
      return;
    }

    // Extract tenant ID from various sources
    let tenantId: string | undefined;

    // 1. From JWT token (set by auth plugin)
    if (request.user?.tenantId) {
      tenantId = request.user.tenantId;
    }
    // 2. From X-Tenant-ID header (for API keys)
    else if (request.headers['x-tenant-id']) {
      tenantId = request.headers['x-tenant-id'] as string;
    }
    // 3. From subdomain (for multi-tenant hosting)
    else if (request.headers.host) {
      const host = request.headers.host.split(':')[0];
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        // Lookup tenant by subdomain
        const tenant = await app.prisma.tenant.findUnique({
          where: { domain: subdomain },
          select: { id: true },
        });
        if (tenant) tenantId = tenant.id;
      }
    }

    if (!tenantId) {
      // For public routes, continue without tenant
      const publicRoutes = ['/health', '/ready', '/metrics', '/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/forgot-password', '/api/auth/reset-password'];
      if (!request.url.startsWith('/api/auth/') && !['/health', '/ready', '/metrics'].includes(request.url)) {
        return reply.code(401).send({ error: 'Tenant context required', code: 'NO_TENANT' });
      }
      return;
    }

    // Validate tenant exists and is active
    const tenant = await app.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, status: true, slug: true },
    });

    if (!tenant || tenant.status !== 'ACTIVE') {
      return reply.code(403).send({ error: 'Tenant not found or inactive', code: 'TENANT_INACTIVE' });
    }

    // Set tenant context on request
    request.tenantId = tenantId;
    request.tenant = tenant;
  });
};

export default tenantContext;