// backend/src/middleware/tenant-context.ts
// Tenant context middleware - extracts tenant from request and sets on request object

import { FastifyPluginAsync, FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface AuthUser {
  id: string;
  tenantId: string;
  role: string;
  email: string;
}

const publicRoutes = [
  '/health',
  '/ready',
  '/metrics',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
];

function isPublicRoute(url: string): boolean {
  return publicRoutes.some(route => url.startsWith(route));
}

export const tenantContext: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip for public routes
    if (isPublicRoute(request.url)) {
      return;
    }

    // Skip for health checks
    if (request.url === '/health' || request.url === '/ready' || request.url === '/metrics') {
      return;
    }

    // Extract tenant ID from various sources
    let tenantId: string | undefined;

    // 1. From JWT token (set by auth plugin)
    const authUser = request.user as AuthUser | undefined;
    if (authUser?.tenantId) {
      tenantId = authUser.tenantId;
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
      return reply.code(401).send({ error: 'Tenant context required', code: 'NO_TENANT' });
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
    
    // Set global tenant context for Prisma extension
    (globalThis as any).__TENANT_CONTEXT__ = { tenantId };
  });

  // Clear tenant context after request
  app.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply, payload: any) => {
    delete (globalThis as any).__TENANT_CONTEXT__;
    return payload;
  });
};

export default tenantContext;