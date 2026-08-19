// backend/src/routes/audits.ts
// Audit routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

// ============================================
// Zod Schemas
// ============================================

const auditSessionListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  scope_type: z.string(),
  scope_id: z.string().nullable(),
  scope_name: z.string().nullable(),
  status: z.string(),
  start_at: z.string().nullable(),
  end_at: z.string().nullable(),
  due_at: z.string().nullable(),
  total_assets: z.number(),
  scanned_count: z.number(),
  found_count: z.number(),
  missing_count: z.number(),
  mismatched_count: z.number(),
  damaged_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  completed_at: z.string().nullable(),
  lead_auditor: z.object({ id: z.string(), first_name: z.string(), last_name: z.string() }).nullable(),
});

const auditsListResponse = z.object({
  data: z.array(auditSessionListItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
});

const auditSessionDetailResponse = z.object({
  id: z.string(),
  name: z.string(),
  scope_type: z.string(),
  scope_id: z.string().nullable(),
  scope_name: z.string().nullable(),
  status: z.string(),
  start_at: z.string().nullable(),
  end_at: z.string().nullable(),
  due_at: z.string().nullable(),
  timezone: z.string(),
  total_assets: z.number(),
  scanned_count: z.number(),
  found_count: z.number(),
  missing_count: z.number(),
  mismatched_count: z.number(),
  damaged_count: z.number(),
  lead_auditor: z.object({ id: z.string(), first_name: z.string(), last_name: z.string() }).nullable(),
  auditors: z.array(z.object({ id: z.string(), first_name: z.string(), last_name: z.string(), email: z.string() })),
  created_at: z.string(),
  updated_at: z.string(),
  completed_at: z.string().nullable(),
  items: z.array(z.object({
    id: z.string(),
    asset_id: z.string(),
    asset_tag: z.string(),
    asset_name: z.string(),
    expected_location: z.string().nullable(),
    scanned_location: z.string().nullable(),
    status: z.string(),
    scanned_at: z.string().nullable(),
    notes: z.string().nullable(),
  })),
  discrepancies: z.array(z.object({
    id: z.string(),
    asset_tag: z.string(),
    type: z.string(),
    expected_location: z.string().nullable(),
    found_location: z.string().nullable(),
    severity: z.string(),
    status: z.string(),
    suggested_match: z.string().nullable(),
    resolution: z.string().nullable(),
  })),
});

const createAuditInput = z.object({
  name: z.string().min(1).max(200),
  scope_type: z.enum(['site', 'location', 'department', 'category', 'custom']),
  scope_id: z.string().uuid().optional(),
  scope_name: z.string().optional(),
  start_at: z.string().datetime().optional(),
  due_at: z.string().datetime().optional(),
  timezone: z.string().default('UTC'),
  lead_auditor_id: z.string().uuid().optional(),
  auditor_ids: z.array(z.string().uuid()).optional(),
  require_signature: z.boolean().default(false),
  require_photo: z.boolean().default(false),
  offline_enabled: z.boolean().default(true),
});

const createAuditResponse = z.object({ id: z.string(), name: z.string() });

const startAuditResponse = z.object({ message: z.string() });

const scanInput = z.object({
  asset_tag: z.string().min(1),
  location_id: z.string().uuid().optional(),
  status: z.enum(['FOUND', 'MISSING', 'MISMATCHED', 'DAMAGED']).default('FOUND'),
  notes: z.string().optional(),
  photo_base64: z.string().optional(),
});

const scanResponse = z.object({ message: z.string(), item: z.object({ id: z.string(), status: z.string() }) });

const reconcileInput = z.object({
  action: z.enum(['confirm_match', 'update_location', 'mark_missing', 'mark_damaged', 'ignore']),
  location_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const completeAuditResponse = z.object({ message: z.string() });

const messageResponse = z.object({ message: z.string() });
const errorResponse = z.object({ error: z.string(), code: z.string() });

const listAuditsSchema = {
  querystring: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(25),
    status: z.string().optional(),
    scope_type: z.string().optional(),
    start_after: z.string().datetime().optional(),
    start_before: z.string().datetime().optional(),
  }),
  response: { 200: auditsListResponse },
};

const getAuditSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: auditSessionDetailResponse, 404: z.object({ error: z.string(), code: z.string() }) },
};

const createAuditSchema = {
  body: createAuditInput,
  response: { 201: createAuditResponse, 400: z.object({ error: z.string(), code: z.string() }) },
};

const startAuditSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: startAuditResponse, 400: z.object({ error: z.string(), code: z.string() }), 404: z.object({ error: z.string(), code: z.string() }) },
};

const scanSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: scanInput,
  response: { 200: scanResponse, 400: z.object({ error: z.string(), code: z.string() }), 404: z.object({ error: z.string(), code: z.string() }) },
};

const reconcileSchema = {
  params: z.object({ id: z.string().uuid(), discrepancyId: z.string().uuid() }),
  body: reconcileInput,
  response: { 200: messageResponse, 404: z.object({ error: z.string(), code: z.string() }) },
};

const completeAuditSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: completeAuditResponse, 400: z.object({ error: z.string(), code: z.string() }), 404: z.object({ error: z.string(), code: z.string() }) },
};

const exportReportSchema = {
  params: z.object({ id: z.string().uuid() }),
  querystring: z.object({ format: z.enum(['pdf', 'csv', 'json']).default('pdf') }),
};

export async function auditRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List audit sessions
  api.get('/', { schema: listAuditsSchema }, async (request) => {
    const { page, limit, status, scope_type, start_after, start_before } = request.query;
    const tenantId = request.tenantId!;

    const where: Record<string, unknown> = { tenant_id: tenantId };
    if (status) where.status = status;
    if (scope_type) where.scope_type = scope_type;
    if (start_after || start_before) {
      where.start_at = {};
      if (start_after) where.start_at.gte = new Date(start_after);
      if (start_before) where.start_at.lte = new Date(start_before);
    }

    const [sessions, total] = await Promise.all([
      app.prisma.auditSession.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          lead_auditor: { select: { id: true, first_name: true, last_name: true } },
        },
      }),
      app.prisma.auditSession.count({ where }),
    ]);

    return { data: sessions, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
  });

  // Create audit session
  api.post('/', { schema: createAuditSchema }, async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    if (request.body.scope_type !== 'custom' && !request.body.scope_id) {
      return reply.code(400).send({ error: 'Scope ID required for this scope type', code: 'INVALID_SCOPE' });
    }

    if (request.body.scope_id) {
      let scopeExists = false;
      switch (request.body.scope_type) {
        case 'site':
          scopeExists = await app.prisma.site.findFirst({ where: { id: request.body.scope_id, tenant_id: tenantId } });
          break;
        case 'location':
          scopeExists = await app.prisma.location.findFirst({ where: { id: request.body.scope_id, tenant_id: tenantId } });
          break;
        case 'department':
          scopeExists = await app.prisma.department.findFirst({ where: { id: request.body.scope_id, tenant_id: tenantId } });
          break;
        case 'category':
          scopeExists = await app.prisma.category.findFirst({ where: { id: request.body.scope_id, tenant_id: tenantId } });
          break;
      }
      if (!scopeExists) {
        return reply.code(400).send({ error: 'Invalid scope', code: 'INVALID_SCOPE' });
      }
    }

    if (request.body.auditor_ids?.length) {
      const auditors = await app.prisma.user.findMany({
        where: { id: { in: request.body.auditor_ids }, tenant_id: tenantId, status: 'ACTIVE' },
      });
      if (auditors.length !== request.body.auditor_ids.length) {
        return reply.code(400).send({ error: 'One or more auditors not found', code: 'INVALID_AUDITORS' });
      }
    }

    const session = await app.prisma.auditSession.create({
      data: {
        ...request.body,
        tenant_id: tenantId,
        created_by_id: userId,
      },
    });

    if (request.body.auditor_ids?.length) {
      await app.prisma.auditSession.update({
        where: { id: session.id },
        data: { auditors: { connect: request.body.auditor_ids.map(id => ({ id })) } },
      });
    }

    if (request.body.start_at && new Date(request.body.start_at) <= new Date()) {
      await app.prisma.auditSession.update({
        where: { id: session.id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return reply.code(201).send({ id: session.id, name: session.name });
  });

  // Get audit session detail
  api.get('/:id', { schema: { params: z.object({ id: z.string().uuid() }), response: { 200: auditSessionDetailResponse, 404: errorResponse } } }, async (request, reply) => {
    const session = await app.prisma.auditSession.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
      include: {
        lead_auditor: { select: { id: true, first_name: true, last_name: true } },
        auditors: { select: { id: true, first_name: true, last_name: true, email: true } },
        items: {
          include: {
            asset: { select: { asset_tag: true, make: true, model: true } },
            expected_location: { select: { name: true } },
            scanned_location: { select: { name: true } },
            discrepancy: { select: { id: true } },
          },
        },
        discrepancies: {
          include: {
            asset: { select: { asset_tag: true } },
            expected_location: { select: { name: true } },
            found_location: { select: { name: true } },
          },
        },
      },
    });

    if (!session) {
      return reply.code(404).send({ error: 'Audit session not found', code: 'NOT_FOUND' });
    }

    return {
      ...session,
      items: session.items.map(item => ({
        id: item.id,
        asset_id: item.asset_id,
        asset_tag: item.asset.asset_tag,
        asset_name: `${item.asset.make || ''} ${item.asset.model || ''}`.trim(),
        expected_location: item.expected_location?.name || null,
        scanned_location: item.scanned_location?.name || null,
        status: item.status,
        scanned_at: item.scanned_at?.toISOString() || null,
        notes: item.notes,
      })),
      discrepancies: session.discrepancies.map(d => ({
        id: d.id,
        asset_tag: d.asset.asset_tag,
        type: d.type,
        expected_location: d.expected_location?.name || null,
        found_location: d.found_location?.name || null,
        severity: d.severity,
        status: d.status,
        suggested_match: d.suggested_match_id || null,
        resolution: d.resolution,
      })),
    };
  });

  // Start audit session
  api.post('/:id/start', { schema: startAuditSchema }, async (request, reply) => {
    const session = await app.prisma.auditSession.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
    });

    if (!session) {
      return reply.code(404).send({ error: 'Audit session not found', code: 'NOT_FOUND' });
    }

    if (session.status !== 'SCHEDULED') {
      return reply.code(400).send({ error: 'Session already started or completed', code: 'INVALID_STATUS' });
    }

    await app.prisma.auditSession.update({
      where: { id: request.params.id },
      data: { status: 'IN_PROGRESS', start_at: new Date() },
    });

    let assets: any[] = [];
    switch (session.scope_type) {
      case 'site':
        assets = await app.prisma.asset.findMany({
          where: { tenant_id: request.tenantId!, site_id: session.scope_id, deleted_at: null },
          select: { id: true },
        });
        break;
      case 'location':
        assets = await app.prisma.asset.findMany({
          where: { tenant_id: request.tenantId!, location_id: session.scope_id, deleted_at: null },
          select: { id: true },
        });
        break;
      case 'department':
        assets = await app.prisma.asset.findMany({
          where: { tenant_id: request.tenantId!, department_id: session.scope_id, deleted_at: null },
          select: { id: true },
        });
        break;
      case 'category':
        assets = await app.prisma.asset.findMany({
          where: { tenant_id: request.tenantId!, category_id: session.scope_id, deleted_at: null },
          select: { id: true },
        });
        break;
      case 'custom':
        break;
    }

    if (assets.length > 0) {
      await app.prisma.auditSessionItem.createMany({
        data: assets.map(a => ({
          session_id: request.params.id,
          asset_id: a.id,
          expected_location_id: null,
        })),
      });
    }

    await app.prisma.auditSession.update({
      where: { id: request.params.id },
      data: { total_assets: assets.length },
    });

    return { message: 'Audit session started' };
  });

  // Submit scan
  api.post('/:id/scan', { schema: scanSchema }, async (request, reply) => {
    const session = await app.prisma.auditSession.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
    });

    if (!session) {
      return reply.code(404).send({ error: 'Audit session not found', code: 'NOT_FOUND' });
    }

    if (session.status !== 'IN_PROGRESS') {
      return reply.code(400).send({ error: 'Session not in progress', code: 'INVALID_STATUS' });
    }

    const asset = await app.prisma.asset.findFirst({
      where: { tenant_id: request.tenantId!, normalized_tag: request.body.asset_tag.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, ''), deleted_at: null },
    });

    if (!asset) {
      return reply.code(400).send({ error: 'Asset not found', code: 'ASSET_NOT_FOUND' });
    }

    let item = await app.prisma.auditSessionItem.findFirst({
      where: { session_id: request.params.id, asset_id: asset.id },
    });

    if (!item) {
      return reply.code(400).send({ error: 'Asset not in audit scope', code: 'ASSET_NOT_IN_SCOPE' });
    }

    if (item.status !== 'MISSING' && item.status !== 'MISMATCHED') {
      return reply.code(400).send({ error: 'Asset already scanned', code: 'ALREADY_SCANNED' });
    }

    const expectedLocation = await app.prisma.location.findFirst({
      where: { id: asset.location_id },
      select: { name: true },
    });

    const scannedLocation = request.body.location_id ? await app.prisma.location.findFirst({
      where: { id: request.body.location_id },
      select: { name: true },
    }) : null;

    let status = request.body.status;
    if (status === 'FOUND' && asset.location_id && request.body.location_id && asset.location_id !== request.body.location_id) {
      status = 'MISMATCHED';
    }

    const updated = await app.prisma.auditSessionItem.update({
      where: { id: item.id },
      data: {
        status,
        scanned_location_id: request.body.location_id || null,
        scanned_at: new Date(),
        scanned_by_id: request.user!.id,
        notes: request.body.notes,
        photo_url: request.body.photo_base64 ? `data:image/jpeg;base64,${request.body.photo_base64}` : null,
      },
    });

    await app.prisma.auditSession.update({
      where: { id: request.params.id },
      data: {
        scanned_count: { increment: 1 },
        found_count: { increment: status === 'FOUND' ? 1 : 0 },
        missing_count: { increment: status === 'MISSING' ? 1 : 0 },
        mismatched_count: { increment: status === 'MISMATCHED' ? 1 : 0 },
        damaged_count: { increment: status === 'DAMAGED' ? 1 : 0 },
      },
    });

    if (status !== 'FOUND') {
      await app.prisma.auditDiscrepancy.create({
        data: {
          session_id: request.params.id,
          asset_id: updated.asset_id,
          type: status,
          expected_location_id: asset.location_id,
          found_location_id: request.body.location_id,
          severity: status === 'DAMAGED' ? 'HIGH' : 'MEDIUM',
        },
      });
    }

    return { message: 'Scan recorded', item: { id: updated.id, status: updated.status } };
  });

  // Reconcile discrepancy
  api.post('/:id/discrepancies/:discrepancyId/resolve', reconcileSchema, async (request, reply) => {
    const discrepancy = await app.prisma.auditDiscrepancy.findFirst({
      where: { id: request.params.discrepancyId, session_id: request.params.id },
    });

    if (!discrepancy) {
      return reply.code(404).send({ error: 'Discrepancy not found', code: 'NOT_FOUND' });
    }

    if (discrepancy.status !== 'OPEN') {
      return reply.code(400).send({ error: 'Discrepancy already resolved', code: 'ALREADY_RESOLVED' });
    }

    let resolution = '';
    let status = 'RESOLVED';

    switch (request.body.action) {
      case 'confirm_match':
        if (!request.body.location_id) {
          return reply.code(400).send({ error: 'Location required for confirm_match', code: 'MISSING_LOCATION' });
        }
        await app.prisma.asset.update({
          where: { id: discrepancy.asset_id },
          data: { location_id: request.body.location_id },
        });
        resolution = 'Location updated to match scanned location';
        break;
      case 'update_location':
        if (!request.body.location_id) {
          return reply.code(400).send({ error: 'Location required for update_location', code: 'MISSING_LOCATION' });
        }
        await app.prisma.asset.update({
          where: { id: discrepancy.asset_id },
          data: { location_id: request.body.location_id },
        });
        resolution = 'Asset location updated';
        break;
      case 'mark_missing':
        status = 'MISSING';
        resolution = 'Asset confirmed missing';
        break;
      case 'mark_damaged':
        status = 'DAMAGED';
        resolution = 'Asset confirmed damaged';
        break;
      case 'ignore':
        status = 'IGNORED';
        resolution = 'Discrepancy ignored';
        break;
    }

    await app.prisma.auditDiscrepancy.update({
      where: { id: request.params.discrepancyId },
      data: {
        status,
        resolution,
        resolved_by_id: request.user!.id,
        resolved_at: new Date(),
      },
    });

    return { message: 'Discrepancy resolved' };
  });

  // Complete audit session
  api.post('/:id/complete', { schema: completeAuditSchema }, async (request, reply) => {
    const session = await app.prisma.auditSession.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
    });

    if (!session) {
      return reply.code(404).send({ error: 'Audit session not found', code: 'NOT_FOUND' });
    }

    if (session.status !== 'IN_PROGRESS') {
      return reply.code(400).send({ error: 'Session not in progress', code: 'INVALID_STATUS' });
    }

    await app.prisma.auditSession.update({
      where: { id: request.params.id },
      data: { status: 'COMPLETED', end_at: new Date(), completed_at: new Date() },
    });

    return { message: 'Audit session completed' };
  });

  // Export audit report
  api.get('/:id/report', { schema: exportReportSchema }, async (request, reply) => {
    const session = await app.prisma.auditSession.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
      include: {
        items: { include: { asset: true, expected_location: true, scanned_location: true } },
        discrepancies: { include: { asset: true, expected_location: true, found_location: true } },
      },
    });

    if (!session) {
      return reply.code(404).send({ error: 'Audit session not found', code: 'NOT_FOUND' });
    }

    if (request.query.format === 'json') {
      return session;
    }

    if (request.query.format === 'csv') {
      const headers = ['Asset Tag', 'Make', 'Model', 'Expected Location', 'Scanned Location', 'Status', 'Discrepancy Type', 'Notes'];
      const rows = session.items.map(item => [
        item.asset.asset_tag,
        item.asset.make || '',
        item.asset.model || '',
        item.expected_location?.name || '',
        item.scanned_location?.name || '',
        item.status,
        item.discrepancy?.type || '',
        item.notes || '',
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="audit-${session.name}-${Date.now()}.csv"`)
        .send(csv);
    }

    return reply.code(501).send({ error: 'PDF format not yet implemented', code: 'NOT_IMPLEMENTED' });
  });
}

export { auditRoutes };