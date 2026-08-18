// backend/src/routes/contracts.ts
// Contract routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function contractRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List contracts
  api.get('/', {
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(25),
        status: z.string().optional(),
        type: z.string().optional(),
        vendor_id: z.string().uuid().optional(),
        expiring_within_days: z.coerce.number().int().positive().optional(),
      }),
      response: {
        200: z.object({
          data: z.array(z.object({
            id: z.string(),
            name: z.string(),
            contract_number: z.string(),
            type: z.string(),
            status: z.string(),
            vendor_id: z.string().nullable(),
            vendor_name: z.string().nullable(),
            customer_name: z.string().nullable(),
            value: z.number().nullable(),
            currency: z.string(),
            start_date: z.string(),
            end_date: z.string().nullable(),
            renewal_date: z.string().nullable(),
            auto_renew: z.boolean(),
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
      const { page, limit, status, type, vendor_id, expiring_within_days } = request.query;
      const tenantId = request.tenantId!;

      const where: any = { tenant_id: tenantId, deleted_at: null };
      if (status) where.status = status;
      if (type) where.type = type;
      if (vendor_id) where.vendor_id = vendor_id;
      if (expiring_within_days) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiring_within_days);
        where.end_date = { lte: expiryDate, gte: new Date() };
      }

      const [contracts, total] = await Promise.all([
        app.prisma.contract.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: {
            vendor: { select: { id: true, name: true } },
          },
        }),
        app.prisma.contract.count({ where }),
      ]);

      return { data: contracts, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
    });

  // Create contract
  api.post('/', {
    schema: {
      body: z.object({
        name: z.string().min(1).max(200),
        contract_number: z.string().min(1).max(50),
        type: z.enum(['lease', 'maintenance', 'warranty', 'service', 'software', 'vendor']),
        status: z.enum(['ACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'TERMINATED']).default('ACTIVE'),
        vendor_id: z.string().uuid().optional(),
        customer_id: z.string().uuid().optional(),
        customer_name: z.string().optional(),
        customer_email: z.string().email().optional(),
        value: z.number().nonnegative().optional(),
        currency: z.string().length(3).default('USD'),
        billing_cycle: z.enum(['monthly', 'quarterly', 'annually']).optional(),
        auto_renew: z.boolean().default(false),
        start_date: z.string().datetime(),
        end_date: z.string().datetime().optional(),
        renewal_date: z.string().datetime().optional(),
        notice_period_days: z.number().int().nonnegative().default(30),
        terms: z.string().optional(),
        sla_terms: z.string().optional(),
        owner_id: z.string().uuid().optional(),
      }),
      response: {
        201: z.object({ id: z.string(), contract_number: z.string() }),
        409: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const tenantId = request.tenantId!;
      const userId = request.user!.id;

      const existing = await app.prisma.contract.findFirst({
        where: { tenant_id: tenantId, contract_number: request.body.contract_number },
      });
      if (existing) {
        return reply.code(409).send({ error: 'Contract number already exists', code: 'DUPLICATE_CONTRACT_NUMBER' });
      }

      if (request.body.vendor_id) {
        const vendor = await app.prisma.vendor.findFirst({
          where: { id: request.body.vendor_id, tenant_id: tenantId },
        });
        if (!vendor) {
          return reply.code(400).send({ error: 'Vendor not found', code: 'INVALID_VENDOR' });
        }
      }

      const contract = await app.prisma.contract.create({
        data: {
          ...request.body,
          tenant_id: tenantId,
          created_by_id: request.user!.id,
        },
      });

      return reply.code(201).send({ id: contract.id, contract_number: contract.contract_number });
    });

  // Get contract detail
  api.get('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          id: z.string(),
          name: z.string(),
          contract_number: z.string(),
          type: z.string(),
          status: z.string(),
          vendor_id: z.string().nullable(),
          vendor: z.object({ id: z.string(), name: z.string() }).nullable(),
          customer_id: z.string().nullable(),
          customer_name: z.string().nullable(),
          customer_email: z.string().nullable(),
          value: z.number().nullable(),
          currency: z.string(),
          billing_cycle: z.string().nullable(),
          auto_renew: z.boolean(),
          start_date: z.string(),
          end_date: z.string().nullable(),
          renewal_date: z.string().nullable(),
          notice_period_days: z.number(),
          terms: z.string().nullable(),
          sla_terms: z.string().nullable(),
          owner_id: z.string().nullable(),
          owner: z.object({ id: z.string(), first_name: z.string(), last_name: z.string() }).nullable(),
          created_at: z.string(),
          updated_at: z.string(),
          assets: z.array(z.object({ id: z.string(), asset_tag: z.string(), make: z.string().nullable(), model: z.string().nullable() })),
          reminders: z.array(z.object({ id: z.string(), type: z.string(), trigger_at: z.string(), status: z.string() })),
        }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const contract = await app.prisma.contract.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId!, deleted_at: null },
        include: {
          vendor: { select: { id: true, name: true } },
          owner: { select: { id: true, first_name: true, last_name: true } },
          assets: { select: { id: true, asset_tag: true, make: true, model: true } },
          reminders: { orderBy: { trigger_at: 'asc' } },
        },
      });

      if (!contract) {
        return reply.code(404).send({ error: 'Contract not found', code: 'NOT_FOUND' });
      }

      return contract;
    });

  // Update contract
  api.patch('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        name: z.string().min(1).max(200).optional(),
        status: z.enum(['ACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'TERMINATED']).optional(),
        vendor_id: z.string().uuid().optional().nullable(),
        customer_id: z.string().uuid().optional().nullable(),
        customer_name: z.string().optional().nullable(),
        customer_email: z.string().email().optional().nullable(),
        value: z.number().nonnegative().optional().nullable(),
        currency: z.string().length(3).optional(),
        billing_cycle: z.enum(['monthly', 'quarterly', 'annually']).optional(),
        auto_renew: z.boolean().optional(),
        end_date: z.string().datetime().optional().nullable(),
        renewal_date: z.string().datetime().optional().nullable(),
        notice_period_days: z.number().int().nonnegative().optional(),
        terms: z.string().optional().nullable(),
        sla_terms: z.string().optional().nullable(),
        auto_renew: z.boolean().optional(),
        owner_id: z.string().uuid().optional().nullable(),
      }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const contract = await app.prisma.contract.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId!, deleted_at: null },
      });

      if (!contract) {
        return reply.code(404).send({ error: 'Contract not found', code: 'NOT_FOUND' });
      }

      await app.prisma.contract.update({
        where: { id: request.params.id },
        data: { ...request.body, updated_at: new Date() },
      });

      return { message: 'Contract updated' };
    });

  // Delete contract
  api.delete('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const contract = await app.prisma.contract.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId!, deleted_at: null },
      });

      if (!contract) {
        return reply.code(404).send({ error: 'Contract not found', code: 'NOT_FOUND' });
      }

      await app.prisma.contract.update({
        where: { id: request.params.id },
        data: { deleted_at: new Date() },
      });

      return { message: 'Contract deleted' };
    });

  // Contract reminders
  api.get('/:id/reminders', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.array(z.object({
          id: z.string(),
          type: z.string(),
          trigger_at: z.string(),
          sent_at: z.string().nullable(),
          recipient_ids: z.array(z.string()),
          channel: z.string(),
          status: z.string(),
          created_at: z.string(),
        })),
      },
    }, async (request) => {
      const reminders = await app.prisma.contractReminder.findMany({
        where: { contract_id: request.params.id },
        orderBy: { trigger_at: 'asc' },
      });

      return reminders;
    });

  // Add reminder
  api.post('/:id/reminders', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        type: z.enum(['expiry', 'renewal', 'payment', 'review']),
        trigger_at: z.string().datetime(),
        recipient_ids: z.array(z.string().uuid()).optional(),
        channel: z.enum(['EMAIL', 'SMS', 'IN_APP', 'WEBHOOK']).default('EMAIL'),
      }),
      response: {
        201: z.object({ id: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const contract = await app.prisma.contract.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId!, deleted_at: null },
      });

      if (!contract) {
        return reply.code(404).send({ error: 'Contract not found', code: 'NOT_FOUND' });
      }

      const reminder = await app.prisma.contractReminder.create({
        data: {
          contract_id: request.params.id,
          tenant_id: request.tenantId!,
          ...request.body,
        },
      });

      return reply.code(201).send({ id: reminder.id });
    });

  // Delete reminder
  api.delete('/:id/reminders/:reminderId', {
    schema: {
      params: z.object({ id: z.string().uuid(), reminderId: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const reminder = await app.prisma.contractReminder.findFirst({
        where: { id: request.params.reminderId, contract_id: request.params.id },
      });

      if (!reminder) {
        return reply.code(404).send({ error: 'Reminder not found', code: 'NOT_FOUND' });
      }

      await app.prisma.contractReminder.delete({ where: { id: request.params.reminderId } });

      return { message: 'Reminder deleted' };
    });

  // Contract assets
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

      const [assets, total] = await Promise.all([
        app.prisma.asset.findMany({
          where: { contracts: { some: { id: request.params.id } }, deleted_at: null },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { asset_tag: 'asc' },
          select: { id: true, asset_tag: true, make: true, model: true, status: true },
        }),
        app.prisma.asset.count({ where: { contracts: { some: { id: request.params.id } }, deleted_at: null } }),
      ]);

      return { data: assets, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
    });

  // Link asset to contract
  api.post('/:id/assets', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        asset_ids: z.array(z.string().uuid()).min(1),
      }),
      response: {
        201: z.object({ linked: z.number() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const contract = await app.prisma.contract.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId!, deleted_at: null },
      });

      if (!contract) {
        return reply.code(404).send({ error: 'Contract not found', code: 'NOT_FOUND' });
      }

      const assets = await app.prisma.asset.findMany({
        where: { id: { in: request.body.asset_ids }, tenant_id: request.tenantId!, deleted_at: null },
        select: { id: true },
      });

      const foundIds = new Set(assets.map(a => a.id));
      const missing = request.body.asset_ids.filter(id => !foundIds.has(id));

      if (missing.length > 0) {
        return reply.code(400).send({ error: 'Some assets not found', code: 'ASSETS_NOT_FOUND', missing });
      }

      await app.prisma.asset.updateMany({
        where: { id: { in: request.body.asset_ids } },
        data: { contracts: { connect: { id: request.params.id } } },
      });

      return reply.code(201).send({ linked: request.body.asset_ids.length });
    });

  // Unlink asset
  api.delete('/:id/assets/:assetId', {
    schema: {
      params: z.object({ id: z.string().uuid(), assetId: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      await app.prisma.asset.update({
        where: { id: request.params.assetId },
        data: { contracts: { disconnect: { id: request.params.id } } },
      });

      return { message: 'Asset unlinked from contract' };
    });

export { contractRoutes };