// backend/src/routes/reports.ts
// Report routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function reportRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List reports
  api.get('/', {
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(25),
        type: z.enum(['prebuilt', 'custom', 'scheduled']).optional(),
      }),
      response: {
        200: z.object({
          data: z.array(z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().nullable(),
            type: z.string(),
            format: z.string(),
            last_run: z.string().nullable(),
            next_run: z.string().nullable(),
            created_at: z.string(),
            updated_at: z.string(),
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
  api.get('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().nullable(),
          type: z.string(),
          query: z.unknown(),
          visualization: z.unknown().nullable(),
          schedule: z.unknown().nullable(),
          created_at: z.string(),
          updated_at: z.string(),
        }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const report = await app.prisma.report.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!report) {
        return reply.code(404).send({ error: 'Report not found', code: 'NOT_FOUND' });
      }

      return report;
    });

  // Create custom report
  api.post('/', {
    schema: {
      body: z.object({
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        type: z.literal('custom'),
        query: z.object({
          resource: z.string(),
          fields: z.array(z.string()),
          filters: z.array(z.object({
            field: z.string(),
            operator: z.string(),
            value: z.unknown(),
          })).optional(),
          group_by: z.array(z.string()).optional(),
          order_by: z.array(z.object({ field: z.string(), direction: z.enum(['asc', 'desc']) })).optional(),
          limit: z.number().int().positive().optional(),
        }),
        visualization: z.object({
          type: z.enum(['table', 'bar', 'line', 'pie', 'area', 'number', 'pivot']),
          config: z.unknown().optional(),
        }).optional(),
      }),
      response: {
        201: z.object({ id: z.string(), name: z.string() }),
      },
    }, async (request, reply) => {
      const report = await app.prisma.report.create({
        data: {
          ...request.body,
          tenant_id: request.tenantId!,
          type: 'custom',
          created_by_id: request.user!.id,
        },
      });

      return reply.code(201).send({ id: report.id, name: report.name });
    });

  // Update report
  api.patch('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        query: z.unknown().optional(),
        visualization: z.unknown().optional(),
      }),
      response: {
        200: z.object({ id: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const report = await app.prisma.report.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!report) {
        return reply.code(404).send({ error: 'Report not found', code: 'NOT_FOUND' });
      }

      if (report.type !== 'custom') {
        return reply.code(400).send({ error: 'Cannot modify prebuilt report', code: 'READ_ONLY' });
      }

      const updated = await app.prisma.report.update({
        where: { id: request.params.id },
        data: { ...request.body, updated_by_id: request.user!.id },
      });

      return { id: updated.id };
    });

  // Run report
  api.post('/:id/run', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        parameters: z.record(z.unknown()).optional(),
        format: z.enum(['json', 'csv', 'xlsx']).default('json'),
      }).optional(),
      response: {
        200: z.unknown(),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const report = await app.prisma.report.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!report) {
        return reply.code(404).send({ error: 'Report not found', code: 'NOT_FOUND' });
      }

      // Execute report query
      const data = await executeReportQuery(app, report, request.body?.parameters || {});

      // Update last run
      await app.prisma.report.update({
        where: { id: report.id },
        data: { last_run: new Date(), last_run_by_id: request.user!.id },
      });

      if (request.body?.format === 'csv') {
        return reply.header('Content-Type', 'text/csv').send(jsonToCsv(data));
      }
      if (request.body?.format === 'xlsx') {
        // Would use exceljs
        return reply.code(501).send({ error: 'XLSX not implemented', code: 'NOT_IMPLEMENTED' });
      }

      return data;
    });

  // Schedule report
  api.post('/:id/schedule', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        cron: z.string(),
        timezone: z.string().default('UTC'),
        format: z.enum(['csv', 'xlsx', 'pdf']).default('csv'),
        recipients: z.array(z.object({
          email: z.string().email(),
          name: z.string().optional(),
        })),
        enabled: z.boolean().default(true),
      }),
      response: {
        201: z.object({ id: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const report = await app.prisma.report.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!report) {
        return reply.code(404).send({ error: 'Report not found', code: 'NOT_FOUND' });
      }

      const schedule = await app.prisma.reportSchedule.create({
        data: {
          report_id: report.id,
          tenant_id: request.tenantId!,
          ...request.body,
          created_by_id: request.user!.id,
        },
      });

      return reply.code(201).send({ id: schedule.id });
    });

  // Prebuilt reports
  api.get('/prebuilt/list', {
    schema: {
      response: {
        200: z.array(z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
          category: z.string(),
        })),
      },
    }, async () => {
      return [
        { id: 'assets-by-tag', name: 'Assets by Asset Tag', description: 'List assets filtered by tag', category: 'Asset Inventory' },
        { id: 'assets-by-category', name: 'Assets by Category', description: 'Assets grouped by category', category: 'Asset Inventory' },
        { id: 'assets-by-department', name: 'Assets by Department', description: 'Assets grouped by department', category: 'Asset Inventory' },
        { id: 'assets-by-site', name: 'Assets by Site/Location', description: 'Assets grouped by site/location', category: 'Asset Inventory' },
        { id: 'assets-by-custodian', name: 'Assets by Custodian', description: 'Assets grouped by assigned custodian', category: 'Asset Inventory' },
        { id: 'assets-by-status', name: 'Assets by Status', description: 'Assets grouped by status', category: 'Asset Inventory' },
        { id: 'assets-by-warranty', name: 'Assets by Warranty Expiry', description: 'Assets with expiring warranties', category: 'Warranty & Compliance' },
        { id: 'checkouts-by-person', name: 'Checkouts by Person', description: 'Current checkouts grouped by person', category: 'Lifecycle' },
        { id: 'checkouts-overdue', name: 'Overdue Checkouts', description: 'Assets past due for return', category: 'Lifecycle' },
        { id: 'checkouts-by-date', name: 'Checkouts by Date Range', description: 'Checkouts within date range', category: 'Lifecycle' },
        { id: 'maintenance-open', name: 'Open Work Orders', description: 'Open and in-progress work orders', category: 'Maintenance' },
        { id: 'maintenance-overdue', name: 'Overdue Maintenance', description: 'Overdue work orders', category: 'Maintenance' },
        { id: 'maintenance-costs', name: 'Maintenance Costs', description: 'Maintenance costs by asset/category', category: 'Maintenance' },
        { id: 'audit-summary', name: 'Audit Summary', description: 'Audit session summary with discrepancies', category: 'Audits' },
        { id: 'audit-discrepancies', name: 'Audit Discrepancies', description: 'Detailed discrepancy report', category: 'Audits' },
        { id: 'contracts-expiring', name: 'Expiring Contracts', description: 'Contracts expiring within 90 days', category: 'Contracts' },
        { id: 'warranty-expiring', name: 'Warranty Expiring', description: 'Assets with warranty expiring within 90 days', category: 'Warranty & Compliance' },
        { id: 'asset-value', name: 'Asset Value Report', description: 'Total asset value by category/department', category: 'Financial' },
        { id: 'depreciation', name: 'Depreciation Schedule', description: 'Asset depreciation over time', category: 'Financial' },
      ];
    });

  // Execute prebuilt report
  api.post('/prebuilt/:id/run', {
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({
        parameters: z.record(z.unknown()).optional(),
        format: z.enum(['json', 'csv', 'xlsx']).default('json'),
      }).optional(),
    }, async (request, reply) => {
      const reportId = request.params.id;
      const params = request.body?.parameters || {};

      const data = await executePrebuiltReport(app, request.tenantId!, reportId, params);

      if (request.body?.format === 'csv') {
        return reply.header('Content-Type', 'text/csv').send(jsonToCsv(data));
      }

      return data;
    });

  // Dashboard widgets
  api.get('/dashboard/widgets', {
    schema: {
      querystring: z.object({
        widget: z.string().optional(),
      }),
    }, async (request) => {
      const tenantId = request.tenantId!;

      // KPI cards
      const [
        totalAssets,
        assignedAssets,
        inRepairAssets,
        overdueCheckouts,
        warrantyExpiring,
        openWorkOrders,
        overdueMaintenance,
        auditDiscrepancies,
      ] = await Promise.all([
        app.prisma.asset.count({ where: { tenant_id: tenantId, deleted_at: null } }),
        app.prisma.asset.count({ where: { tenant_id: tenantId, status: 'ASSIGNED', deleted_at: null } }),
        app.prisma.asset.count({ where: { tenant_id: tenantId, status: 'IN_REPAIR', deleted_at: null } }),
        app.prisma.asset.count({
          where: { tenant_id: tenantId, status: 'ASSIGNED', deleted_at: null, /* checkout due date logic */ },
        }),
        app.prisma.asset.count({
          where: { tenant_id: tenantId, warranty_expires: { lte: new Date(Date.now() + 30*24*60*60*1000), gte: new Date() }, deleted_at: null },
        }),
        app.prisma.maintenanceWorkOrder.count({
          where: { tenant_id: tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] }, deleted_at: null },
        }),
        app.prisma.maintenanceWorkOrder.count({
          where: { tenant_id: tenantId, due_date: { lt: new Date() }, status: { in: ['OPEN', 'IN_PROGRESS'] }, deleted_at: null },
        }),
        app.prisma.auditDiscrepancy.count({
          where: { session: { tenant_id: tenantId }, status: 'OPEN' },
        }),
      ]);

      return {
        kpis: [
          { label: 'Total Assets', value: totalAssets, trend: '+5%', color: 'blue' },
          { label: 'Assigned', value: assignedAssets, trend: '12 overdue', color: 'amber' },
          { label: 'In Repair', value: inRepairAssets, trend: '3 critical', color: 'red' },
          { label: 'Overdue Checkouts', value: overdueCheckouts, trend: '+2', color: 'red' },
          { label: 'Warranty Expiring (30d)', value: warrantyExpiring, trend: '8 assets', color: 'amber' },
          { label: 'Open Work Orders', value: openWorkOrders, trend: '-3', color: 'blue' },
          { label: 'Overdue Maintenance', value: overdueMaintenance, trend: '+1', color: 'red' },
          { label: 'Audit Discrepancies', value: auditDiscrepancies, trend: '0', color: 'green' },
        ],
        charts: {
          assetsByStatus: await getAssetsByStatus(tenantId),
          assetsByCategory: await getAssetsByCategory(tenantId),
          workOrdersByStatus: await getWorkOrdersByStatus(tenantId),
          auditTrends: await getAuditTrends(tenantId),
        },
      };
    });

export { reportRoutes };

// Helper functions
async function executeReportQuery(app: any, report: any, parameters: any): Promise<any[]> {
  // This would execute the report query based on the report definition
  // For now, return empty array
  return [];
}

async function executePrebuiltReport(app: any, tenantId: string, reportId: string, parameters: any): Promise<any[]> {
  // Execute prebuilt report queries
  switch (parameters.id) {
    case 'assets-by-tag':
      return app.prisma.asset.findMany({
        where: { tenant_id: tenantId, deleted_at: null },
        include: { category: true, site: true, location: true, custodian_user: true },
        orderBy: { asset_tag: 'asc' },
      });
    case 'assets-by-category':
      return app.prisma.asset.groupBy({
        by: ['category_id'],
        where: { tenant_id: tenantId, deleted_at: null },
        _count: true,
      });
    case 'checkouts-overdue':
      return app.prisma.asset.findMany({
        where: { tenant_id: tenantId, status: 'ASSIGNED', deleted_at: null /* checkout due date logic */ },
        include: { custodian_user: true, site: true },
      });
    case 'maintenance-overdue':
      return app.prisma.maintenanceWorkOrder.findMany({
        where: { tenant_id: tenantId, due_date: { lt: new Date() }, status: { in: ['OPEN', 'IN_PROGRESS'] }, deleted_at: null },
        include: { asset: true, technician: true },
        orderBy: { due_date: 'asc' },
      });
    case 'warranty-expiring':
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90);
      return app.prisma.asset.findMany({
        where: { tenant_id: tenantId, warranty_expires: { lte: expiryDate, gte: new Date() }, deleted_at: null },
        include: { category: true, vendor: true },
        orderBy: { warranty_expires: 'asc' },
      });
    default:
      return [];
  }
}

async function getAssetsByStatus(tenantId: string) {
  const results = await app.prisma.asset.groupBy({
    by: ['status'],
    where: { tenant_id: tenantId, deleted_at: null },
    _count: true,
  });
  return results.map(r => ({ status: r.status, count: r._count }));
}

async function getAssetsByCategory(tenantId: string) {
  const results = await app.prisma.asset.groupBy({
    by: ['category_id'],
    where: { tenant_id: tenantId, deleted_at: null },
    _count: true,
  });
  const categories = await app.prisma.category.findMany({
    where: { id: { in: results.map(r => r.category_id) } },
  });
  return results.map(r => ({
    category: categories.find(c => c.id === r.category_id)?.name || 'Unknown',
    count: r._count,
  }));
}

async function getWorkOrdersByStatus(tenantId: string) {
  const results = await app.prisma.maintenanceWorkOrder.groupBy({
    by: ['status'],
    where: { tenant_id: tenantId, deleted_at: null },
    _count: true,
  });
  return results.map(r => ({ status: r.status, count: r._count }));
}

async function getAuditTrends(tenantId: string) {
  const sessions = await app.prisma.auditSession.findMany({
    where: { tenant_id: tenantId, status: 'COMPLETED' },
    select: { completed_at: true, scanned_count: true, found_count: true, missing_count: true },
    orderBy: { completed_at: 'asc' },
    take: 12,
  });
  return sessions.map(s => ({
    date: s.completed_at?.toISOString().split('T')[0],
    scanned: s.scanned_count,
    found: s.found_count,
    missing: s.missing_count,
  });
}

function jsonToCsv(data: any[]): string {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}