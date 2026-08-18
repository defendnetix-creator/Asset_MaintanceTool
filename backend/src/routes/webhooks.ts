// backend/src/routes/webhooks.ts
// Webhook routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import crypto from 'crypto';

export async function webhookRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List webhooks
  api.get('/', {
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(25),
        status: z.string().optional(),
      }),
      response: {
        200: z.object({
          data: z.array(z.object({
            id: z.string(),
            name: z.string(),
            url: z.string(),
            events: z.array(z.string()),
            is_active: z.boolean(),
            last_triggered: z.string().nullable(),
            last_status: z.string().nullable(),
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
      const { page, limit, status } = request.query;
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
  api.get('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
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
        }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const webhook = await app.prisma.webhook.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!webhook) {
        return reply.code(404).send({ error: 'Webhook not found', code: 'NOT_FOUND' });
      }

      return webhook;
    });

  // Create webhook
  api.post('/', {
    schema: {
      body: z.object({
        name: z.string().min(1).max(100),
        url: z.string().url(),
        events: z.array(z.enum([
          'asset.created', 'asset.updated', 'asset.deleted',
          'asset.checked_out', 'asset.checked_in',
          'maintenance.started', 'maintenance.completed', 'maintenance.overdue',
          'audit.session_started', 'audit.session_completed', 'audit.discrepancy_found',
          'user.invited', 'user.activated', 'user.role_changed',
          'contract.expiring', 'contract.renewed',
          'warranty.expiring', 'warranty.expired',
          'agent.online', 'agent.offline',
        ])).min(1),
        secret: z.string().optional(),
        retry_policy: z.object({
          max_attempts: z.number().int().positive().max(10).default(5),
          backoff_type: z.enum(['fixed', 'exponential']).default('exponential'),
          delay_ms: z.number().int().positive().default(5000),
          timeout_ms: z.number().int().positive().default(30000),
        }).optional(),
      }),
      response: {
        201: z.object({ id: z.string(), secret: z.string() }),
        400: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const tenantId = request.tenantId!;
      const userId = request.user!.id;

      const secret = request.body.secret || crypto.randomBytes(32).toString('hex');

      const webhook = await app.prisma.webhook.create({
        data: {
          ...request.body,
          tenant_id: tenantId,
          secret,
          created_by_id: request.user!.id,
        },
      });

      return reply.code(201).send({ id: webhook.id, secret: webhook.secret });
    });

  // Update webhook
  api.patch('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        name: z.string().min(1).max(100).optional(),
        url: z.string().url().optional(),
        events: z.array(z.enum([
          'asset.created', 'asset.updated', 'asset.deleted',
          'asset.checked_out', 'asset.checked_in',
          'maintenance.started', 'maintenance.completed', 'maintenance.overdue',
          'audit.session_started', 'audit.session_completed', 'audit.discrepancy_found',
          'user.invited', 'user.activated', 'user.role_changed',
          'contract.expiring', 'contract.renewed',
          'warranty.expiring', 'warranty.expired',
          'agent.online', 'agent.offline',
        ])).optional(),
        secret: z.string().optional(),
        is_active: z.boolean().optional(),
        retry_policy: z.object({
          max_attempts: z.number().int().positive().max(10),
          backoff_type: z.enum(['fixed', 'exponential']),
          delay_ms: z.number().int().positive(),
          timeout_ms: z.number().int().positive(),
        }).optional(),
      }),
      response: {
        200: z.object({ id: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const webhook = await app.prisma.webhook.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!webhook) {
        return reply.code(404).send({ error: 'Webhook not found', code: 'NOT_FOUND' });
      }

      const updated = await app.prisma.webhook.update({
        where: { id: request.params.id },
        data: request.body,
      });

      return { id: updated.id };
    });

  // Delete webhook
  api.delete('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const webhook = await app.prisma.webhook.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!webhook) {
        return reply.code(404).send({ error: 'Webhook not found', code: 'NOT_FOUND' });
      }

      await app.prisma.webhook.delete({ where: { id: request.params.id } });

      return { message: 'Webhook deleted' };
    });

  // Test webhook
  api.post('/:id/test', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        event: z.enum([
          'asset.created', 'asset.updated', 'asset.deleted',
          'asset.checked_out', 'asset.checked_in',
          'maintenance.started', 'maintenance.completed', 'maintenance.overdue',
          'audit.session_started', 'audit.session_completed', 'audit.discrepancy_found',
          'user.invited', 'user.activated', 'user.role_changed',
          'contract.expiring', 'contract.renewed',
          'warranty.expiring', 'warranty.expired',
          'agent.online', 'agent.offline',
        ]),
      }).optional(),
      response: {
        200: z.object({
          success: z.boolean(),
          status_code: z.number().nullable(),
          response_time_ms: z.number(),
          response_body: z.string().nullable(),
        }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const webhook = await app.prisma.webhook.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!webhook) {
        return reply.code(404).send({ error: 'Webhook not found', code: 'NOT_FOUND' });
      }

      const testEvent = request.body?.event || 'asset.created';
      const testPayload = {
        event: testEvent,
        timestamp: new Date().toISOString(),
        tenant_id: request.tenantId!,
        data: { test: true, message: 'This is a test webhook' },
      };

      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(testPayload))
        .digest('hex');

      const startTime = Date.now();
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Signature': `sha256=${signature}`,
            'X-Timestamp': Date.now().toString(),
            'User-Agent': 'AssetMT-Webhook/1.0',
          },
          body: JSON.stringify(testPayload),
          signal: AbortSignal.timeout(webhook.retry_policy?.timeout_ms || 30000),
        });

        const responseTime = Date.now() - startTime;
        const responseBody = await response.text();

        await app.prisma.webhookDeliveryLog.create({
          data: {
            webhook_id: webhook.id,
            event: testEvent,
            payload: testPayload,
            status_code: response.status,
            response_body: responseBody,
            latency_ms: responseTime,
            attempt: 1,
          },
        );

        return {
          success: response.ok,
          status_code: response.status,
          response_time_ms: responseTime,
          response_body: responseBody.slice(0, 1000),
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        await app.prisma.webhookDeliveryLog.create({
          data: {
            webhook_id: webhook.id,
            event: testEvent,
            payload: testPayload,
            status_code: 0,
            latency_ms: responseTime,
            attempt: 1,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        return {
          success: false,
          status_code: null,
          response_time_ms: responseTime,
          response_body: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

  // Webhook delivery logs
  api.get('/:id/logs', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(50),
        status: z.string().optional(),
        start_date: z.string().datetime().optional(),
        end_date: z.string().datetime().optional(),
      }),
      response: {
        200: z.object({
          data: z.array(z.object({
            id: z.string(),
            event: z.string(),
            status_code: z.number().nullable(),
            latency_ms: z.number(),
            attempt: z.number(),
            error: z.string().nullable(),
            created_at: z.string(),
          })),
          pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            total_pages: z.number(),
          }),
        }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request) => {
      const { page, limit, status, start_date, end_date } = request.query;

      const webhook = await app.prisma.webhook.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!webhook) {
        return { data: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } };
      }

      const where: any = { webhook_id: request.params.id };
      if (status) where.status_code = parseInt(status);
      if (start_date || end_date) {
        where.created_at = {};
        if (start_date) where.created_at.gte = new Date(start_date);
        if (end_date) where.created_at.lte = new Date(end_date);
      }

      const [logs, total] = await Promise.all([
        app.prisma.webhookDeliveryLog.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { created_at: 'desc' },
        }),
        app.prisma.webhookDeliveryLog.count({ where }),
      ]);

      return { data: logs, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
    });

  // Retry failed delivery
  api.post('/:id/logs/:logId/retry', {
    schema: {
      params: z.object({ id: z.string().uuid(), logId: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const log = await app.prisma.webhookDeliveryLog.findFirst({
        where: { id: request.params.logId, webhook_id: request.params.id },
      });

      if (!log) {
        return reply.code(404).send({ error: 'Log not found', code: 'NOT_FOUND' });
      }

      const webhook = await app.prisma.webhook.findUnique({ where: { id: request.params.id } });
      if (!webhook) {
        return reply.code(404).send({ error: 'Webhook not found', code: 'NOT_FOUND' });
      }

      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(log.payload))
        .digest('hex');

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Signature': `sha256=${signature}`,
            'X-Timestamp': log.payload.timestamp || Date.now().toString(),
            'X-Idempotency-Key': log.id,
            'User-Agent': 'AssetMT-Webhook/1.0 (retry)',
          },
          body: JSON.stringify(log.payload),
          signal: AbortSignal.timeout(webhook.retry_policy?.timeout_ms || 30000),
        });

        await app.prisma.webhookDeliveryLog.update({
          where: { id: request.params.logId },
          data: {
            status_code: response.status,
            response_body: await response.text(),
            latency_ms: Date.now() - Date.now(),
            attempt: log.attempt + 1,
          },
        });

        return { message: 'Retry sent' };
      } catch (error) {
        return reply.code(500).send({ error: 'Retry failed', code: 'RETRY_FAILED' });
      }
    });

export { webhookRoutes };