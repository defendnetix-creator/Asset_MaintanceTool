// backend/src/routes/admin.ts
// Admin routes - using inline JSON schemas for Fastify compatibility

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

// ============================================
// Zod Schemas for validation (input only)
// ============================================

const updateSettingsBody = z.object({
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
});

const updateBrandingBody = z.object({
  logo_light: z.string().optional(),
  logo_dark: z.string().optional(),
  favicon: z.string().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  login_background: z.string().optional(),
});

const auditLogQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  user_id: z.string().uuid().optional(),
  action: z.string().optional(),
  resource_type: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

// ============================================
// Inline JSON Schemas for responses
// ============================================

const errorResponse = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    code: { type: 'string' },
  },
  required: ['error', 'code'],
};

const messageResponse = {
  type: 'object',
  properties: {
    message: { type: 'string' },
  },
  required: ['message'],
};

const tenantSettingsResponse = {
  type: 'object',
  properties: {
    asset_tag_prefix: { type: 'string', nullable: true },
    asset_tag_format: { type: 'string' },
    asset_tag_counter: { type: 'number' },
    password_min_length: { type: 'number' },
    password_require_upper: { type: 'boolean' },
    password_require_lower: { type: 'boolean' },
    password_require_number: { type: 'boolean' },
    password_require_symbol: { type: 'boolean' },
    password_max_age_days: { type: 'number' },
    password_history_count: { type: 'number' },
    mfa_required_for_admins: { type: 'boolean' },
    mfa_required_for_all: { type: 'boolean' },
    mfa_methods: { type: 'array', items: { type: 'string' } },
    session_absolute_timeout_minutes: { type: 'number' },
    session_idle_timeout_minutes: { type: 'number' },
    max_concurrent_sessions: { type: 'number' },
    ip_allowlist_enabled: { type: 'boolean' },
    ip_allowlist_cidrs: { type: 'array', items: { type: 'string' } },
    sso_enabled: { type: 'boolean' },
    sso_provider: { type: 'string', nullable: true },
    sso_entity_id: { type: 'string', nullable: true },
    sso_sso_url: { type: 'string', nullable: true },
    sso_slo_url: { type: 'string', nullable: true },
    sso_jit_provisioning: { type: 'boolean' },
    audit_log_retention_days: { type: 'number' },
    asset_history_retention_days: { type: 'number' },
    deleted_user_retention_days: { type: 'number' },
    export_retention_days: { type: 'number' },
    backup_retention_days: { type: 'number' },
  },
  required: ['asset_tag_prefix', 'asset_tag_format', 'asset_tag_counter', 'password_min_length', 'password_require_upper', 'password_require_lower', 'password_require_number', 'password_require_symbol', 'password_max_age_days', 'password_history_count', 'mfa_required_for_admins', 'mfa_required_for_all', 'mfa_methods', 'session_absolute_timeout_minutes', 'session_idle_timeout_minutes', 'max_concurrent_sessions', 'ip_allowlist_enabled', 'ip_allowlist_cidrs', 'sso_enabled', 'sso_provider', 'sso_entity_id', 'sso_sso_url', 'sso_slo_url', 'sso_jit_provisioning', 'audit_log_retention_days', 'asset_history_retention_days', 'deleted_user_retention_days', 'export_retention_days', 'backup_retention_days'],
};

const brandingResponse = {
  type: 'object',
  properties: {
    logo_light_url: { type: 'string', nullable: true },
    logo_dark_url: { type: 'string', nullable: true },
    favicon_url: { type: 'string', nullable: true },
    primary_color: { type: 'string', nullable: true },
    login_background_url: { type: 'string', nullable: true },
  },
  required: ['logo_light_url', 'logo_dark_url', 'favicon_url', 'primary_color', 'login_background_url'],
};

const subscriptionResponse = {
  type: 'object',
  properties: {
    plan: { type: 'string' },
    status: { type: 'string' },
    assets_used: { type: 'number' },
    assets_limit: { type: 'number' },
    users_used: { type: 'number' },
    users_limit: { type: 'number' },
    storage_used_gb: { type: 'number' },
    storage_limit_gb: { type: 'number' },
    billing_cycle: { type: 'string' },
    next_billing_date: { type: 'string', nullable: true },
    payment_method: { type: 'object', properties: { type: { type: 'string' }, last4: { type: 'string' } }, nullable: true },
  },
  required: ['plan', 'status', 'assets_used', 'assets_limit', 'users_used', 'users_limit', 'storage_used_gb', 'storage_limit_gb', 'billing_cycle', 'next_billing_date', 'payment_method'],
};

const auditLogResponse = {
  type: 'object',
  properties: {
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          user_id: { type: 'string', nullable: true },
          action: { type: 'string' },
          resource_type: { type: 'string' },
          resource_id: { type: 'string', nullable: true },
          ip_address: { type: 'string', nullable: true },
          created_at: { type: 'string' },
        },
        required: ['id', 'user_id', 'action', 'resource_type', 'resource_id', 'ip_address', 'created_at'],
      },
    },
    pagination: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        limit: { type: 'number' },
        total: { type: 'number' },
        total_pages: { type: 'number' },
      },
      required: ['page', 'limit', 'total', 'total_pages'],
    },
  },
  required: ['data', 'pagination'],
};

const verifyAuditResponse = {
  type: 'object',
  properties: {
    verified: { type: 'boolean' },
    checked: { type: 'number' },
    tampered: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          expected_hash: { type: 'string' },
          actual_hash: { type: 'string' },
        },
        required: ['id', 'expected_hash', 'actual_hash'],
      },
    },
  },
  required: ['verified', 'checked', 'tampered'],
};

// ============================================
// Route Schemas
// ============================================

const settingsSchema = {
  // No response validation - let Fastify pass through
};

const updateSettingsSchema = {
  body: {
    type: 'object',
    additionalProperties: true,
    properties: {
      asset_tag_prefix: { type: 'string', maxLength: 10 },
      asset_tag_format: { type: 'string' },
      password_min_length: { type: 'integer', minimum: 8, maximum: 64 },
      password_require_upper: { type: 'boolean' },
      password_require_lower: { type: 'boolean' },
      password_require_number: { type: 'boolean' },
      password_require_symbol: { type: 'boolean' },
      password_max_age_days: { type: 'integer', minimum: 1 },
      password_history_count: { type: 'integer', minimum: 0 },
      mfa_required_for_admins: { type: 'boolean' },
      mfa_required_for_all: { type: 'boolean' },
      mfa_methods: { type: 'array', items: { type: 'string', enum: ['totp', 'passkey', 'sms'] } },
      session_absolute_timeout_minutes: { type: 'integer', minimum: 1 },
      session_idle_timeout_minutes: { type: 'integer', minimum: 1 },
      max_concurrent_sessions: { type: 'integer', minimum: 1 },
      ip_allowlist_enabled: { type: 'boolean' },
      ip_allowlist_cidrs: { type: 'array', items: { type: 'string' } },
      sso_enabled: { type: 'boolean' },
      sso_provider: { type: 'string', enum: ['azure-ad', 'okta', 'google', 'custom'] },
      sso_entity_id: { type: 'string' },
      sso_sso_url: { type: 'string' },
      sso_slo_url: { type: 'string' },
      sso_certificate: { type: 'string' },
      sso_attribute_mapping: { type: 'object' },
      sso_jit_provisioning: { type: 'boolean' },
      audit_log_retention_days: { type: 'integer', minimum: 1 },
      asset_history_retention_days: { type: 'integer', minimum: 1 },
      deleted_user_retention_days: { type: 'integer', minimum: 1 },
      export_retention_days: { type: 'integer', minimum: 1 },
      backup_retention_days: { type: 'integer', minimum: 1 },
    },
  },
  response: {
    200: messageResponse,
    403: errorResponse,
  },
};

const brandingSchema = {
  response: {
    200: brandingResponse,
  },
};

const updateBrandingSchema = {
  body: {
    type: 'object',
    properties: {
      logo_light: { type: 'string' },
      logo_dark: { type: 'string' },
      favicon: { type: 'string' },
      primary_color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
      login_background: { type: 'string' },
    },
  },
  response: {
    200: messageResponse,
  },
};

const subscriptionSchema = {
  response: {
    200: subscriptionResponse,
  },
};

const auditLogSchema = {
  querystring: {
    type: 'object',
    additionalProperties: true,
    properties: {
      page: { type: 'integer', minimum: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100 },
      user_id: { type: 'string', format: 'uuid' },
      action: { type: 'string' },
      resource_type: { type: 'string' },
      start_date: { type: 'string', format: 'date-time' },
      end_date: { type: 'string', format: 'date-time' },
    },
  },
  // No response validation - let Fastify pass through
};

const verifyAuditSchema = {
  response: {
    200: verifyAuditResponse,
  },
};

interface AuthUser {
  id: string;
  tenantId: string;
  role: string;
  email: string;
}

// Default tenant settings
function getDefaultSettings() {
  return {
    asset_tag_prefix: 'AST',
    asset_tag_format: '{prefix}-{number:06d}',
    asset_tag_counter: 0,
    password_min_length: 12,
    password_require_upper: true,
    password_require_lower: true,
    password_require_number: true,
    password_require_symbol: true,
    password_max_age_days: 90,
    password_history_count: 5,
    mfa_required_for_admins: true,
    mfa_required_for_all: false,
    mfa_methods: ['totp', 'passkey'],
    session_absolute_timeout_minutes: 15,
    session_idle_timeout_minutes: 5,
    max_concurrent_sessions: 5,
    ip_allowlist_enabled: false,
    ip_allowlist_cidrs: [],
    sso_enabled: false,
    sso_provider: null,
    sso_entity_id: null,
    sso_sso_url: null,
    sso_slo_url: null,
    sso_jit_provisioning: true,
    audit_log_retention_days: 730,
    asset_history_retention_days: 2555,
    deleted_user_retention_days: 30,
    export_retention_days: 90,
    backup_retention_days: 30,
  };
}

export async function adminRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // Tenant settings - read from Tenant.settings JSON field
  api.get('/settings', { schema: settingsSchema }, async (request, reply) => {
    const user = request.user as AuthUser | undefined;
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'TENANT_ADMIN')) {
      return reply.code(403).send({ error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' });
    }

    const tenant = await app.prisma.tenant.findUnique({
      where: { id: request.tenantId! },
      select: { settings: true },
    });

    if (!tenant) {
      return reply.code(404).send({ error: 'Tenant not found', code: 'NOT_FOUND' });
    }

    const defaultSettings = getDefaultSettings();
    const storedSettings = (tenant.settings as any) || {};
    const mergedSettings = { ...defaultSettings, ...storedSettings, asset_tag_counter: 0 };

    return mergedSettings;
  });

  api.patch('/settings', { schema: updateSettingsSchema }, async (request, reply) => {
    const user = request.user as AuthUser | undefined;
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'TENANT_ADMIN')) {
      return reply.code(403).send({ error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' });
    }

    // Read current settings
    const tenant = await app.prisma.tenant.findUnique({
      where: { id: request.tenantId! },
      select: { settings: true },
    });

    const currentSettings = (tenant?.settings as any) || {};
    const mergedSettings = { ...currentSettings, ...request.body };

    await app.prisma.tenant.update({
      where: { id: request.tenantId! },
      data: { settings: mergedSettings },
    });

    return { message: 'Settings updated successfully' };
  });

  // Branding
  api.get('/branding', { schema: brandingSchema }, async (request) => {
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

  api.patch('/branding', { schema: updateBrandingSchema }, async (request, reply) => {
    const user = request.user as AuthUser | undefined;
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'TENANT_ADMIN')) {
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
  api.get('/subscription', { schema: subscriptionSchema }, async (request) => {
    const tenant = await app.prisma.tenant.findUnique({
      where: { id: request.tenantId! },
      select: { plan: true, max_assets: true, max_users: true, max_storage_gb: true },
    });

    const [assetsUsed, usersUsed] = await Promise.all([
      app.prisma.asset.count({ where: { tenant_id: request.tenantId!, deleted_at: null } }),
      app.prisma.user.count({ where: { tenant_id: request.tenantId!, deleted_at: null } }),
    ]);

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
  api.get('/audit-log', { schema: auditLogSchema }, async (request) => {
    const user = request.user as AuthUser | undefined;
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'TENANT_ADMIN')) {
      return { data: [], pagination: { page: 1, limit: 50, total: 0, total_pages: 0 } };
    }

    const { page, limit, user_id, action, resource_type, start_date, end_date } = request.query as any;
    const tenantId = request.tenantId!;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;

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
      app.prisma.auditLog.findMany({ where, skip: (pageNum - 1) * limitNum, take: limitNum, orderBy: { created_at: 'desc' } }),
      app.prisma.auditLog.count({ where }),
    ]);

    return { data: logs, pagination: { page: pageNum, limit: limitNum, total, total_pages: Math.ceil(total / limitNum) } };
  });

  // Verify integrity
  api.post('/audit-log/verify', { schema: verifyAuditSchema }, async (request, reply) => {
    const user = request.user as AuthUser | undefined;
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'TENANT_ADMIN')) {
      return reply.code(403).send({ error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' });
    }

    const logs = await app.prisma.auditLog.findMany({
      where: { tenant_id: request.tenantId! },
      orderBy: { created_at: 'asc' },
    });

    let previousHash: string | null = null;
    const tampered: any[] = [];

    const crypto = await import('crypto');

    for (const log of logs) {
      const data = `${log.id}|${log.tenant_id}|${log.user_id || ''}|${log.action}|${log.resource_type}|${log.resource_id || ''}|${JSON.stringify(log.old_values)}|${JSON.stringify(log.new_values)}|${log.ip_address || ''}|${log.user_agent || ''}|${JSON.stringify(log.metadata)}|${previousHash || ''}`;
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
}