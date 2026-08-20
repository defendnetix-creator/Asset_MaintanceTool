// backend/src/routes/sites.ts
// Site routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const siteListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string(),
  postal_code: z.string().nullable(),
  timezone: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  location_count: z.number(),
  asset_count: z.number(),
  created_at: z.string(),
});

const sitesListResponse = z.object({
  data: z.array(siteListItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
});

const siteDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string(),
  postal_code: z.string().nullable(),
  timezone: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  locations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
  })),
  assets: z.array(z.object({
    id: z.string(),
    asset_tag: z.string(),
    name: z.string().nullable(),
  })),
  created_at: z.string(),
  updated_at: z.string(),
});

const messageResponse = z.object({ message: z.string() });
const errorResponse = z.object({ error: z.string(), code: z.string() });

const listSitesSchema = {
  querystring: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(25),
    search: z.string().optional(),
  }),
  // No response validation - let Fastify pass through
};

const getSiteSchema = {
  params: z.object({ id: z.string().uuid() }),
  // No response validation - let Fastify pass through
};

const createSiteSchema = {
  body: z.object({
    name: z.string().min(1).max(100),
    code: z.string().min(1).max(20).regex(/^[A-Z0-9_]+$/),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional().default('US'),
    postal_code: z.string().optional(),
    timezone: z.string().optional().default('UTC'),
    description: z.string().optional(),
    is_active: z.boolean().default(true),
  }),
  response: { 201: siteDetailSchema, 400: errorResponse },
};

const updateSiteSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    country: z.string().optional(),
    postal_code: z.string().optional().nullable(),
    timezone: z.string().optional(),
    description: z.string().optional().nullable(),
    is_active: z.boolean().optional(),
  }),
  response: { 200: siteDetailSchema, 400: errorResponse, 404: errorResponse },
};

const deleteSiteSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: messageResponse, 404: errorResponse },
};

export async function siteRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List sites
  api.get('/', listSitesSchema, async (request) => {
    const { page = 1, limit = 25, search } = request.query as { page?: string; limit?: string; search?: string };
    const tenantId = request.tenantId!;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 25;

    const where: any = { tenant_id: tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [sites, total] = await Promise.all([
      app.prisma.site.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { locations: true, assets: true } },
        },
      }),
      app.prisma.site.count({ where }),
    ]);

    return {
      data: sites.map(s => ({
        ...s,
        location_count: s._count.locations,
        asset_count: s._count.assets,
        _count: undefined,
      })),
      pagination: { page: pageNum, limit: limitNum, total, total_pages: Math.ceil(total / limitNum) },
    };
  });

  // Create site
  api.post('/', createSiteSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.site.findFirst({
      where: { tenant_id: tenantId, code: request.body.code },
    });
    if (existing) {
      return reply.code(400).send({ error: 'Site code already exists', code: 'CODE_EXISTS' });
    }

    const site = await app.prisma.site.create({
      data: {
        tenant_id: tenantId,
        ...request.body,
      },
    });

    return reply.code(201).send({
      ...site,
      locations: [],
      assets: [],
    });
  });

  // Get site
  api.get('/:id', getSiteSchema, async (request, reply) => {
    const site = await app.prisma.site.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
      include: {
        locations: { select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } },
        assets: { select: { id: true, asset_tag: true, name: true } },
      },
    });

    if (!site) {
      return reply.code(404).send({ error: 'Site not found', code: 'NOT_FOUND' });
    }

    return site;
  });

  // Update site
  api.put('/:id', updateSiteSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.site.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Site not found', code: 'NOT_FOUND' });
    }

    const updated = await app.prisma.site.update({
      where: { id: request.params.id },
      data: request.body,
      include: {
        locations: { select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } },
        assets: { select: { id: true, asset_tag: true, name: true } },
      },
    });

    return updated;
  });

  // Delete site
  api.delete('/:id', deleteSiteSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.site.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Site not found', code: 'NOT_FOUND' });
    }

    // Check for locations
    const locations = await app.prisma.location.count({
      where: { site_id: request.params.id, tenant_id: tenantId },
    });
    if (locations > 0) {
      return reply.code(400).send({ error: 'Cannot delete site with locations', code: 'HAS_LOCATIONS' });
    }

    // Check for assets
    const assets = await app.prisma.asset.count({
      where: { site_id: request.params.id, tenant_id: tenantId },
    });
    if (assets > 0) {
      return reply.code(400).send({ error: 'Cannot delete site with assets', code: 'HAS_ASSETS' });
    }

    await app.prisma.site.delete({
      where: { id: request.params.id },
    });

    return { message: 'Site deleted' };
  });
}