// backend/src/routes/webhooks.ts
// Webhook routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import crypto from 'crypto';

// Type definitions for route parameters
interface WebhookParams {
  id: string;
}

interface WebhookQuery {
  page?: number;
  limit?: number;
  status?: string;
}

interface WebhookBody {
  name: string;
  url: string;
  events: string[];
  retry_policy?: {
    max_attempts?: number;
    backoff?: 'exponential' | 'fixed';
    delay?: number;
  };
  timeout_ms?: number;
}

interface WebhookUpdateBody {
  name?: string;
  url?: string;
  events?: string[];
  is_active?: boolean;
  retry_policy?: {
    max_attempts?: number;
    backoff?: 'exponential' | 'fixed';
    delay?: number;
  };
  timeout_ms?: number;
}

interface TestWebhookBody {
  event: string;
  payload?: any;
}

const webhookListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  events: z.array(z.string()),
  is_active: z.boolean(),
  last_triggered: z.string().nullable(),
  last_status: z.string().nullable(),
  created_at: z.string(),
});

const webhooksListResponse = z.object({
  data: z.array(webhookListItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
});

const webhookDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  events: z.array(z.string()),
  secret: z.string(),
  is_active: z.boolean(),
  retry_policy: z.unknown().nullable(),
  last_triggered: z.string().nullable(),
  last_status: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const webhookDeliveryLogSchema = z.object({
  id: z.string(),
  event: z.string(),
  payload: z.unknown(),
  status_code: z.number().nullable(),
  response_body: z.string().nullable(),
  latency_ms: z.number(),
  attempt: z.number(),
  error: z.string().nullable(),
  created_at: z.string(),
});

const messageResponse = z.object({ message: z.string() });
const errorResponse = z.object({ error: z.string(), code: z.string() });

const listWebhooksSchema = {
  querystring: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(25),
    status: z.string().optional(),
  }),
  response: { 200: webhooksListResponse },
};

const getWebhookSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: webhookDetailSchema, 404: errorResponse },
};

const createWebhookSchema = {
  body: z.object({
    name: z.string().min(1).max(100),
    url: z.string().url(),
    events: z.array(z.string()).min(1),
    retry_policy: z.object({
      max_attempts: z.number().int().positive().max(10).default(5),
      backoff: z.enum(['exponential', 'fixed']).default('exponential'),
      delay: z.number().int().positive().default(5000),
    }).optional(),
    timeout_ms: z.number().int().positive().max(120000).default(30000),
  }),
  response: { 201: webhookDetailSchema, 400: errorResponse },
};

const updateWebhookSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    url: z.string().url().optional(),
    events: z.array(z.string()).min(1).optional(),
    is_active: z.boolean().optional(),
    retry_policy: z.object({
      max_attempts: z.number().int().positive().max(10).default(5),
      backoff: z.enum(['exponential', 'fixed']).default('exponential'),
      delay: z.number().int().positive().default(5000),
    }).optional(),
    timeout_ms: z.number().int().positive().max(120000).default(30000).optional(),
  }),
  response: { 200: webhookDetailSchema, 400: errorResponse, 404: errorResponse },
};

const deleteWebhookSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: messageResponse, 404: errorResponse },
};

const testWebhookSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    event: z.string(),
    payload: z.unknown().optional(),
  }),
  response: { 200: z.object({ success: z.boolean(), latency_ms: z.number() }), 400: errorResponse, 404: errorResponse },
};

const listWebhookDeliveriesSchema = {
  params: z.object({ id: z.string().uuid() }),
  querystring: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(25),
    status: z.string().optional(),
  }),
  response: {
    200: z.object({
      data: z.array(webhookDeliveryLogSchema),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        total_pages: z.number(),
      }),
    }),
    404: errorResponse,
  },
};

const regenerateSecretSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: z.object({ secret: z.string() }), 404: errorResponse },
};

export async function webhookRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List webhooks
  api.get('/', listWebhooksSchema, async (request) => {
    const { page, limit, status } = request.query as WebhookQuery;
    const tenantId = request.tenantId!;

    const where: any = { tenant_id: tenantId };
    if (status) where.is_active = status === 'active';

    const [webhooks, total] = await Promise.all([
      app.prisma.webhook.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      app.prisma.webhook.count({ where }),
    ]);

    return { data: webhooks, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
  });

  // Get webhook
  api.get('/:id', getWebhookSchema, async (request, reply) => {
    const { id } = request.params as WebhookParams;
    const webhook = await app.prisma.webhook.findFirst({
      where: { id, tenant_id: request.tenantId! },
    });

    if (!webhook) {
      return reply.status(404).send({ error: 'Webhook not found', code: 'NOT_FOUND' });
    }

    return webhook;
  });

  // Create webhook
  api.post('/', createWebhookSchema, async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = (request.user as { id: string }).id;

    // Generate secret
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await app.prisma.webhook.create({
      data: {
        tenant_id: tenantId,
        created_by_id: userId,
        secret,
        ...request.body,
      },
    });

    return reply.status(201).send(webhook);
  });

  // Update webhook
  api.put('/:id', updateWebhookSchema, async (request, reply) => {
    const tenantId = request.tenantId!;
    const { id } = request.params as WebhookParams;

    const existing = await app.prisma.webhook.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.status(404).send({ error: 'Webhook not found', code: 'NOT_FOUND' });
    }

    const updated = await app.prisma.webhook.update({
      where: { id },
      data: request.body as WebhookUpdateBody,
    });

    return updated;
  });

  // Delete webhook
  api.delete('/:id', deleteWebhookSchema, async (request, reply) => {
    const tenantId = request.tenantId!;
    const { id } = request.params as WebhookParams;

    const existing = await app.prisma.webhook.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.status(404).send({ error: 'Webhook not found', code: 'NOT_FOUND' });
    }

    await app.prisma.webhook.delete({
      where: { id },
    });

    return { message: 'Webhook deleted' };
  });

  // Test webhook
  api.post('/:id/test', testWebhookSchema, async (request, reply) => {
    const tenantId = request.tenantId!;
    const { id } = request.params as WebhookParams;

    const webhook = await app.prisma.webhook.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!webhook) {
      return reply.status(404).send({ error: 'Webhook not found', code: 'NOT_FOUND' });
    }

    const startTime = Date.now();
    const { event, payload } = request.body as TestWebhookBody;

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': crypto.createHmac('sha256', webhook.secret).update(JSON.stringify(payload || { test: true, timestamp: new Date().toISOString() })).digest('hex'),
          'X-Webhook-Event': event,
        },
        body: JSON.stringify(payload || { test: true, timestamp: new Date().toISOString() }),
        signal: AbortSignal.timeout(webhook.timeout_ms),
      });

      const latencyMs = Date.now() - startTime;

      await app.prisma.webhookDeliveryLog.create({
        data: {
          webhook_id: webhook.id,
          event,
          payload: payload || { test: true, timestamp: new Date().toISOString() },
          status_code: response.status,
          response_body: await response.text(),
          latency_ms: latencyMs,
          attempt: 1,
        },
      });

      return { success: response.ok, latency_ms: latencyMs };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;

      await app.prisma.webhookDeliveryLog.create({
        data: {
          webhook_id: webhook.id,
          event,
          payload: payload || { test: true, timestamp: new Date().toISOString() },
          status_code: 0,
          response_body: err.message,
          latency_ms: latencyMs,
          attempt: 1,
          error: err.message,
        },
      });

      return { success: false, latency_ms: latencyMs };
    }
  });

  // List webhook deliveries
  api.get('/:id/deliveries', listWebhookDeliveriesSchema, async (request, reply) => {
    const tenantId = request.tenantId!;
    const { id } = request.params as WebhookParams;

    const webhook = await app.prisma.webhook.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!webhook) {
      return reply.status(404).send({ error: 'Webhook not found', code: 'NOT_FOUND' });
    }

    const { page, limit, status } = request.query as WebhookQuery;
    const where: any = { webhook_id: id };
    if (status) where.status = status;

    const [deliveries, total] = await Promise.all([
      app.prisma.webhookDeliveryLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      app.prisma.webhookDeliveryLog.count({ where }),
    ]);

    return { data: deliveries, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
  });

  // Regenerate secret
  api.post('/:id/regenerate-secret', regenerateSecretSchema, async (request, reply) => {
    const tenantId = request.tenantId!;
    const { id } = request.params as WebhookParams;

    const webhook = await app.prisma.webhook.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!webhook) {
      return reply.status(404).send({ error: 'Webhook not found', code: 'NOT_FOUND' });
    }

    const secret = crypto.randomBytes(32).toString('hex');

    const updated = await app.prisma.webhook.update({
      where: { id },
      data: { secret },
    });

    return { secret: updated.secret };
  });
}