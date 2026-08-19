// backend/src/routes/agents.ts
// Agent routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import crypto from 'crypto';

// ============================================
// Zod Schemas
// ============================================

const agentListItemSchema = z.object({
  id: z.string(),
  asset_id: z.string().nullable(),
  enrollment_token: z.string(),
  hostname: z.string().nullable(),
  os: z.string().nullable(),
  os_version: z.string().nullable(),
  agent_version: z.string().nullable(),
  status: z.string(),
  last_seen: z.string().nullable(),
  enrolled_at: z.string(),
  asset: z.object({ id: z.string(), asset_tag: z.string() }).nullable(),
});

const agentsListResponse = z.object({
  data: z.array(agentListItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
});

const agentDetailResponse = z.object({
  id: z.string(),
  asset_id: z.string().nullable(),
  enrollment_token: z.string(),
  hostname: z.string().nullable(),
  os: z.string().nullable(),
  os_version: z.string().nullable(),
  agent_version: z.string().nullable(),
  status: z.string(),
  last_seen: z.string().nullable(),
  last_ip: z.string().nullable(),
  enrolled_at: z.string(),
  enrolled_by: z.object({ id: z.string(), first_name: z.string(), last_name: z.string() }).nullable(),
  sync_interval_seconds: z.number(),
  data_categories: z.array(z.string()),
  privacy_mode: z.boolean(),
  auto_update: z.boolean(),
  asset: z.object({ id: z.string(), asset_tag: z.string() }).nullable(),
  hardware: z.unknown().nullable(),
  software: z.array(z.unknown()).nullable(),
});

const createAgentInput = z.object({
  asset_id: z.string().uuid().optional(),
  hostname: z.string().optional(),
  os: z.enum(['windows', 'macos', 'linux']).optional(),
  sync_interval_seconds: z.number().int().positive().default(900),
  data_categories: z.array(z.enum(['hardware', 'software', 'network', 'security'])).default(['hardware', 'software', 'network', 'security']),
  privacy_mode: z.boolean().default(true),
  auto_update: z.boolean().default(true),
});

const updateAgentInput = z.object({
  sync_interval_seconds: z.number().int().positive().optional(),
  data_categories: z.array(z.enum(['hardware', 'software', 'network', 'security'])).optional(),
  privacy_mode: z.boolean().optional(),
  auto_update: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'REVOKED']).optional(),
});

const regenerateTokenResponse = z.object({ enrollment_token: z.string() });

const agentLogsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

const agentLogsResponse = z.object({
  data: z.array(z.object({
    id: z.string(),
    received_at: z.string(),
    ip_address: z.string().nullable(),
    data: z.unknown(),
  })),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
});

const agentSoftwareQuery = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  authorized_only: z.boolean().optional(),
});

const agentSoftwareResponse = z.object({
  data: z.array(z.object({
    id: z.string(),
    name: z.string(),
    version: z.string().nullable(),
    publisher: z.string().nullable(),
    install_date: z.string().nullable(),
    size: z.number().nullable(),
    usage_percent: z.number().nullable(),
    last_used: z.string().nullable(),
    category: z.string().nullable(),
    is_authorized: z.boolean(),
  })),
});

const createAgentResponse = z.object({ id: z.string(), enrollment_token: z.string() });
const messageResponse = z.object({ message: z.string() });
const errorResponse = z.object({ error: z.string(), code: z.string() });

// ============================================
// Route Handlers
// ============================================

const listAgentsSchema = {
  querystring: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(25),
    status: z.string().optional(),
    os: z.string().optional(),
  }),
  response: { 200: agentsListResponse },
};

const getAgentSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: agentDetailResponse, 404: z.object({ error: z.string(), code: z.string() }) },
};

const createAgentSchema = {
  body: createAgentInput,
  response: { 201: createAgentResponse },
};

const updateAgentSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: updateAgentInput,
  response: { 200: messageResponse, 404: z.object({ error: z.string(), code: z.string() }) },
};

const deleteAgentSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: messageResponse, 404: z.object({ error: z.string(), code: z.string() }) },
};

const regenerateTokenSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: regenerateTokenResponse, 404: z.object({ error: z.string(), code: z.string() }) },
};

const agentLogsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

const agentLogsSchema = {
  params: z.object({ id: z.string().uuid() }),
  querystring: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  }),
  response: { 200: agentLogsResponse },
};

const agentSoftwareQuery = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  authorized_only: z.boolean().optional(),
});

const agentSoftwareSchema = {
  params: z.object({ id: z.string().uuid() }),
  querystring: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    authorized_only: z.boolean().optional(),
  }),
  response: { 200: agentSoftwareResponse },
};

const messageResponse = z.object({ message: z.string() });
const errorResponse = z.object({ error: z.string(), code: z.string() });

export async function agentRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List agents
  api.get('/', { schema: listAgentsSchema }, async (request) => {
    const { page, limit, status, os } = request.query;
    const tenantId = request.tenantId!;

    const where: Record<string, unknown> = { tenant_id: tenantId };
    if (status) where.status = status;
    if (os) where.os = os;

    const [agents, total] = await Promise.all([
      app.prisma.agentEnrollment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { enrolled_at: 'desc' },
        include: { asset: { select: { id: true, asset_tag: true } } },
      }),
      app.prisma.agentEnrollment.count({ where }),
    ]);

    return { data: agents, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
  });

  // Get agent detail
  api.get('/:id', { schema: getAgentSchema }, async (request, reply) => {
    const agent = await app.prisma.agentEnrollment.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
      include: {
        asset: { select: { id: true, asset_tag: true } },
        enrolled_by: { select: { id: true, first_name: true, last_name: true } },
        heartbeats: { take: 10, orderBy: { received_at: 'desc' } },
        software: { take: 50, orderBy: { detected_at: 'desc' } },
      },
    });

    if (!agent) {
      return reply.code(404).send({ error: 'Agent not found', code: 'NOT_FOUND' });
    }

    return agent;
  });

  // Create enrollment
  api.post('/', { schema: createAgentSchema }, async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    const enrollmentToken = crypto.randomBytes(32).toString('hex');

    const enrollment = await app.prisma.agentEnrollment.create({
      data: {
        ...request.body,
        tenant_id: tenantId,
        enrollment_token: enrollmentToken,
        enrolled_by_id: userId,
      },
    });

    return reply.code(201).send({ id: enrollment.id, enrollment_token: enrollmentToken });
  });

  // Update enrollment
  api.patch('/:id', { schema: updateAgentSchema }, async (request, reply) => {
    const enrollment = await app.prisma.agentEnrollment.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
    });

    if (!enrollment) {
      return reply.code(404).send({ error: 'Agent not found', code: 'NOT_FOUND' });
    }

    await app.prisma.agentEnrollment.update({
      where: { id: request.params.id },
      data: request.body,
    });

    return { message: 'Agent updated' };
  });

  // Unenroll agent
  api.delete('/:id', { schema: deleteAgentSchema }, async (request, reply) => {
    const enrollment = await app.prisma.agentEnrollment.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
    });

    if (!enrollment) {
      return reply.code(404).send({ error: 'Agent not found', code: 'NOT_FOUND' });
    }

    await app.prisma.agentEnrollment.update({
      where: { id: request.params.id },
      data: { status: 'REVOKED', revoked_at: new Date(), revoked_by_id: request.user!.id },
    });

    await app.sendAgentCommand(enrollment.id, 'revoke', {});

    return { message: 'Agent revoked' };
  });

  // Regenerate token
  api.post('/:id/regenerate-token', { schema: regenerateTokenSchema }, async (request, reply) => {
    const enrollment = await app.prisma.agentEnrollment.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
    });

    if (!enrollment) {
      return reply.code(404).send({ error: 'Agent not found', code: 'NOT_FOUND' });
    }

    const newToken = crypto.randomBytes(32).toString('hex');
    await app.prisma.agentEnrollment.update({
      where: { id: request.params.id },
      data: { enrollment_token: newToken },
    });

    return { enrollment_token: newToken };
  });

  // Agent logs
  api.get('/:id/logs', { schema: agentLogsSchema }, async (request) => {
    const { page, limit, start_date, end_date } = request.query;

    const where: Record<string, unknown> = { enrollment_id: request.params.id };
    if (start_date || end_date) {
      where.received_at = {};
      if (start_date) (where.received_at as Record<string, Date>).gte = new Date(start_date);
      if (end_date) (where.received_at as Record<string, Date>).lte = new Date(end_date);
    }

    const [logs, total] = await Promise.all([
      app.prisma.agentHeartbeat.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { received_at: 'desc' } }),
      app.prisma.agentHeartbeat.count({ where }),
    ]);

    return { data: logs, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
  });

  // Agent software inventory
  api.get('/:id/software', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      querystring: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        authorized_only: z.boolean().optional(),
      }),
      response: { 200: agentSoftwareResponse },
    },
  }, async (request) => {
    const { search, category, authorized_only } = request.query;

    const where: Record<string, unknown> = { enrollment_id: request.params.id };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (category) where.category = category;
    if (authorized_only) where.is_authorized = true;

    const software = await app.prisma.agentSoftware.findMany({ where, orderBy: { name: 'asc' } });

    return { data: software };
  });
}

export { agentRoutes };