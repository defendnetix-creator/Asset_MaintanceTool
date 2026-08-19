// backend/src/routes/categories.ts
// Category routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const categoryItemSchema = z.object({
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
  custom_field_count: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
});

const categoriesListResponse = z.object({
  data: z.array(categoryItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
});

const categoryDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  parent_id: z.string().nullable(),
  parent_name: z.string().nullable(),
  children: z.array(z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
  })),
  is_active: z.boolean(),
  custom_fields: z.array(z.object({
    id: z.string(),
    name: z.string(),
    label: z.string(),
    type: z.string(),
  })),
  created_at: z.string(),
  updated_at: z.string(),
});

const messageResponse = z.object({ message: z.string() });
const errorResponse = z.object({ error: z.string(), code: z.string() });

const listCategoriesSchema = {
  querystring: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    include_inactive: z.boolean().default(false),
  }),
  response: { 200: categoriesListResponse },
};

const getCategorySchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: categoryDetailSchema, 404: errorResponse },
};

const createCategorySchema = {
  body: z.object({
    name: z.string().min(1).max(100),
    code: z.string().min(1).max(20).regex(/^[A-Z0-9_]+$/),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    icon: z.string().optional(),
    parent_id: z.string().uuid().optional(),
    is_active: z.boolean().default(true),
  }),
  response: { 201: categoryDetailSchema, 400: errorResponse },
};

const updateCategorySchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional().nullable(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
    icon: z.string().optional().nullable(),
    parent_id: z.string().uuid().optional().nullable(),
    is_active: z.boolean().optional(),
  }),
  response: { 200: categoryDetailSchema, 400: errorResponse, 404: errorResponse },
};

const deleteCategorySchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: messageResponse, 404: errorResponse },
};

export async function categoryRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List categories
  api.get('/', listCategoriesSchema, async (request) => {
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
    ]);

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
  api.post('/', createCategorySchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    // Check code uniqueness
    const existing = await app.prisma.category.findFirst({
      where: { tenant_id: tenantId, code: request.body.code },
    });
    if (existing) {
      return reply.code(400).send({ error: 'Category code already exists', code: 'CODE_EXISTS' });
    }

    const category = await app.prisma.category.create({
      data: {
        tenant_id: tenantId,
        ...request.body,
      },
    });

    return reply.code(201).send({
      ...category,
      parent_name: null,
      children: [],
      custom_fields: [],
    });
  });

  // Get category
  api.get('/:id', getCategorySchema, async (request, reply) => {
    const category = await app.prisma.category.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } },
        custom_fields: { select: { id: true, name: true, label: true, type: true }, orderBy: { display_order: 'asc' } },
      },
    });

    if (!category) {
      return reply.code(404).send({ error: 'Category not found', code: 'NOT_FOUND' });
    }

    return {
      ...category,
      parent_name: category.parent?.name || null,
    };
  });

  // Update category
  api.put('/:id', updateCategorySchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.category.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Category not found', code: 'NOT_FOUND' });
    }

    // Check code uniqueness if being changed
    if (request.body.name && request.body.name !== existing.name) {
      const code = request.body.name.toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, 20);
      const codeExists = await app.prisma.category.findFirst({
        where: { tenant_id: tenantId, code, NOT: { id: request.params.id } },
      });
      if (codeExists) {
        return reply.code(400).send({ error: 'Category code already exists', code: 'CODE_EXISTS' });
      }
    }

    const updated = await app.prisma.category.update({
      where: { id: request.params.id },
      data: request.body,
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } },
        custom_fields: { select: { id: true, name: true, label: true, type: true }, orderBy: { display_order: 'asc' } },
      },
    });

    return {
      ...updated,
      parent_name: updated.parent?.name || null,
    };
  });

  // Delete category
  api.delete('/:id', deleteCategorySchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.category.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Category not found', code: 'NOT_FOUND' });
    }

    // Check for children
    const children = await app.prisma.category.count({
      where: { parent_id: request.params.id, tenant_id: tenantId },
    });
    if (children > 0) {
      return reply.code(400).send({ error: 'Cannot delete category with children', code: 'HAS_CHILDREN' });
    }

    // Check for assets
    const assets = await app.prisma.asset.count({
      where: { category_id: request.params.id, tenant_id: tenantId },
    });
    if (assets > 0) {
      return reply.code(400).send({ error: 'Cannot delete category with assets', code: 'HAS_ASSETS' });
    }

    await app.prisma.category.delete({
      where: { id: request.params.id },
    });

    return { message: 'Category deleted' };
  });
}