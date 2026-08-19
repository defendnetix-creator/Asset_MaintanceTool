// backend/src/routes/contracts.ts
// Contract routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const contractListItemSchema = z.object({
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
});

const contractsListResponse = z.object({
  data: z.array(contractListItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
});

const contractDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  contract_number: z.string(),
  type: z.string(),
  status: z.string(),
  vendor_id: z.string().nullable(),
  vendor_name: z.string().nullable(),
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
  owner_name: z.string().nullable(),
  created_by_id: z.string(),
  created_by_name: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  reminders: z.array(z.object({
    id: z.string(),
    type: z.string(),
    trigger_at: z.string(),
    sent_at: z.string().nullable(),
    recipient_ids: z.array(z.string()),
    channel: z.string(),
    status: z.string(),
  })),
  assets: z.array(z.object({
    id: z.string(),
    asset_tag: z.string(),
    name: z.string().nullable(),
  })),
});

const messageResponse = z.object({ message: z.string() });
const errorResponse = z.object({ error: z.string(), code: z.string() });

const listContractsSchema = {
  querystring: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(25),
    status: z.string().optional(),
    type: z.string().optional(),
    vendor_id: z.string().uuid().optional(),
    expiring_within_days: z.coerce.number().int().positive().optional(),
  }),
  response: { 200: contractsListResponse },
};

const getContractSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: contractDetailSchema, 404: errorResponse },
};

const createContractSchema = {
  body: z.object({
    name: z.string().min(1).max(200),
    contract_number: z.string().min(1).max(50),
    type: z.enum(['lease', 'maintenance', 'warranty', 'service', 'software', 'vendor']),
    status: z.enum(['ACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'TERMINATED']).default('ACTIVE'),
    vendor_id: z.string().uuid().optional(),
    customer_id: z.string().optional(),
    customer_name: z.string().optional(),
    customer_email: z.string().email().optional(),
    value: z.number().optional(),
    currency: z.string().default('USD'),
    billing_cycle: z.enum(['monthly', 'quarterly', 'annually']).optional(),
    auto_renew: z.boolean().default(false),
    start_date: z.string().datetime(),
    end_date: z.string().datetime().optional(),
    renewal_date: z.string().datetime().optional(),
    notice_period_days: z.number().int().positive().default(30),
    terms: z.string().optional(),
    sla_terms: z.string().optional(),
    owner_id: z.string().uuid().optional(),
    asset_ids: z.array(z.string().uuid()).optional(),
    reminders: z.array(z.object({
      type: z.string(),
      trigger_at: z.string().datetime(),
      recipient_ids: z.array(z.string().uuid()),
      channel: z.enum(['EMAIL', 'SMS', 'IN_APP', 'WEBHOOK', 'SLACK', 'TEAMS']).default('EMAIL'),
    })).optional(),
  }),
  response: { 201: contractDetailSchema, 400: errorResponse },
};

const updateContractSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    type: z.enum(['lease', 'maintenance', 'warranty', 'service', 'software', 'vendor']).optional(),
    status: z.enum(['ACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'TERMINATED']).optional(),
    vendor_id: z.string().uuid().optional().nullable(),
    customer_id: z.string().optional().nullable(),
    customer_name: z.string().optional().nullable(),
    customer_email: z.string().email().optional().nullable(),
    value: z.number().optional().nullable(),
    currency: z.string().optional(),
    billing_cycle: z.enum(['monthly', 'quarterly', 'annually']).optional().nullable(),
    auto_renew: z.boolean().optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional().nullable(),
    renewal_date: z.string().datetime().optional().nullable(),
    notice_period_days: z.number().int().positive().optional(),
    terms: z.string().optional().nullable(),
    sla_terms: z.string().optional().nullable(),
    owner_id: z.string().uuid().optional().nullable(),
    asset_ids: z.array(z.string().uuid()).optional(),
  }),
  response: { 200: contractDetailSchema, 400: errorResponse, 404: errorResponse },
};

const deleteContractSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: messageResponse, 404: errorResponse },
};

const contractReminderSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    type: z.enum(['expiry', 'renewal', 'payment', 'review']),
    trigger_at: z.string().datetime(),
    recipient_ids: z.array(z.string().uuid()),
    channel: z.enum(['EMAIL', 'SMS', 'IN_APP', 'WEBHOOK', 'SLACK', 'TEAMS']).default('EMAIL'),
  }),
  response: { 201: z.object({ id: z.string() }), 400: errorResponse, 404: errorResponse },
};

export async function contractRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List contracts
  api.get('/', listContractsSchema, async (request) => {
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

    return {
      data: contracts.map(c => ({
        ...c,
        vendor_name: c.vendor?.name || null,
        value: c.value ? Number(c.value) : null,
      })),
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
  });

  // Create contract
  api.post('/', createContractSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    // Check contract_number uniqueness
    const existing = await app.prisma.contract.findFirst({
      where: { tenant_id: tenantId, contract_number: request.body.contract_number },
    });
    if (existing) {
      return reply.code(400).send({ error: 'Contract number already exists', code: 'CONTRACT_NUMBER_EXISTS' });
    }

    const { asset_ids, reminders, ...data } = request.body;

    const contract = await app.prisma.contract.create({
      data: {
        tenant_id: tenantId,
        ...data,
        value: data.value ? data.value : undefined,
        assets: asset_ids?.length ? {
          connect: asset_ids.map(id => ({ id })),
        } : undefined,
        reminders: reminders?.length ? {
          create: reminders.map(r => ({
            ...r,
            trigger_at: new Date(r.trigger_at),
            status: 'PENDING',
          })),
        } : undefined,
      },
    });

    return reply.code(201).send({
      ...contract,
      vendor_name: null,
      value: contract.value ? Number(contract.value) : null,
      reminders: [],
      assets: [],
    });
  });

  // Get contract
  api.get('/:id', getContractSchema, async (request, reply) => {
    const contract = await app.prisma.contract.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
      include: {
        vendor: { select: { id: true, name: true } },
        owner: { select: { id: true, first_name: true, last_name: true } },
        created_by: { select: { id: true, first_name: true, last_name: true } },
        reminders: { orderBy: { trigger_at: 'asc' } },
        assets: { select: { id: true, asset_tag: true, name: true } },
      },
    });

    if (!contract) {
      return reply.code(404).send({ error: 'Contract not found', code: 'NOT_FOUND' });
    }

    return {
      ...contract,
      vendor_name: contract.vendor?.name || null,
      owner_name: contract.owner ? `${contract.owner.first_name} ${contract.owner.last_name}` : null,
      created_by_name: contract.created_by ? `${contract.created_by.first_name} ${contract.created_by.last_name}` : null,
      value: contract.value ? Number(contract.value) : null,
    };
  });

  // Update contract
  api.put('/:id', updateContractSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.contract.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Contract not found', code: 'NOT_FOUND' });
    }

    const { asset_ids, reminders, ...data } = request.body;

    const updated = await app.prisma.contract.update({
      where: { id: request.params.id },
      data: {
        ...data,
        value: data.value ? data.value : undefined,
        assets: asset_ids ? {
          set: asset_ids.map(id => ({ id })),
        } : undefined,
      },
      include: {
        vendor: { select: { id: true, name: true } },
        owner: { select: { id: true, first_name: true, last_name: true } },
        created_by: { select: { id: true, first_name: true, last_name: true } },
        reminders: { orderBy: { trigger_at: 'asc' } },
        assets: { select: { id: true, asset_tag: true, name: true } },
      },
    });

    return {
      ...updated,
      vendor_name: updated.vendor?.name || null,
      owner_name: updated.owner ? `${updated.owner.first_name} ${updated.owner.last_name}` : null,
      created_by_name: updated.created_by ? `${updated.created_by.first_name} ${updated.created_by.last_name}` : null,
      value: updated.value ? Number(updated.value) : null,
    };
  });

  // Delete contract
  api.delete('/:id', deleteContractSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.contract.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Contract not found', code: 'NOT_FOUND' });
    }

    await app.prisma.contract.update({
      where: { id: request.params.id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Contract deleted' };
  });

  // Add reminder
  api.post('/:id/reminders', contractReminderSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const contract = await app.prisma.contract.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!contract) {
      return reply.code(404).send({ error: 'Contract not found', code: 'NOT_FOUND' });
    }

    const reminder = await app.prisma.contractReminder.create({
      data: {
        contract_id: request.params.id,
        type: request.body.type,
        trigger_at: new Date(request.body.trigger_at),
        recipient_ids: request.body.recipient_ids,
        channel: request.body.channel,
        status: 'PENDING',
      },
    });

    return reply.code(201).send(reminder);
  });
}