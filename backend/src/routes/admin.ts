// backend/src/routes/admin.ts
// Admin routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function adminRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // Tenant settings
  api.get('/settings', {
    schema: {
      response: {
        200: z.object({
          asset_tag_prefix: z.string().nullable(),
          asset_tag_format: z.string(),
          asset_tag_counter: z.number(),
          password_min_length: z.number(),
          password_require_upper: z.boolean(),
          password_require_lower: z.boolean(),
          password_require_number: z.boolean(),
          password_require_symbol: z.boolean(),
          password_max_age_days: z.number(),
          password_history_count: z.number(),
          mfa_required_for_admins: z.boolean(),
          mfa_required_for_all: z.boolean(),
          mfa_methods: z.array(z.string()),
          session_absolute_timeout_minutes: z.number(),
          session_idle_timeout_minutes: z.number(),
          max_concurrent_sessions: z.number(),
          ip_allowlist_enabled: z.boolean(),
          ip_allowlist_cidrs: z.array(z.string()),
          sso_enabled: z.boolean(),
          sso_provider: z.string().nullable(),
          sso_entity_id: z.string().nullable(),
          sso_sso_url: z.string().nullable(),
          sso_slo_url: z.string().nullable(),
          sso_jit_provisioning: z.boolean(),
          audit_log_retention_days: z.number(),
          asset_history_retention_days: z.number(),
          deleted_user_retention_days: z.number(),
          export_retention_days: z.number(),
          backup_retention_days: z.number(),
        }),
        403: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      if (request.user!.role !== 'SUPER_ADMIN' && request.user!.role !== 'TENANT_ADMIN') {
        return reply.code(403).send({ error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' });
      }

      const settings = await app.prisma.tenantSettings.findUnique({
        where: { tenant_id: request.tenantId! },
      });

      if (!settings) {
        return reply.code(404).send({ error: 'Settings not found', code: 'NOT_FOUND' });
      }

      return settings;
    });

  api.patch('/settings', {
    schema: {
      body: z.object({
        asset_tag_prefix: z.string().max(10).optional(),
        asset_tag_format: z.string().optional(),
        password_min_length: z.number().int().min(8).max(64).optional(),
        password_require_upper: z.boolean().optional(),
        password_require_lower: z.boolean().optional(),
        password_require_number: z.boolean().optional(),
        password_require_symbol: z.boolean().optional(),
        password_max_age_days: z.number().int().positive().optional(),
        password_history_count: z.number().int().nonnegative().optional(),
        mfa_required_for_admins: z.boolean().optional(),
        mfa_required_for_all: z.boolean().optional(),
        mfa_methods: z.array(z.enum(['totp', 'passkey', 'sms'])).optional(),
        session_absolute_timeout_minutes: z.number().int().positive().optional(),
        session_idle_timeout_minutes: z.number().int().positive().optional(),
        max_concurrent_sessions: z.number().int().positive().optional(),
        ip_allowlist_enabled: z.boolean().optional(),
        ip_allowlist_cidrs: z.array(z.string()).optional(),
        sso_enabled: z.boolean().optional(),
        sso_provider: z.enum(['azure-ad', 'okta', 'google', 'custom']).optional(),
        sso_entity_id: z.string().optional(),
        sso_sso_url: z.string().optional(),
        sso_slo_url: z.string().optional(),
        sso_certificate: z.string().optional(),
        sso_attribute_mapping: z.unknown().optional(),
        sso_jit_provisioning: z.boolean().optional(),
        audit_log_retention_days: z.number().int().positive().optional(),
        asset_history_retention_days: z.number().int().positive().optional(),
        deleted_user_retention_days: z.number().int().positive().optional(),
        export_retention_days: z.number().int().positive().optional(),
        backup_retention_days: z.number().int().positive().optional(),
      }),
      response: {
        200: z.object({ message: z.string() }),
        403: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      if (request.user!.role !== 'SUPER_ADMIN' && request.user!.role !== 'TENANT_ADMIN') {
        return reply.code(403).send({ error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' });
      }

      const settings = await app.prisma.tenantSettings.upsert({
        where: { tenant_id: request.tenantId! },
        update: request.body,
        create: { tenant_id: request.tenantId!, ...request.body },
      });

      return { message: 'Settings updated successfully' };
    });

  // Branding
  api.get('/branding', {
    schema: {
      response: {
        200: z.object({
          logo_light_url: z.string().nullable(),
          logo_dark_url: z.string().nullable(),
          favicon_url: z.string().nullable(),
          primary_color: z.string().nullable(),
          login_background_url: z.string().nullable(),
        }),
      },
    }, async (request) => {
      const tenant = await app.prisma.tenant.findUnique({
        where: { id: request.tenantId! },
        select: { logo_url: true, primary_color: true },
      });

      return {
        logo_light_url: tenant?.logo_url || null,
        logo_dark_url: null,
        favicon_url: null,
        primary_color: tenant?.primary_color || '#2563EB',
        login_background_url: null,
      };
    });

  api.patch('/branding', {
    schema: {
      body: z.object({
        logo_light: z.string().optional(), // base64 or URL
        logo_dark: z.string().optional(),
        favicon: z.string().optional(),
        primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        login_background: z.string().optional(),
      }),
      response: {
        200: z.object({ message: z.string() }),
      },
    }, async (request, reply) => {
      if (request.user!.role !== 'SUPER_ADMIN' && request.user!.role !== 'TENANT_ADMIN') {
        return reply.code(403).send({ error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' });
      }

      const updateData: any = {};
      if (request.body.logo_light) updateData.logo_url = request.body.logo_light;
      if (request.body.primary_color) updateData.primary_color = request.body.primary_color;

      await app.prisma.tenant.update({
        where: { id: request.tenantId! },
        data: updateData,
      });

      return { message: 'Branding updated' };
    });

  // Subscription info
  api.get('/subscription', {
    schema: {
      response: {
        200: z.object({
          plan: z.string(),
          status: z.string(),
          assets_used: z.number(),
          assets_limit: z.number(),
          users_used: z.number(),
          users_limit: z.number(),
          storage_used_gb: z.number(),
          storage_limit_gb: z.number(),
          billing_cycle: z.string(),
          next_billing_date: z.string().nullable(),
          payment_method: z.object({ type: z.string(), last4: z.string() }).nullable(),
        }),
      },
    }, async (request) => {
      const tenant = await app.prisma.tenant.findUnique({
        where: { id: request.tenantId! },
        select: {
          plan: true,
          max_assets: true,
          max_users: true,
          max_storage_gb: true,
        },
      });

      const [assetsUsed, usersUsed] = await Promise.all([
        app.prisma.asset.count({ where: { tenant_id: request.tenantId!, deleted_at: null } }),
        app.prisma.user.count({ where: { tenant_id: request.tenantId!, deleted_at: null } }),
      );

      return {
        plan: tenant?.plan || 'free',
        status: 'active',
        assets_used: assetsUsed,
        assets_limit: tenant?.max_assets || 1000,
        users_used: usersUsed,
        users_limit: tenant?.max_users || 50,
        storage_used_gb: 0,
        storage_limit_gb: tenant?.max_storage_gb || 10,
        billing_cycle: 'monthly',
        next_billing_date: null,
        payment_method: null,
      };
    });

  // Audit log
  api.get('/audit-log', {
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(50),
        user_id: z.string().uuid().optional(),
        action: z.string().optional(),
        resource_type: z.string().optional(),
        start_date: z.string().datetime().optional(),
        end_date: z.string().datetime().optional(),
      }),
      response: {
        200: z.object({
          data: z.array(z.object({
            id: z.string(),
            user_id: z.string().nullable(),
            action: z.string(),
            resource_type: z.string(),
            resource_id: z.string().nullable(),
            ip_address: z.string().nullable(),
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
      if (request.user!.role !== 'SUPER_ADMIN' && request.user!.role !== 'TENANT_ADMIN') {
        return reply.code(403).send({ error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' });
      }

      const { page, limit, user_id, action, resource_type, start_date, end_date } = request.query;
      const tenantId = request.tenantId!;

      const where: any = { tenant_id: tenantId };
      if (user_id) where.user_id = user_id;
      if (action) where.action = action;
      if (resource_type) where.resource_type = resource_type;
      if (start_date || end_date) {
        where.created_at = {};
        if (start_date) where.created_at.gte = new Date(start_date);
        if (end_date) where.created_at.lte = new Date(end_date);
      }

      const [logs, total] = await Promise.all([
        app.prisma.auditLog.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { created_at: 'desc' },
        }),
        app.prisma.auditLog.count({ where }),
      ]);

      return { data: logs, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
    });

  // Verify integrity
  api.post('/audit-log/verify', {
    schema: {
      response: {
        200: z.object({
          verified: z.boolean(),
          checked: z.number(),
          tampered: z.array(z.object({
            id: z.string(),
            expected_hash: z.string(),
            actual_hash: z.string(),
          })),
        }),
      },
    }, async (request, reply) => {
      if (request.user!.role !== 'SUPER_ADMIN' && request.user!.role !== 'TENANT_ADMIN') {
        return reply.code(403).send({ error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' });
      }

      const logs = await app.prisma.auditLog.findMany({
        where: { tenant_id: request.tenantId! },
        orderBy: { created_at: 'asc' },
      });

      let previousHash: string | null = null;
      const tampered: any[] = [];

      for (const log of logs) {
        const data = `${log.id}|${log.tenant_id}|${log.user_id || ''}|${log.action}|${log.resource_type}|${log.resource_id || ''}|${JSON.stringify(log.old_values)}|${JSON.stringify(log.new_values)}|${log.ip_address || ''}|${log.user_agent || ''}|${JSON.stringify(log.metadata)}|${previousHash || ''}`;
        const crypto = await import('crypto');
        const hash = crypto.createHash('sha256').update(data).digest('hex');

        if (log.previous_hash && log.previous_hash !== previousHash) {
          tampered.push({ id: log.id, expected_hash: previousHash, actual_hash: log.previous_hash });
        }
        if (log.hash !== hash) {
          tampered.push({ id: log.id, expected_hash: hash, actual_hash: log.hash });
        }

        previousHash = hash;
      }

      return { verified: tampered.length === 0, checked: logs.length, tampered };
    });

export { adminRoutes };