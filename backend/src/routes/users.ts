// backend/src/routes/users.ts
// User management routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../plugins/auth';

export async function userRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List users
  api.get('/', {
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(25),
        search: z.string().optional(),
        role: z.string().optional(),
        status: z.string().optional(),
        group_id: z.string().uuid().optional(),
      }),
      response: {
        200: z.object({
          data: z.array(z.object({
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

  // Invite user
  api.post('/invite', {
    schema: {
      body: z.object({
        email: z.string().email(),
        first_name: z.string().min(1),
        last_name: z.string().min(1),
        role: z.enum(['IT_ASSET_MANAGER', 'FIELD_TECHNICIAN', 'EMPLOYEE', 'AUDITOR', 'READ_ONLY']),
        group_ids: z.array(z.string().uuid()).optional(),
        phone: z.string().optional(),
        title: z.string().optional(),
        department_id: z.string().uuid().optional(),
        send_invite: z.boolean().default(true),
      }),
      response: {
        201: z.object({ id: z.string(), email: z.string() }),
        400: z.object({ error: z.string(), code: z.string() }),
        409: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const tenantId = request.tenantId!;
      const userId = request.user!.id;

      // Check if user exists
      const existing = await app.prisma.user.findFirst({
        where: { tenant_id: tenantId, email: request.body.email },
      });
      if (existing) {
        return reply.code(409).send({ error: 'User with this email already exists', code: 'EMAIL_EXISTS' });
      }

      // Generate invite token
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const inviteTokenHash = await app.hashPassword(inviteToken);

      const user = await app.prisma.user.create({
        data: {
          ...request.body,
          email: request.body.email,
          tenant_id: tenantId,
          invited_by: userId,
          invited_at: new Date(),
          password_hash: inviteTokenHash, // Will be replaced on first login
          status: 'INVITED',
        },
      });

      // Add to groups
      if (request.body.group_ids?.length) {
        await app.prisma.userGroupMember.createMany({
          data: request.body.group_ids.map(gid => ({ user_id: user.id, group_id: gid })),
        });
      }

      // Send invite email
      if (request.body.send_invite) {
        // await app.queues.notifications.add('user_invited', { userId: user.id, token: inviteToken });
      }

      // Audit log
      await app.prisma.auditLog.create({
        data: {
          tenant_id: tenantId,
          user_id: userId,
          action: 'CREATE',
          resource_type: 'user',
          resource_id: user.id,
          new_values: { email: user.email, role: user.role },
        },
      });

      return reply.code(201).send({ id: user.id, email: user.email });
    });

  // Get user detail
  api.get('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          id: z.string(),
          email: z.string(),
          first_name: z.string(),
          last_name: z.string(),
          phone: z.string().nullable(),
          title: z.string().nullable(),
          role: z.string(),
          status: z.string(),
          mfa_enabled: z.boolean(),
          timezone: z.string(),
          date_format: z.string(),
          time_format: z.string(),
          language: z.string(),
          department_id: z.string().nullable(),
          manager_id: z.string().nullable(),
          last_login_at: z.string().nullable(),
          created_at: z.string(),
          groups: z.array(z.object({ id: z.string(), name: z.string(), role: z.string() })),
          sessions: z.array(z.object({
            id: z.string(),
            device_info: z.unknown(),
            ip_address: z.string().nullable(),
            last_active_at: z.string(),
            current: z.boolean(),
          })),
          api_keys: z.array(z.object({ id: z.string(), name: z.string(), scopes: z.array(z.string()), last_used_at: z.string().nullable() })),
        }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const user = await app.prisma.user.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
        include: {
          groups: { include: { group: true } },
          sessions: { where: { revoked_at: null }, orderBy: { last_used_at: 'desc' } },
          api_keys: { where: { revoked_at: null }, orderBy: { created_at: 'desc' } },
        },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
      }

      return {
        ...user,
        groups: user.groups.map(g => ({ id: g.group.id, name: g.group.name, role: g.role })),
      };
    });

  // Update user
  api.patch('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        phone: z.string().optional().nullable(),
        title: z.string().optional().nullable(),
        role: z.enum(['IT_ASSET_MANAGER', 'FIELD_TECHNICIAN', 'EMPLOYEE', 'AUDITOR', 'READ_ONLY']).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
        timezone: z.string().optional(),
        date_format: z.string().optional(),
        time_format: z.string().optional(),
        language: z.string().optional(),
        department_id: z.string().uuid().optional().nullable(),
        manager_id: z.string().uuid().optional().nullable(),
        group_ids: z.array(z.string().uuid()).optional(),
      }),
      response: {
        200: z.object({ id: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const user = await app.prisma.user.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
      }

      // Prevent self-demotion
      if (request.params.id === request.user!.id && request.body.role && request.body.role !== user.role) {
        return reply.code(400).send({ error: 'Cannot change your own role', code: 'SELF_DEMOTION' });
      }

      // Update groups
      if (request.body.group_ids) {
        await app.prisma.userGroupMember.deleteMany({ where: { user_id: request.params.id } });
        await app.prisma.userGroupMember.createMany({
          data: request.body.group_ids.map(gid => ({ user_id: request.params.id, group_id: gid })),
        });
      }

      const updated = await app.prisma.user.update({
        where: { id: request.params.id },
        data: { ...request.body, group_ids: undefined, updated_at: new Date() },
      });

      // Audit log
      await app.prisma.auditLog.create({
        data: {
          tenant_id: request.tenantId!,
          user_id: request.user!.id,
          action: 'UPDATE',
          resource_type: 'user',
          resource_id: updated.id,
          old_values: { role: user.role, status: user.status },
          new_values: { role: updated.role, status: updated.status },
        },
      });

      return { id: updated.id };
    });

  // Delete user (soft delete)
  api.delete('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        400: z.object({ error: z.string(), code: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const user = await app.prisma.user.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
      }

      if (user.id === request.user!.id) {
        return reply.code(400).send({ error: 'Cannot delete yourself', code: 'SELF_DELETE' });
      }

      await app.prisma.user.update({
        where: { id: request.params.id },
        data: { deleted_at: new Date(), status: 'INACTIVE' },
      });

      // Revoke all sessions
      await app.prisma.session.updateMany({
        where: { user_id: request.params.id, revoked_at: null },
        data: { revoked_at: new Date() },
      });

      // Revoke API keys
      await app.prisma.apiKey.updateMany({
        where: { owner_id: request.params.id, revoked_at: null },
        data: { revoked_at: new Date() },
      });

      return { message: 'User deleted successfully' };
    });

  // Bulk invite
  api.post('/bulk-invite', {
    schema: {
      body: z.object({
        users: z.array(z.object({
          email: z.string().email(),
          first_name: z.string().min(1),
          last_name: z.string().min(1),
          role: z.enum(['IT_ASSET_MANAGER', 'FIELD_TECHNICIAN', 'EMPLOYEE', 'AUDITOR', 'READ_ONLY']),
          group_ids: z.array(z.string().uuid()).optional(),
          phone: z.string().optional(),
          title: z.string().optional(),
        })).min(1).max(100),
        send_invites: z.boolean().default(true),
      }),
      response: {
        201: z.object({
          created: z.number(),
          failed: z.number(),
          errors: z.array(z.object({ email: z.string(), error: z.string() })),
        }),
      },
    }, async (request, reply) => {
      const tenantId = request.tenantId!;
      const userId = request.user!.id;

      const results = { created: 0, failed: 0, errors: [] as any[] };

      for (const userData of request.body.users) {
        try {
          const existing = await app.prisma.user.findFirst({
            where: { tenant_id: tenantId, email: userData.email },
          });
          if (existing) {
            results.failed++;
            results.errors.push({ email: userData.email, error: 'Email already exists' });
            continue;
          }

          const inviteToken = crypto.randomBytes(32).toString('hex');
          const inviteTokenHash = await app.hashPassword(inviteToken);

          await app.prisma.user.create({
            data: {
              ...userData,
              tenant_id: tenantId,
              invited_by: request.user!.id,
              invited_at: new Date(),
              password_hash: await app.hashPassword(inviteToken),
              status: 'INVITED',
            },
          });

          results.created++;
        } catch (e) {
          results.failed++;
          results.errors.push({ email: userData.email, error: e instanceof Error ? e.message : 'Unknown error' });
        }
      }

      return reply.code(201).send(results);
    });

  // Reset password (admin)
  api.post('/:id/reset-password', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        new_password: z.string().min(12),
        send_email: z.boolean().default(true),
      }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const user = await app.prisma.user.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
      }

      const newHash = await app.hashPassword(request.body.new_password);
      await app.prisma.user.update({
        where: { id: request.params.id },
        data: { password_hash: newHash, password_reset_token: null, password_reset_expires: null },
      });

      // Revoke all sessions
      await app.prisma.session.updateMany({
        where: { user_id: request.params.id, revoked_at: null },
        data: { revoked_at: new Date() },
      );

      if (request.body.send_email) {
        // await sendPasswordResetEmail(user.email);
      }

      return { message: 'Password reset successfully. User must log in with new password.' };
    });

  // Reset MFA
  api.post('/:id/reset-mfa', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string(), backup_codes: z.array(z.string()) }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const user = await app.prisma.user.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
      }

      // Generate new MFA secret and backup codes
      const secret = crypto.randomBytes(20).toString('base32');
      const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());
      const backupCodesHash = await Promise.all(backupCodes.map(c => app.hashPassword(c)));

      await app.prisma.user.update({
        where: { id: request.params.id },
        data: {
          mfa_secret: secret,
          mfa_enabled: true,
          backup_codes: backupCodesHash,
        },
      });

      // Revoke all sessions
      await app.prisma.session.updateMany({
        where: { user_id: request.params.id, revoked_at: null },
        data: { revoked_at: new Date() },
      );

      return { message: 'MFA reset successfully', backup_codes: backupCodes };
    });

  // Revoke sessions
  api.post('/:id/revoke-sessions', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        exclude_current: z.boolean().default(true),
      }),
      response: {
        200: z.object({ message: z.string(), revoked_count: z.number() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const user = await app.prisma.user.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
      }

      let where: any = { user_id: request.params.id, revoked_at: null };
      if (request.body.exclude_current && request.cookies.accessToken) {
        // Decode current token to get session ID
        try {
          const decoded = await request.jwtVerify<{ sid?: string }>();
          if (decoded.sid) {
            where.id = { not: decoded.sid };
          }
        } catch {}
      }

      const sessions = await app.prisma.session.updateMany({
        where,
        data: { revoked_at: new Date() },
      });

      return { message: 'Sessions revoked', revoked_count: sessions.count };
    });

  // API Keys
  api.get('/:id/api-keys', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.array(z.object({
          id: z.string(),
          name: z.string(),
          scopes: z.array(z.string()),
          created_at: z.string(),
          last_used_at: z.string().nullable(),
          revoked_at: z.string().nullable(),
        })),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const user = await app.prisma.user.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
      }

      const keys = await app.prisma.apiKey.findMany({
        where: { owner_id: request.params.id, tenant_id: request.tenantId! },
        orderBy: { created_at: 'desc' },
      });

      return keys.map(k => ({
        id: k.id,
        name: k.name,
        scopes: k.scopes,
        created_at: k.created_at.toISOString(),
        last_used_at: k.last_used_at?.toISOString() || null,
        revoked_at: k.revoked_at?.toISOString() || null,
      }));
    });

  api.post('/:id/api-keys', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        name: z.string().min(1).max(100),
        scopes: z.array(z.enum(['assets:read', 'assets:write', 'audits:read', 'reports:read', 'webhooks:manage', 'admin:read'])).min(1),
        expires_at: z.string().datetime().optional(),
      }),
      response: {
        201: z.object({
          id: z.string(),
          name: z.string(),
          key: z.string(), // Only returned once!
          scopes: z.array(z.string()),
        }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const user = await app.prisma.user.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
      }

      const key = crypto.randomBytes(32).toString('hex');
      const keyPrefix = key.slice(0, 8);
      const keyHash = await app.hashPassword(key);

      const apiKey = await app.prisma.apiKey.create({
        data: {
          tenant_id: request.tenantId!,
          name: request.body.name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          scopes: request.body.scopes,
          owner_id: request.params.id,
          expires_at: request.body.expires_at ? new Date(request.body.expires_at) : null,
        },
      });

      return reply.code(201).send({
        id: apiKey.id,
        name: apiKey.name,
        key: `${keyPrefix}.${key}`, // Only returned once!
        scopes: apiKey.scopes,
      });
    });

  api.delete('/:id/api-keys/:keyId', {
    schema: {
      params: z.object({ id: z.string().uuid(), keyId: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const key = await app.prisma.apiKey.findFirst({
        where: { id: request.params.keyId, tenant_id: request.tenantId!, owner_id: request.params.id },
      });

      if (!key) {
        return reply.code(404).send({ error: 'API key not found', code: 'NOT_FOUND' });
      }

      await app.prisma.apiKey.update({
        where: { id: request.params.keyId },
        data: { revoked_at: new Date() },
      });

      return { message: 'API key revoked' };
    });

export { userRoutes };