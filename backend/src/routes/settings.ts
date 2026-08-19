// backend/src/routes/settings.ts
// Settings routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const settingItemSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.unknown(),
  scope: z.string(),
  description: z.string().nullable(),
  updated_at: z.string(),
});

const settingsListResponse = z.array(settingItemSchema);

const messageResponse = z.object({ message: z.string() });
const errorResponse = z.object({ error: z.string(), code: z.string() });

const listSettingsSchema = {
  querystring: z.object({
    scope: z.enum(['tenant', 'user', 'system']).default('tenant'),
  }),
  response: { 200: settingsListResponse },
};

const getSettingSchema = {
  params: z.object({ key: z.string() }),
  querystring: z.object({
    scope: z.enum(['tenant', 'user', 'system']).default('tenant'),
  }),
  response: { 200: settingItemSchema, 404: errorResponse },
};

const createSettingSchema = {
  body: z.object({
    key: z.string().min(1).max(100),
    value: z.unknown(),
    scope: z.enum(['tenant', 'user', 'system']).default('tenant'),
    description: z.string().optional().nullable(),
    user_id: z.string().uuid().optional(),
  }),
  response: { 201: settingItemSchema, 400: errorResponse },
};

const updateSettingSchema = {
  params: z.object({ key: z.string() }),
  querystring: z.object({
    scope: z.enum(['tenant', 'user', 'system']).default('tenant'),
  }),
  body: z.object({
    value: z.unknown().optional(),
    description: z.string().optional().nullable(),
  }),
  response: { 200: settingItemSchema, 400: errorResponse, 404: errorResponse },
};

const deleteSettingSchema = {
  params: z.object({ key: z.string() }),
  querystring: z.object({
    scope: z.enum(['tenant', 'user', 'system']).default('tenant'),
  }),
  response: { 200: messageResponse, 404: errorResponse },
};

const bulkUpdateSettingsSchema = {
  querystring: z.object({
    scope: z.enum(['tenant', 'user', 'system']).default('tenant'),
  }),
  body: z.object({
    settings: z.record(z.unknown()),
  }),
  response: { 200: z.object({ updated: z.number() }), 400: errorResponse },
};

export async function settingsRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // Get all settings
  api.get('/', listSettingsSchema, async (request) => {
    const { scope } = request.query;
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    const where: any = { tenant_id: tenantId, scope };
    if (scope === 'user') where.user_id = userId;

    const settings = await app.prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' },
    });

    return settings.map(s => ({
      ...s,
      updated_at: s.updated_at.toISOString(),
    }));
  });

  // Get setting by key
  api.get('/:key', getSettingSchema, async (request, reply) => {
    const { scope } = request.query;
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    const where: any = { tenant_id: tenantId, key: request.params.key, scope };
    if (scope === 'user') where.user_id = userId;

    const setting = await app.prisma.setting.findFirst({ where });

    if (!setting) {
      return reply.code(404).send({ error: 'Setting not found', code: 'NOT_FOUND' });
    }

    return { ...setting, updated_at: setting.updated_at.toISOString() };
  });

  // Create setting
  api.post('/', createSettingSchema, async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    const existing = await app.prisma.setting.findFirst({
      where: {
        tenant_id: tenantId,
        key: request.body.key,
        scope: request.body.scope,
        user_id: request.body.scope === 'user' ? request.body.user_id || userId : null,
      },
    });

    if (existing) {
      return reply.code(400).send({ error: 'Setting already exists', code: 'SETTING_EXISTS' });
    }

    const setting = await app.prisma.setting.create({
      data: {
        tenant_id: tenantId,
        ...request.body,
        user_id: request.body.scope === 'user' ? request.body.user_id || userId : null,
      },
    });

    return reply.code(201).send({ ...setting, updated_at: setting.updated_at.toISOString() });
  });

  // Update setting
  api.put('/:key', updateSettingSchema, async (request, reply) => {
    const { scope } = request.query;
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    const where: any = { tenant_id: tenantId, key: request.params.key, scope };
    if (scope === 'user') where.user_id = userId;

    const existing = await app.prisma.setting.findFirst({ where });
    if (!existing) {
      return reply.code(404).send({ error: 'Setting not found', code: 'NOT_FOUND' });
    }

    const updated = await app.prisma.setting.update({
      where: { id: existing.id },
      data: request.body,
    });

    return { ...updated, updated_at: updated.updated_at.toISOString() };
  });

  // Delete setting
  api.delete('/:key', deleteSettingSchema, async (request, reply) => {
    const { scope } = request.query;
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    const where: any = { tenant_id: tenantId, key: request.params.key, scope };
    if (scope === 'user') where.user_id = userId;

    const existing = await app.prisma.setting.findFirst({ where });
    if (!existing) {
      return reply.code(404).send({ error: 'Setting not found', code: 'NOT_FOUND' });
    }

    await app.prisma.setting.delete({ where: { id: existing.id } });

    return { message: 'Setting deleted' };
  });

  // Bulk update settings
  api.post('/bulk', bulkUpdateSettingsSchema, async (request, reply) => {
    const { scope } = request.query;
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    const where: any = { tenant_id: tenantId, scope };
    if (scope === 'user') where.user_id = userId;

    let updated = 0;
    for (const [key, value] of Object.entries(request.body.settings)) {
      const existing = await app.prisma.setting.findFirst({ where: { ...where, key } });
      if (existing) {
        await app.prisma.setting.update({
          where: { id: existing.id },
          data: { value, updated_at: new Date() },
        });
      } else {
        await app.prisma.setting.create({
          data: {
            tenant_id: tenantId,
            key,
            value,
            scope,
            user_id: scope === 'user' ? userId : null,
          },
        });
      }
      updated++;
    }

    return { updated };
  });
}