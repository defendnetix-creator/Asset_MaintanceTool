// backend/src/routes/settings.ts
// Settings routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function settingsRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // Get all settings
  api.get('/', {
    schema: {
      querystring: z.object({
        scope: z.enum(['tenant', 'user', 'system']).default('tenant'),
      }),
      response: {
        200: z.array(z.object({
          id: z.string(),
          key: z.string(),
          value: z.unknown(),
          scope: z.string(),
          description: z.string().nullable(),
          updated_at: z.string(),
        })),
      },
    }, async (request) => {
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
  api.get('/:key', {
    schema: {
      params: z.object({ key: z.string() }),
      querystring: z.object({
        scope: z.enum(['tenant', 'user', 'system']).default('tenant'),
      }),
      response: {
        200: z.object({
          id: z.string(),
          key: z.string(),
          value: z.unknown(),
          scope: z.string(),
          description: z.string().nullable(),
          updated_at: z.string(),
        }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
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

  // Set setting
  api.put('/:key', {
    schema: {
      params: z.object({ key: z.string() }),
      querystring: z.object({
        scope: z.enum(['tenant', 'user', 'system']).default('tenant'),
      }),
      body: z.object({
        value: z.unknown(),
        description: z.string().optional(),
      }),
      response: {
        200: z.object({ message: z.string() }),
      },
    }, async (request, reply) => {
      const { scope } = request.query;
      const tenantId = request.tenantId!;
      const userId = request.user!.id;

      const where: any = { tenant_id: tenantId, key: request.params.key, scope };
      if (scope === 'user') where.user_id = userId;

      const setting = await app.prisma.setting.findFirst({ where });

      if (setting) {
        await app.prisma.setting.update({
          where: { id: setting.id },
          data: { value: request.body.value, description: request.body.description },
        });
      } else {
        await app.prisma.setting.create({
          data: {
            tenant_id: tenantId,
            scope,
            key: request.params.key,
            value: request.body.value,
            description: request.body.description,
            user_id: scope === 'user' ? userId : null,
          },
        });
      }

      return { message: 'Setting saved' };
    });

  // Delete setting
  api.delete('/:key', {
    schema: {
      params: z.object({ key: z.string() }),
      querystring: z.object({
        scope: z.enum(['tenant', 'user', 'system']).default('tenant'),
      }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const { scope } = request.query;
      const tenantId = request.tenantId!;
      const userId = request.user!.id;

      const where: any = { tenant_id: tenantId, key: request.params.key, scope };
      if (scope === 'user') where.user_id = userId;

      const setting = await app.prisma.setting.findFirst({ where });

      if (!setting) {
        return reply.code(404).send({ error: 'Setting not found', code: 'NOT_FOUND' });
      }

      await app.prisma.setting.delete({ where: { id: setting.id } });

      return { message: 'Setting deleted' };
    });

  // Bulk update settings
  api.post('/bulk', {
    schema: {
      body: z.object({
        settings: z.array(z.object({
          key: z.string(),
          value: z.unknown(),
          scope: z.enum(['tenant', 'user', 'system']).default('tenant'),
          description: z.string().optional(),
        })).min(1).max(50),
      }),
      response: {
        200: z.object({
          updated: z.number(),
          created: z.number(),
        }),
      },
    }, async (request, reply) => {
      const tenantId = request.tenantId!;
      const userId = request.user!.id;

      let updated = 0, created = 0;

      for (const setting of request.body.settings) {
        const where: any = { tenant_id: tenantId, key: setting.key, scope: setting.scope };
        if (setting.scope === 'user') where.user_id = request.user!.id;

        const existing = await app.prisma.setting.findFirst({ where });

        if (existing) {
          await app.prisma.setting.update({
            where: { id: existing.id },
            data: { value: setting.value, description: setting.description },
          });
          updated++;
        } else {
          await app.prisma.setting.create({
            data: {
              tenant_id: tenantId,
              scope: setting.scope,
              key: setting.key,
              value: setting.value,
              description: setting.description,
              user_id: setting.scope === 'user' ? userId : null,
            },
          });
          created++;
        }
      }

      return { updated, created };
    });

  // Export settings
  api.get('/export', {
    schema: {
      querystring: z.object({
        scope: z.enum(['tenant', 'user', 'system']).default('tenant'),
      }),
    }, async (request, reply) => {
      const { scope } = request.query;
      const tenantId = request.tenantId!;
      const userId = request.user!.id;

      const where: any = { tenant_id: tenantId, scope };
      if (scope === 'user') where.user_id = userId;

      const settings = await app.prisma.setting.findMany({ where });

      const exportData = settings.map(s => ({
        key: s.key,
        value: s.value,
        scope: s.scope,
        description: s.description,
      }));

      return reply
        .header('Content-Type', 'application/json')
        .header('Content-Disposition', `attachment; filename="settings-${scope}-${Date.now()}.json"`)
        .send(JSON.stringify(exportData, null, 2));
    });

  // Import settings
  api.post('/import', {
    schema: {
      body: z.object({
        settings: z.array(z.object({
          key: z.string(),
          value: z.unknown(),
          scope: z.enum(['tenant', 'user', 'system']).default('tenant'),
          description: z.string().optional(),
        })).min(1).max(100),
        overwrite: z.boolean().default(true),
      }),
      response: {
        200: z.object({
          imported: z.number(),
          skipped: z.number(),
          errors: z.array(z.object({ key: z.string(), error: z.string() })),
        }),
      },
    }, async (request, reply) => {
      const tenantId = request.tenantId!;
      const userId = request.user!.id;

      let imported = 0, skipped = 0;
      const errors = [];

      for (const setting of request.body.settings) {
        try {
          const where: any = { tenant_id: tenantId, key: setting.key, scope: setting.scope };
          if (setting.scope === 'user') where.user_id = request.user!.id;

          const existing = await app.prisma.setting.findFirst({ where });

          if (existing && !request.body.overwrite) {
            skipped++;
            continue;
          }

          if (existing) {
            await app.prisma.setting.update({
              where: { id: existing.id },
              data: { value: setting.value, description: setting.description },
            });
          } else {
            await app.prisma.setting.create({
              data: {
                tenant_id: tenantId,
                scope: setting.scope,
                key: setting.key,
                value: setting.value,
                description: setting.description,
                user_id: setting.scope === 'user' ? userId : null,
              },
            });
          }
          imported++;
        } catch (e) {
          errors.push({ key: setting.key, error: e instanceof Error ? e.message : 'Unknown error' });
        }
      }

      return { imported, skipped: skipped, errors };
    });

export { settingsRoutes };