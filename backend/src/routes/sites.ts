// backend/src/routes/sites.ts
// Site routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function siteRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List sites
  api.get('/', {
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(25),
        search: z.string().optional(),
      }),
      response: {
        200: z.object({
          data: z.array(z.object({
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
          })),
          pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            total_pages: z.number(),
          }),
        }),
      },
    }, async (request) => {
      const { page, limit, search } = request.query;
      const tenantId = request.tenantId!;

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
          skip: (page - 1) * limit,
          take: limit,
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
        pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
      };
    });

  // Create site
  api.post('/', {
    schema: {
      body: z.object({
        name: z.string().min(1).max(200),
        code: z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/),
        address: z.string().optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(100).optional(),
        country: z.string().length(2).default('US'),
        postal_code: z.string().max(20).optional(),
        timezone: z.string().default('UTC'),
        description: z.string().optional(),
      }),
      response: {
        201: z.object({ id: z.string() }),
        409: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const tenantId = request.tenantId!;

      const existing = await app.prisma.site.findFirst({
        where: { tenant_id: tenantId, code: request.body.code },
      });
      if (existing) {
        return reply.code(409).send({ error: 'Site code already exists', code: 'DUPLICATE_CODE' });
      }

      const site = await app.prisma.site.create({
        data: { ...request.body, tenant_id: tenantId },
      });

      return reply.code(201).send({ id: site.id });
    });

  // Get site with locations
  api.get('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
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
            description: z.string().nullable(),
            asset_count: z.number(),
          })),
          created_at: z.string(),
          updated_at: z.string(),
        }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const site = await app.prisma.site.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
        include: {
          locations: {
            where: { is_active: true },
            select: { id: true, name: true, code: true, description: true, _count: { select: { assets: true } } },
          },
        },
      });

      if (!site) {
        return reply.code(404).send({ error: 'Site not found', code: 'NOT_FOUND' });
      }

      return {
        ...site,
        locations: site.locations.map(l => ({
          ...l,
          asset_count: l._count.assets,
          _count: undefined,
        })),
      };
    });

  // Update site
  api.patch('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        name: z.string().min(1).max(200).optional(),
        address: z.string().optional().nullable(),
        city: z.string().max(100).optional().nullable(),
        state: z.string().max(100).optional().nullable(),
        country: z.string().length(2).optional(),
        postal_code: z.string().max(20).optional().nullable(),
        timezone: z.string().optional(),
        description: z.string().optional().nullable(),
        is_active: z.boolean().optional(),
      }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const site = await app.prisma.site.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!site) {
        return reply.code(404).send({ error: 'Site not found', code: 'NOT_FOUND' });
      }

      await app.prisma.site.update({
        where: { id: request.params.id },
        data: request.body,
      });

      return { message: 'Site updated' };
    });

  // Delete site
  api.delete('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        400: z.object({ error: z.string(), code: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const site = await app.prisma.site.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
        include: { _count: { select: { locations: true, assets: true } } },
      );

      if (!site) {
        return reply.code(404).send({ error: 'Site not found', code: 'NOT_FOUND' });
      }

      if (site._count.locations > 0 || site._count.assets > 0) {
        return reply.code(400).send({ error: 'Cannot delete site with locations or assets', code: 'HAS_DEPENDENCIES' });
      }

      await app.prisma.site.delete({ where: { id: request.params.id } });

      return { message: 'Site deleted' };
    });

  // Location routes
  api.post('/:siteId/locations', {
    schema: {
      params: z.object({ siteId: z.string().uuid() }),
      body: z.object({
        name: z.string().min(1).max(200),
        code: z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/),
        description: z.string().optional(),
        parent_id: z.string().uuid().optional(),
      }),
      response: {
        201: z.object({ id: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
        409: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const site = await app.prisma.site.findFirst({
        where: { id: request.params.siteId, tenant_id: request.tenantId! },
      });

      if (!site) {
        return reply.code(404).send({ error: 'Site not found', code: 'NOT_FOUND' });
      }

      const existing = await app.prisma.location.findFirst({
        where: { site_id: request.params.siteId, code: request.body.code },
      });
      if (existing) {
        return reply.code(409).send({ error: 'Location code already exists in this site', code: 'DUPLICATE_CODE' });
      }

      if (request.body.parent_id) {
        const parent = await app.prisma.location.findFirst({
          where: { id: request.body.parent_id, site_id: request.params.siteId },
        });
        if (!parent) {
          return reply.code(400).send({ error: 'Parent location not found in this site', code: 'INVALID_PARENT' });
        }
      }

      const location = await app.prisma.location.create({
        data: {
          ...request.body,
          site_id: request.params.siteId,
          tenant_id: request.tenantId!,
        },
      });

      return reply.code(201).send({ id: location.id });
    });

  api.get('/:siteId/locations', {
    schema: {
      params: z.object({ siteId: z.string().uuid() }),
      querystring: z.object({
        include_inactive: z.boolean().default(false),
      }),
      response: {
        200: z.array(z.object({
          id: z.string(),
          name: z.string(),
          code: z.string(),
          description: z.string().nullable(),
          parent_id: z.string().nullable(),
          is_active: z.boolean(),
          asset_count: z.number(),
        })),
      },
    }, async (request) => {
      const locations = await app.prisma.location.findMany({
        where: {
          site_id: request.params.siteId,
          tenant_id: request.tenantId!,
          is_active: request.query.include_inactive ? undefined : true,
        },
        include: { _count: { select: { assets: true } } },
        orderBy: { name: 'asc' },
      });

      return locations.map(l => ({
        ...l,
        asset_count: l._count.assets,
        _count: undefined,
      }));
    });

  api.patch('/:siteId/locations/:id', {
    schema: {
      params: z.object({ siteId: z.string().uuid(), id: z.string().uuid() }),
      body: z.object({
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional().nullable(),
        parent_id: z.string().uuid().optional().nullable(),
        is_active: z.boolean().optional(),
      }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const location = await app.prisma.location.findFirst({
        where: { id: request.params.id, site_id: request.params.siteId, tenant_id: request.tenantId! },
      });

      if (!location) {
        return reply.code(404).send({ error: 'Location not found', code: 'NOT_FOUND' });
      }

      if (request.body.parent_id) {
        const parent = await app.prisma.location.findFirst({
          where: { id: request.body.parent_id, site_id: request.params.siteId },
        });
        if (!parent) {
          return reply.code(400).send({ error: 'Parent location not found', code: 'INVALID_PARENT' });
        }
        // Prevent circular reference
        if (parent.id === location.id) {
          return reply.code(400).send({ error: 'Cannot set self as parent', code: 'CIRCULAR_REFERENCE' });
        }
      }

      await app.prisma.location.update({
        where: { id: request.params.id },
        data: request.body,
      });

      return { message: 'Location updated' };
    });

  api.delete('/:siteId/locations/:id', {
    schema: {
      params: z.object({ siteId: z.string().uuid(), id: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        400: z.object({ error: z.string(), code: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const location = await app.prisma.location.findFirst({
        where: { id: request.params.id, site_id: request.params.siteId, tenant_id: request.tenantId! },
        include: { _count: { select: { assets: true, children: true } } },
      });

      if (!location) {
        return reply.code(404).send({ error: 'Location not found', code: 'NOT_FOUND' });
      }

      if (location._count.assets > 0 || location._count.children > 0) {
        return reply.code(400).send({ error: 'Cannot delete location with assets or children', code: 'HAS_DEPENDENCIES' });
      }

      await app.prisma.location.delete({ where: { id: request.params.id } });

      return { message: 'Location deleted' };
    });

export { siteRoutes };