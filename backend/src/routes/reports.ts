// backend/src/routes/reports.ts
// Report routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const reportListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  format: z.string(),
  last_run: z.string().nullable(),
  next_run: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const reportsListResponse = z.object({
  data: z.array(reportListItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
});

const reportDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  query: z.unknown(),
  visualization: z.unknown().nullable(),
  schedule: z.unknown().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const reportResultSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.array(z.unknown())),
  summary: z.record(z.unknown()).optional(),
});

const messageResponse = z.object({ message: z.string() });
const errorResponse = z.object({ error: z.string(), code: z.string() });

const listReportsSchema = {
  querystring: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(25),
    type: z.enum(['prebuilt', 'custom', 'scheduled']).optional(),
  }),
  response: { 200: reportsListResponse },
};

const getReportSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: reportDetailSchema, 404: errorResponse },
};

const createReportSchema = {
  body: z.object({
    name: z.string().min(1).max(200),
    description: z.string().optional(),
    type: z.enum(['custom', 'scheduled']),
    query: z.record(z.unknown()),
    visualization: z.record(z.unknown()).optional(),
    schedule: z.object({
      cron: z.string(),
      format: z.enum(['json', 'csv', 'pdf']).default('csv'),
      recipients: z.array(z.string().email()),
    }).optional(),
  }),
  response: { 201: reportDetailSchema, 400: errorResponse },
};

const updateReportSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().optional().nullable(),
    query: z.record(z.unknown()).optional(),
    visualization: z.record(z.unknown()).optional().nullable(),
    schedule: z.object({
      cron: z.string(),
      format: z.enum(['json', 'csv', 'pdf']).default('csv'),
      recipients: z.array(z.string().email()),
    }).optional().nullable(),
  }),
  response: { 200: reportDetailSchema, 400: errorResponse, 404: errorResponse },
};

const deleteReportSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: messageResponse, 404: errorResponse },
};

const runReportSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    format: z.enum(['json', 'csv', 'pdf']).default('json'),
    params: z.record(z.unknown()).optional(),
  }),
  response: { 200: z.union([reportResultSchema, z.string()]), 400: errorResponse, 404: errorResponse, 501: errorResponse },
};

const dashboardWidgetsSchema = {
  querystring: z.object({
    widget: z.enum(['asset_summary', 'workorder_summary', 'audit_summary', 'asset_by_status', 'asset_by_category', 'workorder_by_status', 'audit_trends', 'upcoming_maintenance']).optional(),
  }),
  response: { 200: z.object({ widgets: z.array(z.unknown()) }) },
};

export async function reportRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List reports
  api.get('/', listReportsSchema, async (request) => {
    const { page, limit, type } = request.query;
    const tenantId = request.tenantId!;

    const where: any = { tenant_id: tenantId };
    if (type) where.type = type;

    const [reports, total] = await Promise.all([
      app.prisma.report.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updated_at: 'desc' },
      }),
      app.prisma.report.count({ where }),
    ]);

    return { data: reports, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
  });

  // Get report
  api.get('/:id', getReportSchema, async (request, reply) => {
    const report = await app.prisma.report.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
    });

    if (!report) {
      return reply.code(404).send({ error: 'Report not found', code: 'NOT_FOUND' });
    }

    return report;
  });

  // Create report
  api.post('/', createReportSchema, async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    const report = await app.prisma.report.create({
      data: {
        tenant_id: tenantId,
        created_by_id: userId,
        ...request.body,
      },
    });

    return reply.code(201).send(report);
  });

  // Update report
  api.put('/:id', updateReportSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.report.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Report not found', code: 'NOT_FOUND' });
    }

    const updated = await app.prisma.report.update({
      where: { id: request.params.id },
      data: request.body,
    });

    return updated;
  });

  // Delete report
  api.delete('/:id', deleteReportSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.report.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Report not found', code: 'NOT_FOUND' });
    }

    await app.prisma.report.delete({
      where: { id: request.params.id },
    });

    return { message: 'Report deleted' };
  });

  // Run report
  api.post('/:id/run', runReportSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const report = await app.prisma.report.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });

    if (!report) {
      return reply.code(404).send({ error: 'Report not found', code: 'NOT_FOUND' });
    }

    // This would execute the report query
    // For now, return a placeholder
    if (request.body.format === 'json') {
      return { columns: [], rows: [], summary: {} };
    } else if (request.body.format === 'csv') {
      return '';
    } else {
      return reply.code(501).send({ error: 'PDF format not yet implemented', code: 'NOT_IMPLEMENTED' });
    }
  });

  // Dashboard widgets
  api.get('/dashboard/widgets', dashboardWidgetsSchema, async (request) => {
    const tenantId = request.tenantId!;
    const widget = request.query.widget;

    // Return all widgets if none specified
    const widgets = [];

    // Asset summary
    if (!widget || widget === 'asset_summary') {
      const [total, byStatus, byCategory] = await Promise.all([
        app.prisma.asset.count({ where: { tenant_id: tenantId, deleted_at: null } }),
        app.prisma.asset.groupBy({ by: ['status'], where: { tenant_id: tenantId, deleted_at: null }, _count: true }),
        app.prisma.asset.groupBy({ by: ['category_id'], where: { tenant_id: tenantId, deleted_at: null }, _count: true }),
      ]);

      widgets.push({
        id: 'asset_summary',
        title: 'Asset Summary',
        data: { total, byStatus, byCategory },
      });
    }

    // Work order summary
    if (!widget || widget === 'workorder_summary') {
      const [total, byStatus] = await Promise.all([
        app.prisma.maintenanceWorkOrder.count({ where: { tenant_id: tenantId, deleted_at: null } }),
        app.prisma.maintenanceWorkOrder.groupBy({ by: ['status'], where: { tenant_id: tenantId, deleted_at: null }, _count: true }),
      ]);

      widgets.push({
        id: 'workorder_summary',
        title: 'Work Order Summary',
        data: { total, byStatus },
      });
    }

    // Audit summary
    if (!widget || widget === 'audit_summary') {
      const [total, byStatus] = await Promise.all([
        app.prisma.auditSession.count({ where: { tenant_id: tenantId } }),
        app.prisma.auditSession.groupBy({ by: ['status'], where: { tenant_id: tenantId }, _count: true }),
      ]);

      widgets.push({
        id: 'audit_summary',
        title: 'Audit Summary',
        data: { total, byStatus },
      });
    }

    // Upcoming maintenance
    if (!widget || widget === 'upcoming_maintenance') {
      const upcoming = await app.prisma.maintenanceWorkOrder.findMany({
        where: {
          tenant_id: tenantId,
          deleted_at: null,
          status: { in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD'] },
          due_date: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        },
        take: 10,
        orderBy: { due_date: 'asc' },
        include: { asset: { select: { asset_tag: true } } },
      });

      widgets.push({
        id: 'upcoming_maintenance',
        title: 'Upcoming Maintenance (7 days)',
        data: upcoming,
      });
    }

    return { widgets };
  });
}