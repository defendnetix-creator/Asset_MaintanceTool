// backend/src/routes/assets.ts
// Asset routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

// ============================================
// Zod Schemas
// ============================================

const assetListItemSchema = z.object({
  id: z.string(),
  asset_tag: z.string(),
  normalized_tag: z.string(),
  serial_number: z.string().nullable(),
  make: z.string().nullable(),
  model: z.string().nullable(),
  category_id: z.string().nullable(),
  site_id: z.string().nullable(),
  location_id: z.string().nullable(),
  department_id: z.string().nullable(),
  custodian_user_id: z.string().nullable(),
  custodian_group_id: z.string().nullable(),
  status: z.string(),
  condition: z.string().nullable(),
  purchase_date: z.string().nullable(),
  purchase_cost: z.number().nullable(),
  currency: z.string(),
  warranty_expires: z.string().nullable(),
  vendor_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  category: z.object({ id: z.string(), name: z.string(), color: z.string().nullable() }).nullable(),
  site: z.object({ id: z.string(), name: z.string() }).nullable(),
  location: z.object({ id: z.string(), name: z.string() }).nullable(),
  department: z.object({ id: z.string(), name: z.string() }).nullable(),
  custodian_user: z.object({ id: z.string(), first_name: z.string(), last_name: z.string(), email: z.string() }).nullable(),
  images: z.array(z.object({ url: z.string(), is_primary: z.boolean() })),
});

const assetsListResponse = z.object({
  data: z.array(assetListItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
});

const assetDetailResponse = z.object({
  id: z.string(),
  asset_tag: z.string(),
  normalized_tag: z.string(),
  serial_number: z.string().nullable(),
  make: z.string().nullable(),
  model: z.string().nullable(),
  category_id: z.string().nullable(),
  site_id: z.string().nullable(),
  location_id: z.string().nullable(),
  department_id: z.string().nullable(),
  custodian_user_id: z.string().nullable(),
  custodian_group_id: z.string().nullable(),
  status: z.string(),
  condition: z.string().nullable(),
  purchase_date: z.string().nullable(),
  purchase_cost: z.number().nullable(),
  currency: z.string(),
  warranty_expires: z.string().nullable(),
  vendor_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  category: z.object({ id: z.string(), name: z.string(), color: z.string().nullable() }).nullable(),
  site: z.object({ id: z.string(), name: z.string() }).nullable(),
  location: z.object({ id: z.string(), name: z.string() }).nullable(),
  department: z.object({ id: z.string(), name: z.string() }).nullable(),
  custodian_user: z.object({ id: z.string(), first_name: z.string(), last_name: z.string(), email: z.string() }).nullable(),
  custodian_group: z.object({ id: z.string(), name: z.string() }).nullable(),
  vendor: z.object({ id: z.string(), name: z.string() }).nullable(),
  created_by: z.object({ id: z.string(), first_name: z.string(), last_name: z.string() }).nullable(),
  updated_by: z.object({ id: z.string(), first_name: z.string(), last_name: z.string() }).nullable(),
  images: z.array(z.object({ id: z.string(), url: z.string(), is_primary: z.boolean(), caption: z.string().nullable() })),
  documents: z.array(z.object({ id: z.string(), filename: z.string(), mime_type: z.string(), size: z.number(), url: z.string(), uploaded_at: z.string() })),
  custom_fields: z.array(z.object({
    id: z.string(),
    name: z.string(),
    label: z.string(),
    type: z.string(),
    value_text: z.string().nullable(),
    value_number: z.number().nullable(),
    value_boolean: z.boolean().nullable(),
    value_date: z.string().nullable(),
    value_json: z.unknown().nullable(),
  })),
  tags: z.array(z.object({ id: z.string(), tag: z.string() })),
});

const createAssetInput = z.object({
  asset_tag: z.string().min(1).max(50).regex(/^[A-Za-z0-9_-]+$/),
  serial_number: z.string().max(50).optional(),
  make: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  category_id: z.string().uuid().optional(),
  site_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional(),
  custodian_user_id: z.string().uuid().optional(),
  custodian_group_id: z.string().uuid().optional(),
  status: z.enum(['IN_STOCK', 'ASSIGNED', 'IN_REPAIR', 'ON_LOAN', 'RETIRED', 'DISPOSED']).default('IN_STOCK'),
  condition: z.string().max(50).default('Good'),
  purchase_date: z.string().datetime().optional(),
  purchase_cost: z.number().positive().optional(),
  currency: z.string().length(3).default('USD'),
  warranty_expires: z.string().datetime().optional(),
  vendor_id: z.string().uuid().optional(),
  custom_fields: z.record(z.unknown()).optional(),
});

const updateAssetInput = z.object({
  asset_tag: z.string().min(1).max(50).regex(/^[A-Za-z0-9_-]+$/).optional(),
  serial_number: z.string().max(50).optional().nullable(),
  make: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  site_id: z.string().uuid().optional().nullable(),
  location_id: z.string().uuid().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  custodian_user_id: z.string().uuid().optional().nullable(),
  custodian_group_id: z.string().uuid().optional().nullable(),
  status: z.enum(['IN_STOCK', 'ASSIGNED', 'IN_REPAIR', 'ON_LOAN', 'RETIRED', 'DISPOSED']).optional(),
  condition: z.string().max(50).optional().nullable(),
  purchase_date: z.string().datetime().optional().nullable(),
  purchase_cost: z.number().positive().optional().nullable(),
  currency: z.string().length(3).optional(),
  warranty_expires: z.string().datetime().optional().nullable(),
  vendor_id: z.string().uuid().optional().nullable(),
  custom_fields: z.record(z.unknown()).optional(),
});

const bulkAssetOperationInput = z.object({
  action: z.enum(['delete', 'update_status', 'assign_custodian', 'assign_location', 'export']),
  asset_ids: z.array(z.string().uuid()).min(1).max(1000),
  data: z.object({
    status: z.enum(['IN_STOCK', 'ASSIGNED', 'IN_REPAIR', 'ON_LOAN', 'RETIRED', 'DISPOSED']).optional(),
    custodian_user_id: z.string().uuid().optional(),
    custodian_group_id: z.string().uuid().optional(),
    site_id: z.string().uuid().optional(),
    location_id: z.string().uuid().optional(),
  }).optional(),
});

const exportFilters = z.object({
  format: z.enum(['csv', 'xlsx', 'json']).default('csv'),
  status: z.string().optional(),
  category_id: z.string().uuid().optional(),
  site_id: z.string().uuid().optional(),
});

const importPreviewInput = z.object({
  file: z.string(),
  format: z.enum(['csv', 'json']),
});

const importCommitInput = z.object({
  rows: z.array(z.object({
    asset_tag: z.string(),
    make: z.string().optional(),
    model: z.string().optional(),
    serial_number: z.string().optional(),
    category: z.string().optional(),
    site: z.string().optional(),
    location: z.string().optional(),
    status: z.string().optional(),
  })),
  idempotency_key: z.string(),
});

const createAssetResponse = z.object({ id: z.string(), asset_tag: z.string() });
const updateAssetResponse = z.object({ id: z.string() });
const deleteAssetResponse = z.object({ message: z.string() });
const bulkOperationResponse = z.object({ processed: z.number(), failed: z.number(), errors: z.array(z.object({ id: z.string(), error: z.string() })) });
const errorResponse = z.object({ error: z.string(), code: z.string() });

// ============================================
// Route Handlers
// ============================================

const listAssetsSchema = {
  querystring: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(25),
    sort: z.string().default('created_at'),
    order: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().optional(),
    status: z.string().optional(),
    category_id: z.string().uuid().optional(),
    site_id: z.string().uuid().optional(),
    location_id: z.string().uuid().optional(),
    department_id: z.string().uuid().optional(),
    custodian_user_id: z.string().uuid().optional(),
    custodian_group_id: z.string().uuid().optional(),
    warranty_expiring_days: z.coerce.number().int().positive().optional(),
    created_after: z.string().datetime().optional(),
    created_before: z.string().datetime().optional(),
  }),
  response: { 200: assetsListResponse },
};

const getAssetSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: assetDetailResponse, 404: z.object({ error: z.string(), code: z.string() }) },
};

const createAssetSchema = {
  body: createAssetInput,
  response: { 201: createAssetResponse, 400: errorResponse, 409: errorResponse },
};

const updateAssetSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: updateAssetInput,
  response: { 200: updateAssetResponse, 404: errorResponse, 409: errorResponse },
};

const deleteAssetSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: deleteAssetResponse, 404: errorResponse },
};

const bulkOperationSchema = {
  body: bulkAssetOperationInput,
  response: { 200: bulkOperationResponse },
};

const exportAssetsSchema = {
  querystring: exportFilters,
};

const importPreviewSchema = {
  body: importPreviewInput,
  response: { 200: z.object({ preview: z.array(z.object({ row: z.number(), asset_tag: z.string(), make: z.string().optional(), model: z.string().optional(), serial_number: z.string().optional(), category: z.string().optional(), site: z.string().optional(), location: z.string().optional(), status: z.string().optional(), validation: z.object({ valid: z.boolean(), errors: z.array(z.string()), warnings: z.array(z.string()) }) })), summary: z.object({ total: z.number(), valid: z.number(), invalid: z.number() }) }) },
};

const importCommitSchema = {
  body: importCommitInput,
  response: { 200: z.object({ created: z.number(), errors: z.array(z.object({ row: z.number(), error: z.string() })) }) },
};

const errorResponse = z.object({ error: z.string(), code: z.string() });
const createAssetResponse = z.object({ id: z.string(), asset_tag: z.string() });
const updateAssetResponse = z.object({ id: z.string() });
const deleteAssetResponse = z.object({ message: z.string() });
const bulkOperationResponse = z.object({ processed: z.number(), failed: z.number(), errors: z.array(z.object({ id: z.string(), error: z.string() })) });

export async function assetRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List assets with filtering, pagination, sorting
  api.get('/', { schema: listAssetsSchema }, async (request) => {
    const { page, limit, sort, order, search, ...filters } = request.query;
    const tenantId = request.tenantId!;

    const where: Record<string, unknown> = { tenant_id: tenantId, deleted_at: null };

    if (filters.search) {
      where.OR = [
        { asset_tag: { contains: filters.search, mode: 'insensitive' } },
        { serial_number: { contains: filters.search, mode: 'insensitive' } },
        { make: { contains: filters.search, mode: 'insensitive' } },
        { model: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status) where.status = filters.status;
    if (filters.category_id) where.category_id = filters.category_id;
    if (filters.site_id) where.site_id = filters.site_id;
    if (filters.location_id) where.location_id = filters.location_id;
    if (filters.department_id) where.department_id = filters.department_id;
    if (filters.custodian_user_id) where.custodian_user_id = filters.custodian_user_id;
    if (filters.custodian_group_id) where.custodian_group_id = filters.custodian_group_id;

    if (filters.warranty_expiring_days) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + filters.warranty_expiring_days);
      where.warranty_expires = { lte: expiryDate, gte: new Date() };
    }

    if (filters.created_after || filters.created_before) {
      where.created_at = {};
      if (filters.created_after) where.created_at.gte = new Date(filters.created_after);
      if (filters.created_before) where.created_at.lte = new Date(filters.created_before);
    }

    const allowedSortFields = ['created_at', 'updated_at', 'asset_tag', 'make', 'model', 'status', 'purchase_date'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
    const orderBy = { [sortField]: order };

    const [assets, total] = await Promise.all([
      app.prisma.asset.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, color: true } },
          site: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          custodian_user: { select: { id: true, first_name: true, last_name: true, email: true } },
          images: { where: { is_primary: true }, select: { url: true, is_primary: true }, take: 1 },
        },
      }),
      app.prisma.asset.count({ where }),
    ]);

    return { data: assets, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
  });

  // Get single asset
  api.get('/:id', { schema: { params: z.object({ id: z.string().uuid() }), response: { 200: assetDetailResponse, 404: z.object({ error: z.string(), code: z.string() }) } } }, async (request, reply) => {
    const asset = await app.prisma.asset.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId!, deleted_at: null },
      include: {
        category: { select: { id: true, name: true, color: true } },
        site: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        custodian_user: { select: { id: true, first_name: true, last_name: true, email: true } },
        custodian_group: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
        created_by: { select: { id: true, first_name: true, last_name: true } },
        updated_by: { select: { id: true, first_name: true, last_name: true } },
        images: { select: { id: true, url: true, is_primary: true, caption: true }, orderBy: { is_primary: 'desc' } },
        documents: { select: { id: true, filename: true, mime_type: true, size: true, url: true, uploaded_at: true }, orderBy: { uploaded_at: 'desc' } },
        custom_fields: {
          include: { custom_field: { select: { id: true, name: true, label: true, type: true } } },
        },
        tags: { select: { id: true, tag: true } },
      },
    });

    if (!asset) {
      return reply.code(404).send({ error: 'Asset not found', code: 'NOT_FOUND' });
    }

    return asset;
  });

  // Create asset
  api.post('/', { schema: { body: createAssetInput, response: { 201: createAssetResponse, 400: errorResponse, 409: errorResponse } } }, async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    const normalizedTag = request.body.asset_tag.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    const existing = await app.prisma.asset.findFirst({
      where: { tenant_id: tenantId, normalized_tag: normalizedTag, deleted_at: null },
    });
    if (existing) {
      return reply.code(409).send({ error: `Asset tag ${normalizedTag} already exists`, code: 'DUPLICATE_TAG' });
    }

    if (request.body.category_id) {
      const cat = await app.prisma.category.findFirst({ where: { id: request.body.category_id, tenant_id: tenantId } });
      if (!cat) return reply.code(400).send({ error: 'Invalid category', code: 'INVALID_CATEGORY' });
    }
    if (request.body.site_id) {
      const site = await app.prisma.site.findFirst({ where: { id: request.body.site_id, tenant_id: tenantId } });
      if (!site) return reply.code(400).send({ error: 'Invalid site', code: 'INVALID_SITE' });
    }
    if (request.body.location_id) {
      const loc = await app.prisma.location.findFirst({ where: { id: request.body.location_id, tenant_id: tenantId } });
      if (!loc) return reply.code(400).send({ error: 'Invalid location', code: 'INVALID_LOCATION' });
    }
    if (request.body.department_id) {
      const dept = await app.prisma.department.findFirst({ where: { id: request.body.department_id, tenant_id: tenantId } });
      if (!dept) return reply.code(400).send({ error: 'Invalid department', code: 'INVALID_DEPARTMENT' });
    }
    if (request.body.custodian_user_id) {
      const user = await app.prisma.user.findFirst({ where: { id: request.body.custodian_user_id, tenant_id: tenantId } });
      if (!user) return reply.code(400).send({ error: 'Invalid custodian user', code: 'INVALID_CUSTODIAN' });
    }
    if (request.body.custodian_group_id) {
      const group = await app.prisma.userGroup.findFirst({ where: { id: request.body.custodian_group_id, tenant_id: tenantId } });
      if (!group) return reply.code(400).send({ error: 'Invalid custodian group', code: 'INVALID_GROUP' });
    }
    if (request.body.vendor_id) {
      const vendor = await app.prisma.vendor.findFirst({ where: { id: request.body.vendor_id, tenant_id: tenantId } });
      if (!vendor) return reply.code(400).send({ error: 'Invalid vendor', code: 'INVALID_VENDOR' });
    }

    const { custom_fields, ...assetData } = request.body;

    const asset = await app.prisma.asset.create({
      data: {
        ...assetData,
        asset_tag: request.body.asset_tag,
        normalized_tag: normalizedTag,
        tenant_id: tenantId,
        created_by_id: request.user!.id,
      },
    });

    if (custom_fields) {
      await Promise.all(Object.entries(custom_fields).map(async ([key, value]) => {
        const cf = await app.prisma.customField.findFirst({ where: { tenant_id: tenantId, name: key, entity_type: 'asset', is_active: true } });
        if (cf) {
          const value: Record<string, unknown> = {};
          switch (cf.type) {
            case 'text': value.value_text = String(value); break;
            case 'number': value.value_number = Number(value); break;
            case 'boolean': value.value_boolean = Boolean(value); break;
            case 'date': value.value_date = new Date(String(value)); break;
            default: value.value_json = value;
          }
          await app.prisma.assetCustomFieldValue.create({
            data: { asset_id: asset.id, custom_field_id: cf.id, ...value },
          });
        }
      }));
    }

    await app.prisma.assetEvent.create({
      data: {
        asset_id: asset.id,
        tenant_id: tenantId,
        event_type: 'CHECK_IN',
        performed_by_id: request.user!.id,
        metadata: { action: 'CREATE', data: asset },
      },
    });

    return reply.code(201).send({ id: asset.id, asset_tag: asset.asset_tag });
  });

  // Update asset
  api.patch('/:id', { schema: { params: z.object({ id: z.string().uuid() }), body: updateAssetInput, response: { 200: z.object({ id: z.string() }), 404: errorResponse, 409: errorResponse } } }, async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    const asset = await app.prisma.asset.findFirst({
      where: { id: request.params.id, tenant_id: tenantId, deleted_at: null },
    });

    if (!asset) {
      return reply.code(404).send({ error: 'Asset not found', code: 'NOT_FOUND' });
    }

    const updates: Record<string, unknown> = {};
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    if (request.body.asset_tag && request.body.asset_tag !== asset.asset_tag) {
      const normalizedTag = request.body.asset_tag.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      const existing = await app.prisma.asset.findFirst({
        where: { tenant_id: tenantId, normalized_tag: normalizedTag, deleted_at: null, NOT: { id: asset.id } },
      });
      if (existing) {
        return reply.code(409).send({ error: `Asset tag ${normalizedTag} already exists`, code: 'DUPLICATE_TAG' });
      }
      updates.asset_tag = request.body.asset_tag;
      updates.normalized_tag = normalizedTag;
      changes.asset_tag = { old: asset.asset_tag, new: updates.asset_tag };
    }

    const fieldsToTrack = [
      'serial_number', 'make', 'model', 'category_id', 'site_id', 'location_id',
      'department_id', 'custodian_user_id', 'custodian_group_id', 'status',
      'condition', 'purchase_date', 'purchase_cost', 'currency', 'warranty_expires', 'vendor_id'
    ];

    for (const field of fieldsToTrack) {
      if (request.body[field] !== undefined && request.body[field] !== asset[field]) {
        changes[field] = { old: asset[field], new: request.body[field] };
        updates[field] = request.body[field];
      }
    }

    if (request.body.custom_fields) {
      for (const [key, value] of Object.entries(request.body.custom_fields)) {
        const cf = await app.prisma.customField.findFirst({ where: { tenant_id: tenantId, name: key, entity_type: 'asset', is_active: true } });
        if (cf) {
          const value: Record<string, unknown> = {};
          switch (cf.type) {
            case 'text': value.value_text = String(value); break;
            case 'number': value.value_number = Number(value); break;
            case 'boolean': value.value_boolean = Boolean(value); break;
            case 'date': value.value_date = new Date(String(value)); break;
            default: value.value_json = value;
          }
          await app.prisma.assetCustomFieldValue.upsert({
            where: { asset_id_custom_field_id: { asset_id: asset.id, custom_field_id: cf.id } },
            update: value,
            create: { asset_id: asset.id, custom_field_id: cf.id, ...value },
          });
        }
      }
    }

    const updated = await app.prisma.asset.update({
      where: { id: request.params.id },
      data: { ...updates, updated_by_id: request.user!.id },
    });

    await app.prisma.assetEvent.create({
      data: {
        asset_id: updated.id,
        tenant_id: request.tenantId!,
        event_type: 'STATUS_CHANGE',
        performed_by_id: request.user!.id,
        metadata: { changes },
      },
    });

    return { id: updated.id };
  });

  // Delete asset (soft delete)
  api.delete('/:id', { schema: { params: z.object({ id: z.string().uuid() }), response: { 200: z.object({ message: z.string() }), 404: errorResponse } } }, async (request, reply) => {
    const asset = await app.prisma.asset.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId!, deleted_at: null },
    });

    if (!asset) {
      return reply.code(404).send({ error: 'Asset not found', code: 'NOT_FOUND' });
    }

    await app.prisma.asset.update({
      where: { id: request.params.id },
      data: { deleted_at: new Date(), updated_by_id: request.user!.id },
    });

    await app.prisma.assetEvent.create({
      data: {
        asset_id: asset.id,
        tenant_id: request.tenantId!,
        event_type: 'CHECK_OUT',
        performed_by_id: request.user!.id,
        metadata: { action: 'DELETE', asset_tag: asset.asset_tag },
      },
    });

    return { message: 'Asset deleted successfully' };
  });

  // Bulk operations
  api.post('/bulk', { schema: { body: bulkAssetOperationInput, response: { 200: bulkOperationResponse } } }, async (request, reply) => {
    const { action, asset_ids, data } = request.body;
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    const assets = await app.prisma.asset.findMany({
      where: { id: { in: asset_ids }, tenant_id: tenantId, deleted_at: null },
      select: { id: true, asset_tag: true },
    });

    const foundIds = new Set(assets.map(a => a.id));
    const errors = asset_ids.filter(id => !foundIds.has(id)).map(id => ({ id, error: 'Asset not found' }));

    let processed = 0;
    const batchErrors = [...errors];

    for (const assetId of asset_ids) {
      if (!foundIds.has(assetId)) continue;

      try {
        switch (action) {
          case 'delete':
            await app.prisma.asset.update({ where: { id: assetId }, data: { deleted_at: new Date(), updated_by_id: request.user!.id } });
            break;
          case 'update_status':
            await app.prisma.asset.update({ where: { id: assetId }, data: { status: data!.status, updated_by_id: request.user!.id } });
            break;
          case 'assign_custodian':
            await app.prisma.asset.update({ where: { id: assetId }, data: { custodian_user_id: data!.custodian_user_id, updated_by_id: request.user!.id } });
            break;
          case 'assign_location':
            await app.prisma.asset.update({ where: { id: assetId }, data: { site_id: data!.site_id, location_id: data!.location_id, updated_by_id: request.user!.id } });
            break;
        }
        processed++;
      } catch (e) {
        batchErrors.push({ id: assetId, error: e instanceof Error ? e.message : 'Unknown error' });
      }
    }

    return { processed, failed: batchErrors.length, errors: batchErrors };
  });

  // Export assets
  api.get('/export', { schema: { querystring: exportFilters } }, async (request, reply) => {
    const tenantId = request.tenantId!;
    const { format, ...filters } = request.query;

    const where: Record<string, unknown> = { tenant_id: tenantId, deleted_at: null };
    if (filters.status) where.status = filters.status;
    if (filters.category_id) where.category_id = filters.category_id;
    if (filters.site_id) where.site_id = filters.site_id;

    const assets = await app.prisma.asset.findMany({
      where,
      include: {
        category: { select: { name: true } },
        site: { select: { name: true } },
        location: { select: { name: true } },
        department: { select: { name: true } },
        custodian_user: { select: { first_name: true, last_name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    if (format === 'json') {
      return reply.header('Content-Type', 'application/json').send(assets);
    }

    const headers = [
      'Asset Tag', 'Serial Number', 'Make', 'Model', 'Category', 'Site', 'Location', 'Department',
      'Custodian', 'Status', 'Condition', 'Purchase Date', 'Purchase Cost', 'Currency', 'Warranty Expires', 'Created At'
    ];

    const rows = assets.map(a => [
      a.asset_tag,
      a.serial_number || '',
      a.make || '',
      a.model || '',
      a.category?.name || '',
      a.site?.name || '',
      a.location?.name || '',
      a.department?.name || '',
      a.custodian_user ? `${a.custodian_user.first_name} ${a.custodian_user.last_name} (${a.custodian_user.email})` : '',
      a.status,
      a.condition || '',
      a.purchase_date ? new Date(a.purchase_date).toLocaleDateString() : '',
      a.purchase_cost?.toString() || '',
      a.currency,
      a.warranty_expires ? new Date(a.warranty_expires).toLocaleDateString() : '',
      new Date(a.created_at).toLocaleDateString(),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');

    const filename = `assets-export-${new Date().toISOString().split('T')[0]}.csv`;
    return reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(csv);
  });

  // Import preview
  api.post('/import/preview', { schema: importPreviewSchema }, async (request, reply) => {
    return { preview: [], summary: { total: 0, valid: 0, invalid: 0 } };
  });

  // Commit import
  api.post('/import/commit', { schema: importCommitSchema }, async (request, reply) => {
    return { created: 0, errors: [] };
  });
}

export { assetRoutes };