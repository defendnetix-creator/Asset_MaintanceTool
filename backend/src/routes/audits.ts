// backend/src/routes/audits.ts
// Audit routes - standard Fastify plugin pattern using passed app directly (no api instance)

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

// ============================================
// Zod Schemas for validation (input only)
// ============================================

const listAuditSessionsSchema = {
  querystring: {
    type: 'object',
    additionalProperties: true,
    properties: {
      page: { type: 'integer', minimum: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100 },
      status: { type: 'string' },
      scope_type: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              scope_type: { type: 'string' },
              scope_id: { type: 'string', nullable: true },
              scope_name: { type: 'string', nullable: true },
              status: { type: 'string' },
              start_at: { type: 'string', nullable: true },
              end_at: { type: 'string', nullable: true },
              scanned_count: { type: 'number' },
              total_assets: { type: 'number' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
            },
            required: ['id', 'name', 'scope_type', 'status', 'created_at', 'updated_at'],
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
    },
  },
};

const getAuditSessionSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  querystring: {
    type: 'object',
    additionalProperties: true,
    properties: {},
  },
  // No response validation - let Fastify pass through
};

const createAuditSessionSchema = {
  body: {
    type: 'object',
    additionalProperties: true,
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      scope_type: { type: 'string', enum: ['SITE', 'DEPARTMENT', 'ALL', 'BUILDING', 'FLOOR', 'ROOM'] },
      scope_id: { type: 'string', format: 'uuid' },
      due_at: { type: 'string' },
      lead_auditor_id: { type: 'string', format: 'uuid' },
      notify_assignees: { type: 'boolean' },
      require_signature: { type: 'boolean' },
      require_photo: { type: 'boolean' },
      offline_enabled: { type: 'boolean' },
    },
    required: ['name', 'scope_type'],
  },
  response: {
    201: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } }, required: ['id', 'name'] },
    400: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'string' } }, required: ['error', 'code'] },
  },
};

const updateAuditSessionSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  body: {
    type: 'object',
    additionalProperties: true,
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      scope_type: { type: 'string', enum: ['SITE', 'DEPARTMENT', 'ALL', 'BUILDING', 'FLOOR', 'ROOM'] },
      scope_id: { type: 'string', format: 'uuid' },
      due_at: { type: 'string' },
      lead_auditor_id: { type: 'string', format: 'uuid' },
      notify_assignees: { type: 'boolean' },
      require_signature: { type: 'boolean' },
      require_photo: { type: 'boolean' },
      offline_enabled: { type: 'boolean' },
    },
  },
  response: {
    200: { type: 'object', additionalProperties: true },
    400: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'string' } }, required: ['error', 'code'] },
    404: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'string' } }, required: ['error', 'code'] },
  },
};

const deleteAuditSessionSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  response: {
    200: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] },
    404: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'string' } }, required: ['error', 'code'] },
  },
};

const scanAssetSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  querystring: {
    type: 'object',
    additionalProperties: true,
    properties: {},
  },
  body: {
    type: 'object',
    additionalProperties: true,
    properties: {
      asset_tag: { type: 'string', minLength: 1 },
      location_id: { type: 'string' },
      status: { type: 'string' },
      notes: { type: 'string' },
      photo_base64: { type: 'string' },
    },
    required: ['asset_tag'],
  },
  response: {
    200: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] },
    400: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'string' } }, required: ['error', 'code'] },
    404: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'string' } }, required: ['error', 'code'] },
  },
};

const reconcileDiscrepancySchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' }, discrepancyId: { type: 'string', format: 'uuid' } },
    required: ['id', 'discrepancyId'],
  },
  body: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['confirm_match', 'mark_missing', 'mark_damaged', 'update_location', 'ignore'] },
      location_id: { type: 'string', format: 'uuid' },
    },
    required: ['action'],
  },
  response: {
    200: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] },
    400: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'string' } }, required: ['error', 'code'] },
    404: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'string' } }, required: ['error', 'code'] },
  },
};

const startAuditSessionSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  querystring: {
    type: 'object',
    additionalProperties: true,
    properties: {},
  },
  response: {
    200: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] },
    400: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'string' } }, required: ['error', 'code'] },
    404: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'string' } }, required: ['error', 'code'] },
  },
};

const completeAuditSessionSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  response: {
    200: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] },
    400: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'string' } }, required: ['error', 'code'] },
    404: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'string' } }, required: ['error', 'code'] },
  },
};

const exportReportSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  querystring: {
    type: 'object',
    properties: {
      format: { type: 'string', enum: ['pdf', 'csv', 'json'] },
    },
  },
  response: {
    200: { type: 'object' },
    404: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'string' } }, required: ['error', 'code'] },
  },
};

const auditRoutes: FastifyPluginAsync = async (app) => {
  // Use the app directly (it already has the prefix from app.register())
  // Don't create a new api instance - just add routes to app

  // List audit sessions
  app.get('/', { schema: listAuditSessionsSchema }, async (request) => {
    const { page = 1, limit = 25, status, scope_type } = request.query as { page: number; limit: number; status?: string; scope_type?: string };
    const tenantId = request.tenantId!;

    const where: any = { tenant_id: tenantId };
    if (status) where.status = status;
    if (scope_type) where.scope_type = scope_type;

    const [sessions, total] = await Promise.all([
      app.prisma.auditSession.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          // scope relation doesn't exist - scope_type/scope_id are polymorphic
          _count: { select: { items: true } },
        },
      }),
      app.prisma.auditSession.count({ where }),
    ]);

    return {
      data: sessions.map(s => ({
        ...s,
        scope_name: null, // polymorphic - resolved separately
        scanned_count: s._count.items,
        total_assets: s._count.items,
        _count: undefined,
      })),
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
  });

  // Get audit session by ID
    app.get('/:id', async (request, reply) => {
    const tenantId = request.tenantId!;
    const session = await app.prisma.auditSession.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
      include: {
        lead_auditor: { select: { id: true, first_name: true, last_name: true, email: true } },
        auditors: { select: { id: true, first_name: true, last_name: true, email: true } },
        items: {
          include: {
            asset: { select: { id: true, asset_tag: true, make: true, model: true, location_id: true } },
            expected_location: { select: { id: true, name: true } },
            scanned_location: { select: { id: true, name: true } },
            discrepancy: true,
          },
          orderBy: { created_at: 'asc' },
        },
        discrepancies: {
          include: {
            asset: { select: { id: true, asset_tag: true, make: true, model: true } },
            expected_location: { select: { id: true, name: true } },
            found_location: { select: { id: true, name: true } },
            resolved_by: { select: { id: true, first_name: true, last_name: true } },
          },
        },
      },
    });

    if (!session) {
      return reply.code(404).send({ error: 'Audit session not found', code: 'NOT_FOUND' });
    }

    // Calculate counts
    const found_count = session.items.filter(i => i.status === 'FOUND').length;
    const missing_count = session.items.filter(i => i.status === 'MISSING').length;
    const mismatched_count = session.items.filter(i => i.status === 'MISMATCHED').length;
    const damaged_count = session.items.filter(i => i.status === 'DAMAGED').length;

    return {
      ...session,
      found_count,
      missing_count,
      mismatched_count,
      damaged_count,
      scanned_count: session.items.length,
      total_assets: session.items.length,
    };
  });

  // Create audit session
  app.post('/', { schema: createAuditSessionSchema }, async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = (request.user as { id: string }).id;

    let scopeName = null;
    if (request.body.scope_id) {
      if (request.body.scope_type === 'SITE') {
        const site = await app.prisma.site.findFirst({ where: { id: request.body.scope_id, tenant_id: tenantId }, select: { name: true } });
        scopeName = site?.name || null;
      } else if (request.body.scope_type === 'DEPARTMENT') {
        const dept = await app.prisma.department.findFirst({ where: { id: request.body.scope_id, tenant_id: tenantId }, select: { name: true } });
        scopeName = dept?.name || null;
      }
    }

    const session = await app.prisma.auditSession.create({
      data: {
        tenant_id: tenantId,
        name: request.body.name,
        scope_type: request.body.scope_type,
        scope_id: request.body.scope_id,
        scope_name: scopeName,
        status: 'SCHEDULED',
        due_at: request.body.due_at ? new Date(request.body.due_at) : null,
        lead_auditor_id: request.body.lead_auditor_id || null,
        notify_assignees: request.body.notify_assignees ?? true,
        require_signature: request.body.require_signature ?? false,
        require_photo: request.body.require_photo ?? false,
        offline_enabled: request.body.offline_enabled ?? true,
        created_by_id: userId,
      },
    });

    return reply.status(201).send({ id: session.id, name: session.name });
  });

  // Update audit session
  app.put('/:id', { schema: updateAuditSessionSchema }, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.auditSession.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Audit session not found', code: 'NOT_FOUND' });
    }

    let scopeName = existing.scope_name;
    if (request.body.scope_id) {
      if (request.body.scope_type === 'SITE') {
        const site = await app.prisma.site.findFirst({ where: { id: request.body.scope_id, tenant_id: tenantId }, select: { name: true } });
        scopeName = site?.name || null;
      } else if (request.body.scope_type === 'DEPARTMENT') {
        const dept = await app.prisma.department.findFirst({ where: { id: request.body.scope_id, tenant_id: tenantId }, select: { name: true } });
        scopeName = dept?.name || null;
      }
    }

    const updated = await app.prisma.auditSession.update({
      where: { id: request.params.id },
      data: {
        ...request.body,
        scope_name: scopeName,
        due_at: request.body.due_at ? new Date(request.body.due_at) : null,
      },
    });

    return updated;
  });

  // Delete audit session
  app.delete('/:id', { schema: deleteAuditSessionSchema }, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.auditSession.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Audit session not found', code: 'NOT_FOUND' });
    }

    await app.prisma.auditSession.delete({
      where: { id: request.params.id },
    });

    return { message: 'Audit session deleted' };
  });

  // Start audit session
  app.post('/:id/start', { schema: startAuditSessionSchema }, async (request, reply) => {
    const tenantId = request.tenantId!;

    const session = await app.prisma.auditSession.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });

    if (!session) {
      return reply.code(404).send({ error: 'Audit session not found', code: 'NOT_FOUND' });
    }

    if (session.status !== 'SCHEDULED') {
      return reply.code(400).send({ error: 'Session not in scheduled status', code: 'INVALID_STATUS' });
    }

    // Get assets based on scope
    let assets: any[] = [];

    if (session.scope_type === 'SITE' && session.scope_id) {
      assets = await app.prisma.asset.findMany({
        where: { tenant_id: tenantId, site_id: session.scope_id, status: { not: 'DISPOSED' } },
        select: { id: true, asset_tag: true, location_id: true },
      });
    } else if (session.scope_type === 'DEPARTMENT' && session.scope_id) {
      assets = await app.prisma.asset.findMany({
        where: { tenant_id: tenantId, department_id: session.scope_id, status: { not: 'DISPOSED' } },
        select: { id: true, asset_tag: true, location_id: true },
      });
    } else if (session.scope_type === 'ALL') {
      assets = await app.prisma.asset.findMany({
        where: { tenant_id: tenantId, status: { not: 'DISPOSED' } },
        select: { id: true, asset_tag: true, location_id: true },
      });
    } else if (session.scope_type === 'BUILDING' && session.scope_id) {
      const location = await app.prisma.location.findFirst({ where: { id: session.scope_id } });
      if (location) {
        const locationIds = await getAllChildLocationIds(app, location.id);
        locationIds.push(location.id);
        assets = await app.prisma.asset.findMany({
          where: { tenant_id: tenantId, location_id: { in: locationIds }, status: { not: 'DISPOSED' } },
          select: { id: true, asset_tag: true, location_id: true },
        });
      }
    } else if (session.scope_type === 'FLOOR' && session.scope_id) {
      const location = await app.prisma.location.findFirst({ where: { id: session.scope_id } });
      if (location) {
        const locationIds = await getAllChildLocationIds(app, location.id);
        locationIds.push(location.id);
        assets = await app.prisma.asset.findMany({
          where: { tenant_id: tenantId, location_id: { in: locationIds }, status: { not: 'DISPOSED' } },
          select: { id: true, asset_tag: true, location_id: true },
        });
      }
    } else if (session.scope_type === 'ROOM' && session.scope_id) {
      const location = await app.prisma.location.findFirst({ where: { id: session.scope_id } });
      if (location) {
        const locationIds = await getAllChildLocationIds(app, location.id);
        locationIds.push(location.id);
        assets = await app.prisma.asset.findMany({
          where: { tenant_id: tenantId, location_id: { in: locationIds }, status: { not: 'DISPOSED' } },
          select: { id: true, asset_tag: true, location_id: true },
        });
      }
    }

    // Create audit items (use upsert to handle existing items)
    if (assets.length > 0) {
      for (const asset of assets) {
        await app.prisma.auditSessionItem.upsert({
          where: {
            session_id_asset_id: {
              session_id: session.id,
              asset_id: asset.id,
            },
          },
          create: {
            session_id: session.id,
            asset_id: asset.id,
            expected_location_id: asset.location_id,
            status: 'MISSING',
          },
          update: {
            expected_location_id: asset.location_id,
            status: 'MISSING',
          },
        });
      }
    }

    await app.prisma.auditSession.update({
      where: { id: session.id },
      data: { status: 'IN_PROGRESS', start_at: new Date() },
    });

    return { message: `Audit session started with ${assets.length} assets` };
  });

  // Helper: get all child location IDs recursively
  async function getAllChildLocationIds(app: FastifyInstance, parentId: string): Promise<string[]> {
    const children = await app.prisma.location.findMany({
      where: { parent_id: parentId },
      select: { id: true },
    });
    let ids = children.map(c => c.id);
    for (const child of children) {
      ids = ids.concat(await getAllChildLocationIds(app, child.id));
    }
    return ids;
  }

  // Scan asset
  app.post('/:id/scan', async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = (request.user as { id: string }).id;
    const { asset_tag, location_id, status = 'FOUND', notes, photo_base64 } = request.body as any;

    const session = await app.prisma.auditSession.findFirst({
      where: { id: request.params.id, tenant_id: tenantId, status: 'IN_PROGRESS' },
    });

    if (!session) {
      return reply.code(404).send({ error: 'Audit session not found or not in progress', code: 'NOT_FOUND' });
    }

    const item = await app.prisma.auditSessionItem.findFirst({
      where: { session_id: session.id, asset: { asset_tag } },
      include: { asset: true, expected_location: true },
    });

    if (!item) {
      return reply.code(404).send({ error: 'Asset not in this audit session', code: 'ASSET_NOT_IN_SESSION' });
    }

    if (item.status !== 'MISSING') {
      return reply.code(400).send({ error: 'Asset already scanned', code: 'ALREADY_SCANNED' });
    }

    let scannedLocation = null;
    if (location_id) {
      scannedLocation = await app.prisma.location.findFirst({ where: { id: location_id } });
    }

    let discrepancyId: string | null = null;

    if (item.expected_location_id !== location_id) {
      const discrepancy = await app.prisma.auditDiscrepancy.create({
        data: {
          session_id: session.id,
          asset_id: item.asset_id,
          type: 'LOCATION_MISMATCH',
          severity: 'MEDIUM',
          status: 'OPEN',
        },
      });
      discrepancyId = discrepancy.id;
    }

    await app.prisma.auditSessionItem.update({
      where: { id: item.id },
      data: {
        status,
        scanned_location: location_id ? { connect: { id: location_id } } : { disconnect: true },
        scanned_at: new Date(),
        scanned_by: { connect: { id: userId } },
        notes,
        discrepancy: discrepancyId ? { connect: { id: discrepancyId } } : { disconnect: true },
      },
    });

    if (photo_base64) {
      // Store photo - placeholder
    }

    return { message: `Asset scanned as ${status}` };
  });

  // Reconcile discrepancy
  app.post('/:id/discrepancies/:discrepancyId/resolve', { schema: reconcileDiscrepancySchema }, async (request, reply) => {
    const tenantId = request.tenantId!;
    const { action, location_id } = request.body as any;

    const discrepancy = await app.prisma.auditDiscrepancy.findFirst({
      where: { id: request.params.discrepancyId, session_id: request.params.id, tenant_id: tenantId },
      include: { asset: true },
    });

    if (!discrepancy) {
      return reply.code(404).send({ error: 'Discrepancy not found', code: 'NOT_FOUND' });
    }

    if (action === 'confirm_match') {
      await app.prisma.auditDiscrepancy.update({
        where: { id: discrepancy.id },
        data: { status: 'RESOLVED', resolved_at: new Date(), resolved_by_id: (request.user as { id: string }).id, resolution_notes: 'Confirmed match' },
      });
    } else if (action === 'mark_missing') {
      await app.prisma.auditDiscrepancy.update({
        where: { id: discrepancy.id },
        data: { status: 'RESOLVED', resolved_at: new Date(), resolved_by_id: (request.user as { id: string }).id, resolution_notes: 'Marked as missing' },
      });
      await app.prisma.auditSessionItem.update({
        where: { session_id: request.params.id, asset_id: discrepancy.asset_id },
        data: { status: 'MISSING' },
      });
    } else if (action === 'mark_damaged') {
      await app.prisma.auditDiscrepancy.update({
        where: { id: discrepancy.id },
        data: { status: 'RESOLVED', resolved_at: new Date(), resolved_by_id: (request.user as { id: string }).id, resolution_notes: 'Marked as damaged' },
      });
      await app.prisma.auditSessionItem.update({
        where: { session_id: request.params.id, asset_id: discrepancy.asset_id },
        data: { status: 'DAMAGED' },
      });
    } else if (action === 'update_location' && location_id) {
      await app.prisma.auditDiscrepancy.update({
        where: { id: discrepancy.id },
        data: { status: 'RESOLVED', resolved_at: new Date(), resolved_by_id: (request.user as { id: string }).id, resolution_notes: 'Location updated' },
      });
      await app.prisma.auditSessionItem.update({
        where: { session_id: request.params.id, asset_id: discrepancy.asset_id },
        data: { scanned_location_id: location_id, status: 'FOUND' },
      });
    } else if (action === 'ignore') {
      await app.prisma.auditDiscrepancy.update({
        where: { id: discrepancy.id },
        data: { status: 'IGNORED', resolved_at: new Date(), resolved_by_id: (request.user as { id: string }).id, resolution_notes: 'Ignored' },
      });
    }

    return { message: 'Discrepancy resolved' };
  });

  // Complete audit session
  app.post('/:id/complete', { schema: completeAuditSessionSchema }, async (request, reply) => {
    const tenantId = request.tenantId!;

    const session = await app.prisma.auditSession.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
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
  app.get('/:id/report', { schema: exportReportSchema }, async (request, reply) => {
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
};

export { auditRoutes };