// backend/src/routes/departments.ts
// Department routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function departmentRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List departments
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
            cost_center: z.string().nullable(),
            manager_id: z.string().nullable(),
            manager_name: z.string().nullable(),
            asset_count: z.number(),
            user_count: z.number(),
            is_active: z.boolean(),
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

      const where: any = { tenant_id: request.tenantId! };
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
      );

      return {
        data: departments.map(d => ({
          ...d,
          manager_name: d.manager ? `${d.manager.first_name} ${d.manager.last_name}` : null,
          asset_count: d._count.assets,
          user_count: d._count.users,
          _count: undefined,
          manager: undefined,
        }),
        pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
      };
    });

  // Create department
  api.post('/', {
    schema: {
      body: z.object({
        name: z.string().min(1).max(100),
        code: z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/),
        description: z.string().optional(),
        cost_center: z.string().max(50).optional(),
        manager_id: z.string().uuid().optional(),
      }),
      response: {
        201: z.object({ id: z.string() }),
        409: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const tenantId = request.tenantId!;

      const existing = await app.prisma.department.findFirst({
        where: { tenant_id: tenantId, code: request.body.code },
      });
      if (existing) {
        return reply.code(409).send({ error: 'Department code already exists', code: 'DUPLICATE_CODE' });
      }

      if (request.body.manager_id) {
        const manager = await app.prisma.user.findFirst({
          where: { id: request.body.manager_id, tenant_id: tenantId, status: 'ACTIVE' },
        });
        if (!manager) {
          return reply.code(400).send({ error: 'Manager not found', code: 'INVALID_MANAGER' });
        }
      }

      const department = await app.prisma.department.create({
        data: { ...request.body, tenant_id: tenantId },
      });

      return reply.code(201).send({ id: department.id });
    });

  // Get department detail
  api.get('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          id: z.string(),
          name: z.string(),
          code: z.string(),
          description: z.string().nullable(),
          cost_center: z.string().nullable(),
          manager_id: z.string().nullable(),
          manager: z.object({ id: z.string(), first_name: z.string(), last_name: z.string(), email: z.string() }).nullable(),
          is_active: z.boolean(),
          assets: z.array(z.object({
            id: z.string(),
            asset_tag: z.string(),
            make: z.string().nullable(),
            model: z.string().nullable(),
            status: z.string(),
          })),
          users: z.array(z.object({
            id: z.string(),
            first_name: z.string(),
            last_name: z.string(),
            email: z.string(),
            role: z.string(),
            status: z.string(),
          })),
          created_at: z.string(),
          updated_at: z.string(),
        }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const department = await app.prisma.department.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
        include: {
          manager: { select: { id: true, first_name: true, last_name: true, email: true } },
          assets: { where: { deleted_at: null }, select: { id: true, asset_tag: true, make: true, model: true, status: true }, take: 50 },
          users: { where: { deleted_at: null }, select: { id: true, first_name: true, last_name: true, email: true, role: true, status: true }, take: 50 },
        },
      });

      if (!department) {
        return reply.code(404).send({ error: 'Department not found', code: 'NOT_FOUND' });
      }

      return {
        ...department,
        manager: department.manager ? { ...department.manager, email: department.manager.email } : null,
      };
    });

  // Update department
  api.patch('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional().nullable(),
        cost_center: z.string().max(50).optional().nullable(),
        manager_id: z.string().uuid().optional().nullable(),
        is_active: z.boolean().optional(),
      }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const department = await app.prisma.department.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!department) {
        return reply.code(404).send({ error: 'Department not found', code: 'NOT_FOUND' });
      }

      if (request.body.manager_id) {
        const manager = await app.prisma.user.findFirst({
          where: { id: request.body.manager_id, tenant_id: request.tenantId!, status: 'ACTIVE' },
        });
        if (!manager) {
          return reply.code(400).send({ error: 'Manager not found', code: 'INVALID_MANAGER' });
        }
      }

      await app.prisma.department.update({
        where: { id: request.params.id },
        data: request.body,
      );

      return { message: 'Department updated' };
    });

  // Delete department
  api.delete('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        400: z.object({ error: z.string(), code: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const department = await app.prisma.department.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
        include: { _count: { select: { assets: true, users: true } } },
      );

      if (!department) {
        return reply.code(404).send({ error: 'Department not found', code: 'NOT_FOUND' });
      }

      if (department._count.assets > 0 || department._count.users > 0) {
        return reply.code(400).send({ error: 'Cannot delete department with assets or users', code: 'HAS_DEPENDENCIES' });
      }

      await app.prisma.department.delete({ where: { id: request.params.id } });

      return { message: 'Department deleted' };
    });

  // Get department assets
  api.get('/:id/assets', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(25),
      }),
      response: {
        200: z.object({
          data: z.array(z.object({
            id: z.string(),
            asset_tag: z.string(),
            make: z.string().nullable(),
            model: z.string().nullable(),
            status: z.string(),
            custodian: z.object({ id: z.string(), first_name: z.string(), last_name: z.string() }).nullable(),
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
      const { page, limit } = request.query;

      const department = await app.prisma.department.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!department) {
        return { data: [], pagination: { page: 1, limit: 25, total: 0, total_pages: 0 } };
      }

      const where: any = { tenant_id: request.tenantId!, department_id: request.params.id, deleted_at: null };

      const [assets, total] = await Promise.all([
        app.prisma.asset.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { asset_tag: 'asc' },
          include: { custodian_user: { select: { id: true, first_name: true, last_name: true } } },
        }),
        app.prisma.asset.count({ where }),
      );

      return {
        data: assets.map(a => ({
          id: a.id,
          asset_tag: a.asset_tag,
          make: a.make,
          model: a.model,
          status: a.status,
          custodian: a.custodian_user ? { id: a.custodian_user.id, first_name: a.custodian_user.first_name, last_name: a.custodian_user.last_name } : null,
        })),
        pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
      };
    });

  // Get department users
  api.get('/:id/users', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(25),
      }),
      response: {
        200: z.object({
          data: z.array(z.object({
            id: z.string(),
            first_name: z.string(),
            last_name: z.string(),
            email: z.string(),
            role: z.string(),
            status: z.string(),
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
      const { page, limit } = request.query;

      const department = await app.prisma.department.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!department) {
        return { data: [], pagination: { page: 1, limit: 25, total: 0, total_pages: 0 } };
      }

      const [users, total] = await Promise.all([
        app.prisma.user.findMany({
          where: { tenant_id: request.tenantId!, department_id: request.params.id, deleted_at: null },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { created_at: 'desc' },
        }),
        app.prisma.user.count({ where: { tenant_id: request.tenantId!, department_id: request.params.id, deleted_at: null } }),
      );

      return {
        data: users.map(u => ({
          id: u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
          role: u.role,
          status: u.status,
        })),
        pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
      };
    });

export { departmentRoutes };