// backend/src/routes/users.ts
// User management routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../plugins/auth';

const userListItemSchema = z.object({
  id: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullable(),
  title: z.string().nullable(),
  role: z.string(),
  status: z.string(),
  mfa_enabled: z.boolean(),
  last_login_at: z.string().nullable(),
  created_at: z.string(),
  group: z.object({ id: z.string(), name: z.string() }).nullable(),
});

const usersListResponse = z.object({
  data: z.array(userListItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
});

const userDetailSchema = z.object({
  id: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullable(),
  title: z.string().nullable(),
  avatar_url: z.string().nullable(),
  timezone: z.string(),
  date_format: z.string(),
  time_format: z.string(),
  language: z.string(),
  role: z.string(),
  status: z.string(),
  mfa_enabled: z.boolean(),
  last_login_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  groups: z.array(z.object({ id: z.string(), name: z.string() })),
  assigned_assets_count: z.number(),
  api_keys_count: z.number(),
});

const messageResponse = z.object({ message: z.string() });
const errorResponse = z.object({ error: z.string(), code: z.string() });

const listUsersSchema = {
  querystring: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(25),
    search: z.string().optional(),
    role: z.string().optional(),
    status: z.string().optional(),
    group_id: z.string().uuid().optional(),
  }),
  response: { 200: usersListResponse },
};

const getUserSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: userDetailSchema, 404: errorResponse },
};

const createUserSchema = {
  body: z.object({
    email: z.string().email(),
    first_name: z.string().min(1).max(50),
    last_name: z.string().min(1).max(50),
    phone: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'IT_ASSET_MANAGER', 'FIELD_TECHNICIAN', 'EMPLOYEE', 'AUDITOR', 'READ_ONLY']).default('EMPLOYEE'),
    password: z.string().min(12).optional(),
    send_invite: z.boolean().default(true),
    group_ids: z.array(z.string().uuid()).optional(),
  }),
  response: { 201: userDetailSchema, 400: errorResponse },
};

const updateUserSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    first_name: z.string().min(1).max(50).optional(),
    last_name: z.string().min(1).max(50).optional(),
    phone: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    avatar_url: z.string().url().optional().nullable(),
    timezone: z.string().optional(),
    date_format: z.string().optional(),
    time_format: z.string().optional(),
    language: z.string().optional(),
    role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'IT_ASSET_MANAGER', 'FIELD_TECHNICIAN', 'EMPLOYEE', 'AUDITOR', 'READ_ONLY']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'INVITED', 'SUSPENDED']).optional(),
    group_ids: z.array(z.string().uuid()).optional(),
  }),
  response: { 200: userDetailSchema, 400: errorResponse, 404: errorResponse },
};

const deleteUserSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: messageResponse, 404: errorResponse },
};

const resetPasswordSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ password: z.string().min(12) }),
  response: { 200: messageResponse, 400: errorResponse, 404: errorResponse },
};

const inviteUserSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: messageResponse, 400: errorResponse, 404: errorResponse },
};

const resetMfaSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: messageResponse, 400: errorResponse, 404: errorResponse },
};

const changeRoleSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'IT_ASSET_MANAGER', 'FIELD_TECHNICIAN', 'EMPLOYEE', 'AUDITOR', 'READ_ONLY']) }),
  response: { 200: messageResponse, 400: errorResponse, 404: errorResponse },
};

const meResponseSchema = {
  response: { 200: userDetailSchema },
};

const updateMeSchema = {
  body: z.object({
    first_name: z.string().min(1).max(50).optional(),
    last_name: z.string().min(1).max(50).optional(),
    phone: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    avatar_url: z.string().url().optional().nullable(),
    timezone: z.string().optional(),
    date_format: z.string().optional(),
    time_format: z.string().optional(),
    language: z.string().optional(),
  }),
  response: { 200: userDetailSchema },
};

const changePasswordSchema = {
  body: z.object({
    current_password: z.string().min(1),
    new_password: z.string().min(12),
  }),
  response: { 200: messageResponse, 400: errorResponse, 401: errorResponse },
};

export async function userRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List users
  api.get('/', listUsersSchema, async (request) => {
    const { page, limit, search, role, status, group_id } = request.query;
    const tenantId = request.tenantId!;

    const where: any = { tenant_id: tenantId, deleted_at: null };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      app.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          groups: { include: { group: { select: { id: true, name: true } } }, take: 1 },
        },
      }),
      app.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(u => ({
        ...u,
        group: u.groups[0]?.group || null,
        groups: undefined,
      })),
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
  });

  // Create user (invite)
  api.post('/', createUserSchema, async (request, reply) => {
    const tenantId = request.tenantId!;
    const inviterId = request.user!.id;

    const existing = await app.prisma.user.findFirst({
      where: { tenant_id: tenantId, email: request.body.email },
    });
    if (existing) {
      return reply.code(400).send({ error: 'Email already exists', code: 'EMAIL_EXISTS' });
    }

    const { group_ids, password, send_invite, ...data } = request.body;

    let passwordHash: string | null = null;
    let status = 'INVITED';

    if (password) {
      passwordHash = await hashPassword(password);
      status = 'ACTIVE';
    }

    const user = await app.prisma.user.create({
      data: {
        tenant_id: tenantId,
        ...data,
        password_hash: passwordHash,
        status,
        invited_by: inviterId,
        invited_at: password ? null : new Date(),
        groups: group_ids?.length ? {
          create: group_ids.map(group_id => ({ group_id })),
        } : undefined,
      },
    });

    return reply.code(201).send({
      ...user,
      groups: group_ids ? group_ids.map(id => ({ id, name: '' })) : [],
      assigned_assets_count: 0,
      api_keys_count: 0,
    });
  });

  // Get user
  api.get('/:id', getUserSchema, async (request, reply) => {
    const user = await app.prisma.user.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
      include: {
        groups: { include: { group: { select: { id: true, name: true } } } },
        _count: { select: { assigned_assets: true, api_keys: true } },
      },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
    }

    return {
      ...user,
      groups: user.groups.map(g => g.group),
      assigned_assets_count: user._count.assigned_assets,
      api_keys_count: user._count.api_keys,
      _count: undefined,
    };
  });

  // Update user
  api.put('/:id', updateUserSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.user.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
    }

    const { group_ids, ...data } = request.body;

    const updated = await app.prisma.user.update({
      where: { id: request.params.id },
      data: {
        ...data,
        groups: group_ids ? {
          deleteMany: {},
          create: group_ids.map(group_id => ({ group_id })),
        } : undefined,
      },
      include: {
        groups: { include: { group: { select: { id: true, name: true } } } },
        _count: { select: { assigned_assets: true, api_keys: true } },
      },
    });

    return {
      ...updated,
      groups: updated.groups.map(g => g.group),
      assigned_assets_count: updated._count.assigned_assets,
      api_keys_count: updated._count.api_keys,
      _count: undefined,
    };
  });

  // Delete user (soft delete)
  api.delete('/:id', deleteUserSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.user.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
    }

    if (existing.id === request.user!.id) {
      return reply.code(400).send({ error: 'Cannot delete yourself', code: 'CANNOT_DELETE_SELF' });
    }

    await app.prisma.user.update({
      where: { id: request.params.id },
      data: { deleted_at: new Date(), status: 'INACTIVE' },
    });

    return { message: 'User deleted' };
  });

  // Reset password (admin)
  api.post('/:id/reset-password', resetPasswordSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.user.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
    }

    const passwordHash = await hashPassword(request.body.password);

    await app.prisma.user.update({
      where: { id: request.params.id },
      data: { password_hash: passwordHash, updated_at: new Date() },
    });

    return { message: 'Password reset successful' };
  });

  // Resend invitation
  api.post('/:id/invite', inviteUserSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.user.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
    }

    if (existing.status !== 'INVITED') {
      return reply.code(400).send({ error: 'User is not in invited status', code: 'NOT_INVITED' });
    }

    await app.prisma.user.update({
      where: { id: request.params.id },
      data: { invited_at: new Date() },
    });

    return { message: 'Invitation resent' };
  });

  // Reset MFA
  api.post('/:id/reset-mfa', resetMfaSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.user.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
    }

    await app.prisma.user.update({
      where: { id: request.params.id },
      data: { mfa_enabled: false, mfa_secret: null, backup_codes: [], updated_at: new Date() },
    });

    return { message: 'MFA reset successful' };
  });

  // Change role
  api.patch('/:id/role', changeRoleSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.user.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
    }

    if (existing.id === request.user!.id) {
      return reply.code(400).send({ error: 'Cannot change your own role', code: 'CANNOT_CHANGE_OWN_ROLE' });
    }

    await app.prisma.user.update({
      where: { id: request.params.id },
      data: { role: request.body.role, updated_at: new Date() },
    });

    return { message: 'Role updated' };
  });

  // Get current user profile (me)
  api.get('/me', meResponseSchema, async (request, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user!.id },
      include: {
        groups: { include: { group: { select: { id: true, name: true } } } },
        _count: { select: { assigned_assets: true, api_keys: true } },
      },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
    }

    return {
      ...user,
      groups: user.groups.map(g => g.group),
      assigned_assets_count: user._count.assigned_assets,
      api_keys_count: user._count.api_keys,
      _count: undefined,
    };
  });

  // Update current user profile
  api.patch('/me', updateMeSchema, async (request, reply) => {
    const user = await app.prisma.user.update({
      where: { id: request.user!.id },
      data: request.body,
      include: {
        groups: { include: { group: { select: { id: true, name: true } } } },
        _count: { select: { assigned_assets: true, api_keys: true } },
      },
    });

    return {
      ...user,
      groups: user.groups.map(g => g.group),
      assigned_assets_count: user._count.assigned_assets,
      api_keys_count: user._count.api_keys,
      _count: undefined,
    };
  });

  // Change password (current user)
  api.post('/me/change-password', changePasswordSchema, async (request, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user!.id },
    });

    if (!user || !user.password_hash) {
      return reply.code(401).send({ error: 'Cannot change password', code: 'NO_PASSWORD' });
    }

    const valid = await verifyPassword(request.body.current_password, user.password_hash);
    if (!valid) {
      return reply.code(401).send({ error: 'Current password is incorrect', code: 'INVALID_PASSWORD' });
    }

    const passwordHash = await hashPassword(request.body.new_password);

    await app.prisma.user.update({
      where: { id: request.user!.id },
      data: { password_hash: passwordHash, updated_at: new Date() },
    });

    return { message: 'Password changed successfully' };
  });
}