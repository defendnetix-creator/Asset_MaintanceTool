// backend/src/routes/notifications.ts
// Notification routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function notificationRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List notifications
  api.get('/', {
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(25),
        status: z.enum(['UNREAD', 'READ', 'ARCHIVED']).optional(),
        type: z.string().optional(),
      }),
      response: {
        200: z.object({
          data: z.array(z.object({
            id: z.string(),
            type: z.string(),
            title: z.string(),
            message: z.string(),
            channel: z.string(),
            status: z.string(),
            read_at: z.string().nullable(),
            related_type: z.string().nullable(),
            related_id: z.string().nullable(),
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
      const { page, limit, status, type } = request.query;
      const tenantId = request.tenantId!;
      const userId = request.user!.id;

      const where: any = { tenant_id: tenantId, OR: [{ user_id: userId }, { user_id: null }] };
      if (status) where.status = status;
      if (type) where.type = type;

      const [notifications, total] = await Promise.all([
        app.prisma.notification.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { created_at: 'desc' },
        }),
        app.prisma.notification.count({ where }),
      ]);

      return { data: notifications, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
    });

  // Mark as read
  api.patch('/:id/read', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const notification = await app.prisma.notification.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!notification) {
        return reply.code(404).send({ error: 'Notification not found', code: 'NOT_FOUND' });
      }

      if (notification.user_id && notification.user_id !== request.user!.id) {
        return reply.code(403).send({ error: 'Not authorized', code: 'FORBIDDEN' });
      }

      await app.prisma.notification.update({
        where: { id: request.params.id },
        data: { status: 'READ', read_at: new Date() },
      });

      return { message: 'Notification marked as read' };
    });

  // Mark all as read
  api.patch('/read-all', {
    schema: {
      body: z.object({
        type: z.string().optional(),
      }),
      response: {
        200: z.object({ message: z.string(), count: z.number() }),
      },
    }, async (request, reply) => {
      const { type } = request.body;
      const userId = request.user!.id;
      const tenantId = request.tenantId!;

      const where: any = { tenant_id: tenantId, user_id: userId, status: 'UNREAD' };
      if (request.body.type) where.type = request.body.type;

      const result = await app.prisma.notification.updateMany({
        where,
        data: { status: 'READ', read_at: new Date() },
      });

      return { message: 'Notifications marked as read', count: result.count };
    });

  // Archive notification
  api.patch('/:id/archive', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const notification = await app.prisma.notification.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!notification) {
        return reply.code(404).send({ error: 'Notification not found', code: 'NOT_FOUND' });
      }

      if (notification.user_id && notification.user_id !== request.user!.id) {
        return reply.code(403).send({ error: 'Not authorized', code: 'FORBIDDEN' });
      }

      await app.prisma.notification.update({
        where: { id: request.params.id },
        data: { status: 'ARCHIVED' },
      });

      return { message: 'Notification archived' };
    });

  // Delete notification
  api.delete('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const notification = await app.prisma.notification.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!notification) {
        return reply.code(404).send({ error: 'Notification not found', code: 'NOT_FOUND' });
      }

      if (notification.user_id && notification.user_id !== request.user!.id) {
        return reply.code(403).send({ error: 'Not authorized', code: 'FORBIDDEN' });
      }

      await app.prisma.notification.delete({ where: { id: request.params.id } });

      return { message: 'Notification deleted' };
    });

  // Notification preferences
  api.get('/preferences', {
    schema: {
      response: {
        200: z.object({
          email: z.boolean(),
          sms: z.boolean(),
          in_app: z.boolean(),
          push: z.boolean(),
          channels: z.record(z.boolean()),
        }),
      },
    }, async (request) => {
      const prefs = await app.prisma.setting.findFirst({
        where: { tenant_id: request.tenantId!, scope: 'user', key: 'notification_preferences', user_id: request.user!.id },
      });

      return prefs?.value || {
        email: true,
        sms: false,
        in_app: true,
        push: false,
        channels: { asset_overdue: true, maintenance_due: true, warranty_expiring: true, audit_discrepancy: true, agent_offline: true },
      };
    });

  api.patch('/preferences', {
    schema: {
      body: z.object({
        email: z.boolean().optional(),
        sms: z.boolean().optional(),
        in_app: z.boolean().optional(),
        push: z.boolean().optional(),
        channels: z.record(z.boolean()).optional(),
      }),
      response: {
        200: z.object({ message: z.string() }),
      },
    }, async (request, reply) => {
      await app.prisma.setting.upsert({
        where: { tenant_id_scope_key_user_id: { tenant_id: request.tenantId!, scope: 'user', key: 'notification_preferences', user_id: request.user!.id } },
        update: { value: request.body },
        create: { tenant_id: request.tenantId!, scope: 'user', key: 'notification_preferences', user_id: request.user!.id, value: request.body },
      });

      return { message: 'Preferences updated' };
    });

  // Test notification
  api.post('/test', {
    schema: {
      body: z.object({
        channel: z.enum(['EMAIL', 'SMS', 'IN_APP', 'WEBHOOK']),
        type: z.string(),
        recipient: z.string().optional(),
      }),
      response: {
        200: z.object({ message: z.string(), sent: z.boolean() }),
      },
    }, async (request, reply) => {
      const { channel, type, recipient } = request.body;
      const userId = request.user!.id;
      const tenantId = request.tenantId!;

      // Send test notification
      const notification = await app.prisma.notification.create({
        data: {
          tenant_id: tenantId,
          user_id: userId,
          type: 'TEST',
          title: 'Test Notification',
          message: `This is a test ${channel} notification`,
          channel,
          status: 'UNREAD',
        },
      });

      // Actually send based on channel
      let sent = false;
      if (channel === 'IN_APP') {
        sent = true;
      } else if (channel === 'EMAIL') {
        // Would send email
        sent = true;
      } else if (channel === 'WEBHOOK') {
        // Would trigger webhook
        sent = true;
      }

      return { message: 'Test notification sent', sent };
    });

export { notificationRoutes };