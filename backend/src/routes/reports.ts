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
  // No response validation - let Fastify pass through
};

const getReportSchema = {
  params: z.object({ id: z.string().uuid() }),
  // No response validation - let Fastify pass through
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
  // No response validation - let Fastify pass through
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
  // No response validation - let Fastify pass through
};

const deleteReportSchema = {
  params: z.object({ id: z.string().uuid() }),
  // No response validation - let Fastify pass through
};

const runReportSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    format: z.enum(['json', 'csv', 'pdf']).default('json'),
    params: z.record(z.unknown()).optional(),
  }),
  // No response validation - let Fastify pass through
};

async function reportRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List reports
  api.get('/', listReportsSchema, async (request) => {
    const { page = 1, limit = 25, type } = request.query as { page?: string; limit?: string; type?: string };
    const tenantId = request.tenantId!;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 25;

    const where: any = { tenant_id: tenantId };
    if (type) where.type = type;

    const [reports, total] = await Promise.all([
      app.prisma.report.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { updated_at: 'desc' },
      }),
      app.prisma.report.count({ where }),
    ]);

    return { data: reports, pagination: { page: pageNum, limit: limitNum, total, total_pages: Math.ceil(total / limitNum) } };
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

  // Prebuilt reports list
  api.get('/prebuilt/list', async (request) => {
    const tenantId = request.tenantId!;

    // Return the list of available prebuilt reports
    const prebuiltReports = [
      // Asset Inventory
      { id: 'assets-by-tag', name: 'Assets by Asset Tag', category: 'Asset Inventory', description: 'List assets filtered by tag' },
      { id: 'assets-by-category', name: 'Assets by Category', category: 'Asset Inventory', description: 'Assets grouped by category' },
      { id: 'assets-by-department', name: 'Assets by Department', category: 'Asset Inventory', description: 'Assets grouped by department' },
      { id: 'assets-by-site', name: 'Assets by Site/Location', category: 'Asset Inventory', description: 'Assets grouped by site/location' },
      { id: 'assets-by-custodian', name: 'Assets by Custodian', category: 'Asset Inventory', description: 'Assets grouped by assigned custodian' },
      { id: 'assets-by-status', name: 'Assets by Status', category: 'Asset Inventory', description: 'Assets grouped by status' },
      { id: 'assets-by-warranty', name: 'Assets by Warranty Expiry', category: 'Warranty & Compliance', description: 'Assets with expiring warranties' },

      // Lifecycle
      { id: 'checkouts-by-person', name: 'Checkouts by Person', category: 'Lifecycle', description: 'Current checkouts grouped by person' },
      { id: 'checkouts-overdue', name: 'Overdue Checkouts', category: 'Lifecycle', description: 'Assets past due for return' },
      { id: 'checkouts-by-date', name: 'Checkouts by Date Range', category: 'Lifecycle', description: 'Checkouts within date range' },

      // Maintenance
      { id: 'maintenance-open', name: 'Open Work Orders', category: 'Maintenance', description: 'Open and in-progress work orders' },
      { id: 'maintenance-overdue', name: 'Overdue Maintenance', category: 'Maintenance', description: 'Overdue work orders' },
      { id: 'maintenance-costs', name: 'Maintenance Costs', category: 'Maintenance', description: 'Maintenance costs by asset/category' },

      // Audits
      { id: 'audit-summary', name: 'Audit Summary', category: 'Audits', description: 'Audit session summary with discrepancies' },
      { id: 'audit-discrepancies', name: 'Audit Discrepancies', category: 'Audits', description: 'Detailed discrepancy report' },

      // Contracts
      { id: 'contracts-expiring', name: 'Expiring Contracts', category: 'Contracts', description: 'Contracts expiring within 90 days' },

      // Warranty & Compliance
      { id: 'warranty-expiring', name: 'Warranty Expiring', category: 'Warranty & Compliance', description: 'Assets with warranty expiring within 90 days' },

      // Financial
      { id: 'asset-value', name: 'Asset Value Report', category: 'Financial', description: 'Total asset value by category/department' },
      { id: 'depreciation', name: 'Depreciation Schedule', category: 'Financial', description: 'Asset depreciation over time' },
    ];

    return prebuiltReports;
  });

  // Run prebuilt report
  api.post('/prebuilt/:id/run', {
    params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    body: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['json', 'csv', 'xlsx'] },
        params: { type: 'object' },
      },
    },
  }, async (request, reply) => {
    const tenantId = request.tenantId!;
    const { id } = request.params as { id: string };
    const { format = 'csv', params } = request.body as { format?: string; params?: Record<string, any> };

    // For now, return placeholder data
    // In a real implementation, this would execute the actual report query
    if (format === 'json') {
      return { columns: [], rows: [], summary: {} };
    } else if (format === 'csv') {
      return '';
    } else {
      return reply.code(501).send({ error: 'Excel format not yet implemented', code: 'NOT_IMPLEMENTED' });
    }
  });

  // Dashboard widgets
  api.get('/dashboard/widgets', async (request) => {
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

export { reportRoutes };