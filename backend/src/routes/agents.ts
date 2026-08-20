// backend/src/routes/agents.ts
// Agent routes - using inline JSON schemas for Fastify compatibility

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import crypto from 'crypto';

// ============================================
// Zod Schemas for validation (input only)
// ============================================

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

const agentsListResponse = {
  type: 'object',
  properties: {
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          asset_id: { type: 'string', nullable: true },
          enrollment_token: { type: 'string' },
          hostname: { type: 'string', nullable: true },
          os: { type: 'string', nullable: true },
          os_version: { type: 'string', nullable: true },
          agent_version: { type: 'string', nullable: true },
          status: { type: 'string' },
          last_seen: { type: 'string', nullable: true },
          enrolled_at: { type: 'string' },
          asset: { type: 'object', properties: { id: { type: 'string' }, asset_tag: { type: 'string' } }, nullable: true },
        },
        required: ['id', 'asset_id', 'enrollment_token', 'hostname', 'os', 'os_version', 'agent_version', 'status', 'last_seen', 'enrolled_at', 'asset'],
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

const agentDetailResponse = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    asset_id: { type: 'string', nullable: true },
    enrollment_token: { type: 'string' },
    hostname: { type: 'string', nullable: true },
    os: { type: 'string', nullable: true },
    os_version: { type: 'string', nullable: true },
    agent_version: { type: 'string', nullable: true },
    status: { type: 'string' },
    last_seen: { type: 'string', nullable: true },
    last_ip: { type: 'string', nullable: true },
    enrolled_at: { type: 'string' },
    enrolled_by: { type: 'object', properties: { id: { type: 'string' }, first_name: { type: 'string' }, last_name: { type: 'string' } }, nullable: true },
    sync_interval_seconds: { type: 'number' },
    data_categories: { type: 'array', items: { type: 'string' } },
    privacy_mode: { type: 'boolean' },
    auto_update: { type: 'boolean' },
    asset: { type: 'object', properties: { id: { type: 'string' }, asset_tag: { type: 'string' } }, nullable: true },
    hardware: { type: 'object', nullable: true },
    software: { type: 'array', items: { type: 'object' }, nullable: true },
  },
  required: ['id', 'asset_id', 'enrollment_token', 'hostname', 'os', 'os_version', 'agent_version', 'status', 'last_seen', 'last_ip', 'enrolled_at', 'enrolled_by', 'sync_interval_seconds', 'data_categories', 'privacy_mode', 'auto_update', 'asset', 'hardware', 'software'],
};

const createAgentResponse = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    enrollment_token: { type: 'string' },
  },
  required: ['id', 'enrollment_token'],
};

const regenerateTokenResponse = {
  type: 'object',
  properties: {
    enrollment_token: { type: 'string' },
  },
  required: ['enrollment_token'],
};

const agentLogsResponse = {
  type: 'object',
  properties: {
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          received_at: { type: 'string' },
          ip_address: { type: 'string', nullable: true },
          data: { type: 'object' },
        },
        required: ['id', 'received_at', 'ip_address', 'data'],
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

const agentSoftwareResponse = {
  type: 'object',
  properties: {
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          version: { type: 'string', nullable: true },
          publisher: { type: 'string', nullable: true },
          install_date: { type: 'string', nullable: true },
          size: { type: 'number', nullable: true },
          usage_percent: { type: 'number', nullable: true },
          last_used: { type: 'string', nullable: true },
          category: { type: 'string', nullable: true },
          is_authorized: { type: 'boolean' },
        },
        required: ['id', 'name', 'version', 'publisher', 'install_date', 'size', 'usage_percent', 'last_used', 'category', 'is_authorized'],
      },
    },
  },
  required: ['data'],
};

// ============================================
// Route Schemas
// ============================================

const listAgentsSchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100 },
      status: { type: 'string' },
      os: { type: 'string' },
    },
  },
  response: { 200: agentsListResponse },
};

const getAgentSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  response: {
    200: agentDetailResponse,
    404: errorResponse,
  },
};

const createAgentSchema = {
  body: {
    type: 'object',
    properties: {
      asset_id: { type: 'string', format: 'uuid' },
      hostname: { type: 'string' },
      os: { type: 'string', enum: ['windows', 'macos', 'linux'] },
      sync_interval_seconds: { type: 'integer', minimum: 1 },
      data_categories: { type: 'array', items: { type: 'string', enum: ['hardware', 'software', 'network', 'security'] } },
      privacy_mode: { type: 'boolean' },
      auto_update: { type: 'boolean' },
    },
  },
  response: { 201: createAgentResponse },
};

const updateAgentSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  body: {
    type: 'object',
    properties: {
      sync_interval_seconds: { type: 'integer', minimum: 1 },
      data_categories: { type: 'array', items: { type: 'string', enum: ['hardware', 'software', 'network', 'security'] } },
      privacy_mode: { type: 'boolean' },
      auto_update: { type: 'boolean' },
      status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'REVOKED'] },
    },
  },
  response: {
    200: messageResponse,
    404: errorResponse,
  },
};

const deleteAgentSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  response: {
    200: messageResponse,
    404: errorResponse,
  },
};

const regenerateTokenSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  response: {
    200: regenerateTokenResponse,
    404: errorResponse,
  },
};

const agentLogsSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100 },
      start_date: { type: 'string', format: 'date-time' },
      end_date: { type: 'string', format: 'date-time' },
    },
  },
  response: { 200: agentLogsResponse },
};

const agentSoftwareSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  querystring: {
    type: 'object',
    properties: {
      search: { type: 'string' },
      category: { type: 'string' },
      authorized_only: { type: 'boolean' },
    },
  },
  response: { 200: agentSoftwareResponse },
};

export async function agentRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List agents
  api.get('/', { schema: listAgentsSchema }, async (request) => {
    const { page = 1, limit = 25, status, os } = request.query as { page: number; limit: number; status?: string; os?: string };
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
    const userId = (request.user as { id: string })?.id;

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

  // Update agent
  api.patch('/:id', { schema: updateAgentSchema }, async (request, reply) => {
    const tenantId = request.tenantId!;

    const agent = await app.prisma.agentEnrollment.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });

    if (!agent) {
      return reply.code(404).send({ error: 'Agent not found', code: 'NOT_FOUND' });
    }

    await app.prisma.agentEnrollment.update({
      where: { id: request.params.id },
      data: request.body,
    });

    return { message: 'Agent updated' };
  });

  // Delete agent
  api.delete('/:id', { schema: deleteAgentSchema }, async (request, reply) => {
    const tenantId = request.tenantId!;

    const agent = await app.prisma.agentEnrollment.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });

    if (!agent) {
      return reply.code(404).send({ error: 'Agent not found', code: 'NOT_FOUND' });
    }

    await app.prisma.agentEnrollment.delete({
      where: { id: request.params.id },
    });

    return { message: 'Agent enrollment deleted' };
  });

  // Regenerate token
  api.post('/:id/token', { schema: regenerateTokenSchema }, async (request, reply) => {
    const tenantId = request.tenantId!;

    const agent = await app.prisma.agentEnrollment.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });

    if (!agent) {
      return reply.code(404).send({ error: 'Agent not found', code: 'NOT_FOUND' });
    }

    const enrollmentToken = crypto.randomBytes(32).toString('hex');

    await app.prisma.agentEnrollment.update({
      where: { id: request.params.id },
      data: { enrollment_token: enrollmentToken },
    });

    return { enrollment_token: enrollmentToken };
  });

  // Agent logs
  api.get('/:id/logs', { schema: agentLogsSchema }, async (request, reply) => {
    const { page = 1, limit = 50, start_date, end_date } = request.query as { page: number; limit: number; start_date?: string; end_date?: string };
    const tenantId = request.tenantId!;

    const agent = await app.prisma.agentEnrollment.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });

    if (!agent) {
      return reply.code(404).send({ error: 'Agent not found', code: 'NOT_FOUND' });
    }

    const where: any = { agent_id: request.params.id };
    if (start_date || end_date) {
      where.received_at = {};
      if (start_date) where.received_at.gte = new Date(start_date);
      if (end_date) where.received_at.lte = new Date(end_date);
    }

    const [logs, total] = await Promise.all([
      app.prisma.agentHeartbeat.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { received_at: 'desc' },
      }),
      app.prisma.agentHeartbeat.count({ where }),
    ]);

    return { data: logs, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
  });

  // Agent software inventory
  api.get('/:id/software', { schema: agentSoftwareSchema }, async (request, reply) => {
    const { search, category, authorized_only } = request.query as { search?: string; category?: string; authorized_only?: boolean };
    const tenantId = request.tenantId!;

    const agent = await app.prisma.agentEnrollment.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });

    if (!agent) {
      return reply.code(404).send({ error: 'Agent not found', code: 'NOT_FOUND' });
    }

    const where: any = { agent_id: request.params.id };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (category) {
      where.category = category;
    }
    if (authorized_only) {
      where.is_authorized = true;
    }

    const software = await app.prisma.agentSoftware.findMany({
      where,
      orderBy: { detected_at: 'desc' },
      take: 200,
    });

    return { data: software };
  });
}

