// backend/src/routes/departments.ts
// Department routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const departmentListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  cost_center: z.string().nullable(),
  manager_id: z.string().nullable(),
  manager_name: z.string().nullable(),
  asset_count: z.number(),
  user_count: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
});

const departmentsListResponse = z.object({
  data: z.array(departmentListItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
});

const departmentDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  cost_center: z.string().nullable(),
  manager_id: z.string().nullable(),
  manager_name: z.string().nullable(),
  is_active: z.boolean(),
  assets: z.array(z.object({
    id: z.string(),
    asset_tag: z.string(),
    name: z.string().nullable(),
  })),
  users: z.array(z.object({
    id: z.string(),
    email: z.string(),
    first_name: z.string(),
    last_name: z.string(),
  })),
  created_at: z.string(),
  updated_at: z.string(),
});

const messageResponse = z.object({ message: z.string() });
const errorResponse = z.object({ error: z.string(), code: z.string() });

const listDepartmentsSchema = {
  querystring: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    include_inactive: z.boolean().default(false),
  }),
  response: { 200: departmentsListResponse },
};

const getDepartmentSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: departmentDetailSchema, 404: errorResponse },
};

const createDepartmentSchema = {
  body: z.object({
    name: z.string().min(1).max(100),
    code: z.string().min(1).max(20).regex(/^[A-Z0-9_]+$/),
    description: z.string().optional(),
    cost_center: z.string().optional(),
    manager_id: z.string().uuid().optional(),
    is_active: z.boolean().default(true),
  }),
  response: { 201: departmentDetailSchema, 400: errorResponse },
};

const updateDepartmentSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional().nullable(),
    cost_center: z.string().optional().nullable(),
    manager_id: z.string().uuid().optional().nullable(),
    is_active: z.boolean().optional(),
  }),
  response: { 200: departmentDetailSchema, 400: errorResponse, 404: errorResponse },
};

const deleteDepartmentSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: messageResponse, 404: errorResponse },
};

export async function departmentRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List departments
  api.get('/', listDepartmentsSchema, async (request) => {
    const { page, limit, include_inactive } = request.query;
    const tenantId = request.tenantId!;

    const where: any = { tenant_id: tenantId };
    if (!include_inactive) where.is_active = true;

    const [departments, total] = await Promise.all([
      app.prisma.department.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          manager: { select: { id: true, first_name: true, last_name: true } },
          _count: { select: { assets: true, users: true } },
        },
      }),
      app.prisma.department.count({ where }),
    ]);

    return {
      data: departments.map(d => ({
        ...d,
        manager_name: d.manager ? `${d.manager.first_name} ${d.manager.last_name}` : null,
        asset_count: d._count.assets,
        user_count: d._count.users,
        _count: undefined,
        manager: undefined,
      })),
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
  });

  // Create department
  api.post('/', createDepartmentSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.department.findFirst({
      where: { tenant_id: tenantId, code: request.body.code },
    });
    if (existing) {
      return reply.code(400).send({ error: 'Department code already exists', code: 'CODE_EXISTS' });
    }

    const department = await app.prisma.department.create({
      data: {
        tenant_id: tenantId,
        ...request.body,
      },
    });

    return reply.code(201).send({
      ...department,
      manager_name: null,
      assets: [],
      users: [],
    });
  });

  // Get department
  api.get('/:id', getDepartmentSchema, async (request, reply) => {
    const department = await app.prisma.department.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
      include: {
        manager: { select: { id: true, first_name: true, last_name: true } },
        assets: { select: { id: true, asset_tag: true, name: true } },
        users: { select: { id: true, email: true, first_name: true, last_name: true } },
      },
    });

    if (!department) {
      return reply.code(404).send({ error: 'Department not found', code: 'NOT_FOUND' });
    }

    return {
      ...department,
      manager_name: department.manager ? `${department.manager.first_name} ${department.manager.last_name}` : null,
    };
  });

  // Update department
  api.put('/:id', updateDepartmentSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.department.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Department not found', code: 'NOT_FOUND' });
    }

    const updated = await app.prisma.department.update({
      where: { id: request.params.id },
      data: request.body,
      include: {
        manager: { select: { id: true, first_name: true, last_name: true } },
        assets: { select: { id: true, asset_tag: true, name: true } },
        users: { select: { id: true, email: true, first_name: true, last_name: true } },
      },
    });

    return {
      ...updated,
      manager_name: updated.manager ? `${updated.manager.first_name} ${updated.manager.last_name}` : null,
    };
  });

  // Delete department
  api.delete('/:id', deleteDepartmentSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.department.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Department not found', code: 'NOT_FOUND' });
    }

    // Check for assets
    const assets = await app.prisma.asset.count({
      where: { department_id: request.params.id, tenant_id: tenantId },
    });
    if (assets > 0) {
      return reply.code(400).send({ error: 'Cannot delete department with assets', code: 'HAS_ASSETS' });
    }

    // Check for users
    const users = await app.prisma.user.count({
      where: { department_id: request.params.id, tenant_id: tenantId },
    });
    if (users > 0) {
      return reply.code(400).send({ error: 'Cannot delete department with users', code: 'HAS_USERS' });
    }

    await app.prisma.department.delete({
      where: { id: request.params.id },
    });

    return { message: 'Department deleted' };
  });
}