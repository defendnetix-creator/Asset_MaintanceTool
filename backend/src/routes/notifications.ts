// backend/src/routes/notifications.ts
// Notification routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const notificationListItemSchema = z.object({
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
});

const notificationsListResponse = z.object({
  data: z.array(notificationListItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
});

const messageResponse = z.object({ message: z.string() });
const errorResponse = z.object({ error: z.string(), code: z.string() });

const listNotificationsSchema = {
  querystring: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(25),
    status: z.enum(['UNREAD', 'READ', 'ARCHIVED']).optional(),
    type: z.string().optional(),
  }),
  response: { 200: notificationsListResponse },
};

const markReadSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: messageResponse, 404: errorResponse },
};

const markAllReadSchema = {
  response: { 200: messageResponse },
};

export async function notificationRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List notifications
  api.get('/', listNotificationsSchema, async (request) => {
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
  api.patch('/:id/read', markReadSchema, async (request, reply) => {
    const notification = await app.prisma.notification.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
    });

    if (!notification) {
      return reply.code(404).send({ error: 'Notification not found', code: 'NOT_FOUND' });
    }

    if (notification.status !== 'READ') {
      await app.prisma.notification.update({
        where: { id: request.params.id },
        data: { status: 'READ', read_at: new Date() },
      });
    }

    return { message: 'Notification marked as read' };
  });

  // Mark all as read
  api.patch('/read-all', markAllReadSchema, async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    await app.prisma.notification.updateMany({
      where: {
        tenant_id: tenantId,
        OR: [{ user_id: userId }, { user_id: null }],
        status: { not: 'READ' },
      },
      data: { status: 'READ', read_at: new Date() },
    });

    return { message: 'All notifications marked as read' };
  });

  // Archive notification
  api.patch('/:id/archive', {
    params: z.object({ id: z.string().uuid() }),
    response: { 200: messageResponse, 404: errorResponse },
  }, async (request, reply) => {
    const notification = await app.prisma.notification.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
    });

    if (!notification) {
      return reply.code(404).send({ error: 'Notification not found', code: 'NOT_FOUND' });
    }

    await app.prisma.notification.update({
      where: { id: request.params.id },
      data: { status: 'ARCHIVED' },
    });

    return { message: 'Notification archived' };
  });

  // Delete notification
  api.delete('/:id', {
    params: z.object({ id: z.string().uuid() }),
    response: { 200: messageResponse, 404: errorResponse },
  }, async (request, reply) => {
    const notification = await app.prisma.notification.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
    });

    if (!notification) {
      return reply.code(404).send({ error: 'Notification not found', code: 'NOT_FOUND' });
    }

    await app.prisma.notification.delete({
      where: { id: request.params.id },
    });

    return { message: 'Notification deleted' };
  });

  // Get unread count
  api.get('/unread-count', async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    const count = await app.prisma.notification.count({
      where: {
        tenant_id: tenantId,
        OR: [{ user_id: userId }, { user_id: null }],
        status: 'UNREAD',
      },
    });

    return { count };
  });
}