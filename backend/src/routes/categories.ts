// backend/src/routes/categories.ts
// Category routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function categoryRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List categories
  api.get('/', {
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(50),
        include_inactive: z.boolean().default(false),
      }),
      response: {
        200: z.object({
          data: z.array(z.object({
            id: z.string(),
            name: z.string(),
            code: z.string(),
            description: z.string().nullable(),
            color: z.string().nullable(),
            icon: z.string().nullable(),
            parent_id: z.string().nullable(),
            parent_name: z.string().nullable(),
            child_count: z.number(),
            asset_count: z.number(),
            is_active: z.boolean(),
            custom_field_count: z.number(),
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
      const { page, limit, include_inactive } = request.query;
      const tenantId = request.tenantId!;

      const where: any = { tenant_id: tenantId };
      if (!include_inactive) where.is_active = true;

      const [categories, total] = await Promise.all([
        app.prisma.category.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { name: 'asc' },
          include: {
            parent: { select: { id: true, name: true } },
            _count: { select: { children: true, assets: true, custom_fields: true } },
          },
        }),
        app.prisma.category.count({ where }),
      );

      return {
        data: categories.map(c => ({
          ...c,
          parent_name: c.parent?.name || null,
          child_count: c._count.children,
          asset_count: c._count.assets,
          custom_field_count: c._count.custom_fields,
          _count: undefined,
          parent: undefined,
        })),
        pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
      };
    });

  // Create category
  api.post('/', {
    schema: {
      body: z.object({
        name: z.string().min(1).max(100),
        code: z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/),
        description: z.string().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        icon: z.string().max(50).optional(),
        parent_id: z.string().uuid().optional(),
      }),
      response: {
        201: z.object({ id: z.string() }),
        409: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const tenantId = request.tenantId!;

      const existing = await app.prisma.category.findFirst({
        where: { tenant_id: tenantId, code: request.body.code },
      });
      if (existing) {
        return reply.code(409).send({ error: 'Category code already exists', code: 'DUPLICATE_CODE' });
      }

      if (request.body.parent_id) {
        const parent = await app.prisma.category.findFirst({
          where: { id: request.body.parent_id, tenant_id: tenantId },
        });
        if (!parent) {
          return reply.code(400).send({ error: 'Parent category not found', code: 'INVALID_PARENT' });
        }
      }

      const category = await app.prisma.category.create({
        data: { ...request.body, tenant_id: tenantId },
      });

      return reply.code(201).send({ id: category.id });
    });

  // Get category with children
  api.get('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          id: z.string(),
          name: z.string(),
          code: z.string(),
          description: z.string().nullable(),
          color: z.string().nullable(),
          icon: z.string().nullable(),
          parent_id: z.string().nullable(),
          parent_name: z.string().nullable(),
          is_active: z.boolean(),
          children: z.array(z.object({
            id: z.string(),
            name: z.string(),
            code: z.string(),
            is_active: z.boolean(),
          })),
          custom_fields: z.array(z.object({
            id: z.string(),
            name: z.string(),
            label: z.string(),
            type: z.string(),
            is_required: z.boolean(),
            is_active: z.boolean(),
          })),
          assets: z.array(z.object({
            id: z.string(),
            asset_tag: z.string(),
            make: z.string().nullable(),
            model: z.string().nullable(),
            status: z.string(),
          })),
          created_at: z.string(),
          updated_at: z.string(),
        }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const category = await app.prisma.category.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
        include: {
          parent: { select: { id: true, name: true } },
          children: { where: { is_active: true }, select: { id: true, name: true, code: true, is_active: true } },
          custom_fields: { where: { is_active: true }, orderBy: { display_order: 'asc' } },
          assets: { where: { deleted_at: null }, select: { id: true, asset_tag: true, make: true, model: true, status: true }, take: 50 },
        },
      });

      if (!category) {
        return reply.code(404).send({ error: 'Category not found', code: 'NOT_FOUND' });
      }

      return {
        ...category,
        parent_name: category.parent?.name || null,
        children: category.children,
        parent: undefined,
      };
    });

  // Update category
  api.patch('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional().nullable(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
        icon: z.string().max(50).optional().nullable(),
        parent_id: z.string().uuid().optional().nullable(),
        is_active: z.boolean().optional(),
      }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const category = await app.prisma.category.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!category) {
        return reply.code(404).send({ error: 'Category not found', code: 'NOT_FOUND' });
      }

      if (request.body.parent_id) {
        if (request.body.parent_id === request.params.id) {
          return reply.code(400).send({ error: 'Cannot set self as parent', code: 'CIRCULAR_REFERENCE' });
        }
        const parent = await app.prisma.category.findFirst({
          where: { id: request.body.parent_id, tenant_id: request.tenantId! },
        });
        if (!parent) {
          return reply.code(400).send({ error: 'Parent category not found', code: 'INVALID_PARENT' });
        }
      }

      await app.prisma.category.update({
        where: { id: request.params.id },
        data: request.body,
      });

      return { message: 'Category updated' };
    });

  // Delete category
  api.delete('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        400: z.object({ error: z.string(), code: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const category = await app.prisma.category.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
        include: { _count: { select: { children: true, assets: true, custom_fields: true } } },
      });

      if (!category) {
        return reply.code(404).send({ error: 'Category not found', code: 'NOT_FOUND' });
      }

      if (category._count.children > 0 || category._count.assets > 0 || category._count.custom_fields > 0) {
        return reply.code(400).send({ error: 'Cannot delete category with subcategories, assets, or custom fields', code: 'HAS_DEPENDENCIES' });
      }

      await app.prisma.category.delete({ where: { id: request.params.id } });

      return { message: 'Category deleted' };
    });

  // Bulk import
  api.post('/import', {
    schema: {
      body: z.object({
        categories: z.array(z.object({
          name: z.string().min(1).max(100),
          code: z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/),
          description: z.string().optional(),
          color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
          icon: z.string().max(50).optional(),
          parent_code: z.string().optional(),
        })).min(1).max(100),
      }),
      response: {
        201: z.object({
          created: z.number(),
          errors: z.array(z.object({ row: z.number(), error: z.string() })),
        }),
      },
    }, async (request, reply) => {
      const tenantId = request.tenantId!;

      const results = { created: 0, errors: [] as any[] };
      const codeToId = new Map<string, string>();

      for (let i = 0; i < request.body.categories.length; i++) {
        const cat = request.body.categories[i];
        try {
          // Check if parent exists
          let parentId = null;
          if (cat.parent_code) {
            const parent = await app.prisma.category.findFirst({
              where: { tenant_id: tenantId, code: cat.parent_code },
            });
            if (!parent) {
              throw new Error(`Parent category with code ${cat.parent_code} not found`);
            }
            parentId = parent.id;
          }

          await app.prisma.category.create({
            data: {
              tenant_id: tenantId,
              name: cat.name,
              code: cat.code,
              description: cat.description,
              color: cat.color,
              icon: cat.icon,
              parent_id: parentId,
            },
          });

          results.created++;
        } catch (e) {
          results.errors.push({ row: i + 1, error: e instanceof Error ? e.message : 'Unknown error' });
        }
      }

      return reply.code(201).send(results);
    });

export { categoryRoutes };