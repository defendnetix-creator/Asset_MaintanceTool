// backend/src/routes/assets.ts
// Asset routes - using inline JSON schemas for Fastify compatibility

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

// ============================================
// Zod Schemas for validation (input only)
// ============================================

const createAssetInput = z.object({
  asset_tag: z.string().min(1).max(50),
  serial_number: z.string().max(50).optional(),
  make: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  category_id: z.string().optional(),
  site_id: z.string().optional(),
  location_id: z.string().optional(),
  department_id: z.string().optional(),
  custodian_user_id: z.string().optional(),
  custodian_group_id: z.string().optional(),
  status: z.string().optional(),
  condition: z.string().max(50).optional(),
  purchase_date: z.string().optional(),
  purchase_cost: z.number().optional(),
  currency: z.string().min(1).max(10).optional(),
  warranty_expires: z.string().optional(),
  vendor_id: z.string().optional(),
  custom_fields: z.record(z.unknown()).optional(),
});

const updateAssetInput = z.object({
  asset_tag: z.string().min(1).max(50).optional(),
  serial_number: z.string().max(50).optional().nullable(),
  make: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  category_id: z.string().optional().nullable(),
  site_id: z.string().optional().nullable(),
  location_id: z.string().optional().nullable(),
  department_id: z.string().optional().nullable(),
  custodian_user_id: z.string().optional().nullable(),
  custodian_group_id: z.string().optional().nullable(),
  status: z.string().optional(),
  condition: z.string().max(50).optional().nullable(),
  purchase_date: z.string().optional().nullable(),
  purchase_cost: z.number().optional().nullable(),
  currency: z.string().min(1).max(10).optional(),
  warranty_expires: z.string().optional().nullable(),
  vendor_id: z.string().optional().nullable(),
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

const errorResponse = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    code: { type: 'string' },
  },
  required: ['error', 'code'],
};

const messageResponse = {
  type: 'object',
  properties: {
    message: { type: 'string' },
  },
  required: ['message'],
};

const assetsListResponse = {
  type: 'object',
  properties: {
    data: { 
      type: 'array', 
      items: { 
        type: 'object',
        properties: {
          id: { type: 'string' },
          asset_tag: { type: 'string' },
          normalized_tag: { type: 'string' },
          serial_number: { type: 'string', nullable: true },
          make: { type: 'string', nullable: true },
          model: { type: 'string', nullable: true },
          category_id: { type: 'string', nullable: true },
          site_id: { type: 'string', nullable: true },
          location_id: { type: 'string', nullable: true },
          department_id: { type: 'string', nullable: true },
          custodian_user_id: { type: 'string', nullable: true },
          custodian_group_id: { type: 'string', nullable: true },
          status: { type: 'string' },
          condition: { type: 'string', nullable: true },
          purchase_date: { type: 'string', nullable: true },
          purchase_cost: { type: 'number', nullable: true },
          currency: { type: 'string' },
          warranty_expires: { type: 'string', nullable: true },
          vendor_id: { type: 'string', nullable: true },
          created_at: { type: 'string' },
          updated_at: { type: 'string' },
          category: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, color: { type: 'string', nullable: true } }, nullable: true },
          site: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } }, nullable: true },
          location: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } }, nullable: true },
          department: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } }, nullable: true },
          custodian_user: { type: 'object', properties: { id: { type: 'string' }, first_name: { type: 'string' }, last_name: { type: 'string' }, email: { type: 'string' } }, nullable: true },
          images: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, is_primary: { type: 'boolean' } } } },
        },
        required: ['id', 'asset_tag', 'normalized_tag', 'status', 'condition', 'currency', 'created_at', 'updated_at'],
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
};

const listAssetsSchema = {
  querystring: {
    type: 'object',
    additionalProperties: true,
  },
  response: { 
    200: assetsListResponse,
  },
};

const getAssetSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  // Disable response validation entirely - let Fastify pass through raw response
  response: {
    404: errorResponse,
  },
};

const createAssetSchema = {
  body: {
    type: 'object',
    additionalProperties: true,
    properties: {
      asset_tag: { type: 'string', minLength: 1, maxLength: 50 },
      serial_number: { type: 'string', maxLength: 50 },
      make: { type: 'string', maxLength: 100 },
      model: { type: 'string', maxLength: 100 },
      category_id: { type: 'string' },
      site_id: { type: 'string' },
      location_id: { type: 'string' },
      department_id: { type: 'string' },
      custodian_user_id: { type: 'string' },
      custodian_group_id: { type: 'string' },
      status: { type: 'string' },
      condition: { type: 'string', maxLength: 50 },
      purchase_date: { type: 'string' },
      purchase_cost: { type: 'number' },
      currency: { type: 'string', minLength: 1, maxLength: 10 },
      warranty_expires: { type: 'string' },
      vendor_id: { type: 'string' },
      custom_fields: { type: 'object' },
    },
    required: ['asset_tag'],
  },
  response: { 
    201: { type: 'object', properties: { id: { type: 'string' }, asset_tag: { type: 'string' } }, required: ['id', 'asset_tag'] },
    400: errorResponse,
    409: errorResponse,
  },
};

const updateAssetSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  body: {
    type: 'object',
    additionalProperties: true,
    properties: {
      asset_tag: { type: 'string', minLength: 1, maxLength: 50 },
      serial_number: { type: 'string', maxLength: 50 },
      make: { type: 'string', maxLength: 100 },
      model: { type: 'string', maxLength: 100 },
      category_id: { type: 'string' },
      site_id: { type: 'string' },
      location_id: { type: 'string' },
      department_id: { type: 'string' },
      custodian_user_id: { type: 'string' },
      custodian_group_id: { type: 'string' },
      status: { type: 'string' },
      condition: { type: 'string', maxLength: 50 },
      purchase_date: { type: 'string' },
      purchase_cost: { type: 'number' },
      currency: { type: 'string', minLength: 1, maxLength: 10 },
      warranty_expires: { type: 'string' },
      vendor_id: { type: 'string' },
      custom_fields: { type: 'object' },
    },
  },
  response: { 
    200: { type: 'object', additionalProperties: true },
    404: errorResponse,
    409: errorResponse,
  },
};

const deleteAssetSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  response: { 
    200: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] },
    404: errorResponse,
  },
};

const bulkOperationSchema = {
  body: {
    type: 'object',
    additionalProperties: true,
    properties: {
      action: { type: 'string', enum: ['delete', 'update_status', 'assign_custodian', 'assign_location', 'export'] },
      asset_ids: { type: 'array', items: { type: 'string', format: 'uuid' }, minItems: 1, maxItems: 1000 },
      data: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['IN_STOCK', 'ASSIGNED', 'IN_REPAIR', 'ON_LOAN', 'RETIRED', 'DISPOSED'] },
          custodian_user_id: { type: 'string', format: 'uuid' },
          custodian_group_id: { type: 'string', format: 'uuid' },
          site_id: { type: 'string', format: 'uuid' },
          location_id: { type: 'string', format: 'uuid' },
        },
      },
    },
    required: ['action', 'asset_ids'],
  },
  response: { 
    200: { type: 'object', additionalProperties: true },
    400: errorResponse,
  },
};

const exportAssetsSchema = {
  querystring: {
    type: 'object',
    additionalProperties: true,
    properties: {
      format: { type: 'string', enum: ['csv', 'xlsx', 'json'] },
      status: { type: 'string' },
      category_id: { type: 'string', format: 'uuid' },
      site_id: { type: 'string', format: 'uuid' },
    },
  },
};

const importPreviewSchema = {
  body: {
    type: 'object',
    additionalProperties: true,
    properties: {
      file: { type: 'string' },
      format: { type: 'string', enum: ['csv', 'json'] },
    },
    required: ['file', 'format'],
  },
  response: { 
    200: { type: 'object', additionalProperties: true },
    400: errorResponse,
  },
};

const importCommitSchema = {
  body: {
    type: 'object',
    additionalProperties: true,
    properties: {
      rows: { 
        type: 'array', 
        items: { 
          type: 'object',
          properties: {
            asset_tag: { type: 'string' },
            make: { type: 'string' },
            model: { type: 'string' },
            serial_number: { type: 'string' },
            category: { type: 'string' },
            site: { type: 'string' },
            location: { type: 'string' },
            status: { type: 'string' },
          },
          required: ['asset_tag'],
        } 
      },
      idempotency_key: { type: 'string' },
    },
    required: ['rows', 'idempotency_key'],
  },
  response: { 
    200: { type: 'object', additionalProperties: true },
    400: errorResponse,
  },
};

async function assetRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List assets with filtering, pagination, sorting
  api.get('/', { schema: listAssetsSchema }, async (request) => {
    const { page = 1, limit = 25, sort = 'created_at', order = 'desc', search, status, category_id, site_id, location_id, department_id, custodian_user_id, custodian_group_id, warranty_expiring_days, created_after, created_before } = request.query as any;
    const tenantId = request.tenantId!;

    const where: any = { tenant_id: tenantId };
    if (search) {
      where.OR = [
        { asset_tag: { contains: search, mode: 'insensitive' } },
        { serial_number: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (category_id) where.category_id = category_id;
    if (site_id) where.site_id = site_id;
    if (location_id) where.location_id = location_id;
    if (department_id) where.department_id = department_id;
    if (custodian_user_id) where.custodian_user_id = custodian_user_id;
    if (custodian_group_id) where.custodian_group_id = custodian_group_id;

    const [assets, total] = await Promise.all([
      app.prisma.asset.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
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

    return {
      data: assets.map(a => ({
        ...a,
        images: a.images || [],
        normalized_tag: a.asset_tag.toUpperCase(),
        custodian_user: a.custodian_user || null,
      })),
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
  });

  // Get asset by ID
  api.get('/:id', { schema: getAssetSchema }, async (request, reply) => {
    const asset = await app.prisma.asset.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
      include: {
        category: true,
        site: true,
        location: true,
        department: true,
        custodian_user: { select: { id: true, first_name: true, last_name: true, email: true } },
        created_by: { select: { id: true, first_name: true, last_name: true } },
        updated_by: { select: { id: true, first_name: true, last_name: true } },
        images: true,
        documents: true,
        custom_fields: { include: { custom_field: true } },
        tags: { select: { id: true, tag: true } },
      },
    });

    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found', code: 'NOT_FOUND' });
    }

    return asset;
  });

  // Create asset
  api.post('/', { schema: createAssetSchema }, async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = (request.user as { id: string }).id;

    const existing = await app.prisma.asset.findFirst({
      where: { tenant_id: tenantId, asset_tag: request.body.asset_tag },
    });
    if (existing) {
      return reply.status(409).send({ error: 'Asset tag already exists', code: 'TAG_EXISTS' });
    }

    const { custom_fields, ...data } = request.body as any;

    // Generate normalized_tag from asset_tag (uppercase)
    const normalized_tag = data.asset_tag.toUpperCase();

    // Map foreign key fields to relation fields for Prisma
    const createData: any = {
      tenant_id: tenantId,
      ...data,
      normalized_tag,
      created_by: { connect: { id: userId } },
      updated_by: { connect: { id: userId } },
    };
    
    // Convert _id fields to relation connects
    if (data.category_id) createData.category = { connect: { id: data.category_id } };
    if (data.site_id) createData.site = { connect: { id: data.site_id } };
    if (data.location_id) createData.location = { connect: { id: data.location_id } };
    if (data.department_id) createData.department = { connect: { id: data.department_id } };
    if (data.custodian_user_id) createData.custodian_user = { connect: { id: data.custodian_user_id } };
    
    // Remove _id fields from create data
    delete createData.category_id;
    delete createData.site_id;
    delete createData.location_id;
    delete createData.department_id;
    delete createData.custodian_user_id;

    const asset = await app.prisma.asset.create({
      data: createData,
    });

    // Handle custom fields
    if (custom_fields) {
      for (const [fieldId, value] of Object.entries(custom_fields)) {
        await app.prisma.assetCustomFieldValue.create({
          data: {
            asset_id: asset.id,
            field_definition_id: fieldId,
            value_text: typeof value === 'string' ? value : null,
            value_number: typeof value === 'number' ? value : null,
            value_boolean: typeof value === 'boolean' ? value : null,
            value_date: value instanceof Date ? value.toISOString() : null,
            value_json: typeof value === 'object' && value !== null ? value : null,
          },
        });
      }
    }

    return reply.status(201).send({ id: asset.id, asset_tag: asset.asset_tag });
  });

  // Update asset
  api.put('/:id', { schema: updateAssetSchema }, async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = (request.user as { id: string }).id;

    const existing = await app.prisma.asset.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.status(404).send({ error: 'Asset not found', code: 'NOT_FOUND' });
    }

    const { custom_fields, ...data } = request.body as any;

    // Map foreign key fields to relation fields for Prisma
    const updateData: any = {
      ...data,
      updated_by: { connect: { id: userId } },
    };
    
    // Convert _id fields to relation connects
    if (data.category_id) updateData.category = { connect: { id: data.category_id } };
    if (data.site_id) updateData.site = { connect: { id: data.site_id } };
    if (data.location_id) updateData.location = { connect: { id: data.location_id } };
    if (data.department_id) updateData.department = { connect: { id: data.department_id } };
    if (data.custodian_user_id) updateData.custodian_user = { connect: { id: data.custodian_user_id } };
    
    // Remove _id fields from update data
    delete updateData.category_id;
    delete updateData.site_id;
    delete updateData.location_id;
    delete updateData.department_id;
    delete updateData.custodian_user_id;

    const updated = await app.prisma.asset.update({
      where: { id: request.params.id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, color: true } },
        site: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        custodian_user: { select: { id: true, first_name: true, last_name: true, email: true } },
        created_by: { select: { id: true, first_name: true, last_name: true } },
        updated_by: { select: { id: true, first_name: true, last_name: true } },
        images: true,
        documents: true,
        custom_fields: { include: { custom_field: true } },
        tags: { select: { id: true, tag: true } },
      },
    });

    // Handle custom fields
    if (custom_fields) {
      for (const [fieldId, value] of Object.entries(custom_fields)) {
        await app.prisma.assetCustomFieldValue.upsert({
          where: { asset_id_custom_field_id: { asset_id: updated.id, custom_field_id: fieldId } },
          update: {
            value_text: typeof value === 'string' ? value : null,
            value_number: typeof value === 'number' ? value : null,
            value_boolean: typeof value === 'boolean' ? value : null,
            value_date: value instanceof Date ? value.toISOString() : null,
            value_json: typeof value === 'object' && value !== null ? value : null,
          },
          create: {
            asset_id: updated.id,
            field_definition_id: fieldId,
            value_text: typeof value === 'string' ? value : null,
            value_number: typeof value === 'number' ? value : null,
            value_boolean: typeof value === 'boolean' ? value : null,
            value_date: value instanceof Date ? value.toISOString() : null,
            value_json: typeof value === 'object' && value !== null ? value : null,
          },
        });
      }
    }

    return updated;
  });

  // Delete asset
  api.delete('/:id', { schema: deleteAssetSchema }, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.asset.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.status(404).send({ error: 'Asset not found', code: 'NOT_FOUND' });
    }

    await app.prisma.asset.delete({
      where: { id: request.params.id },
    });

    return { message: 'Asset deleted successfully' };
  });

  // Bulk operations
  api.post('/bulk', { schema: bulkOperationSchema }, async (request, reply) => {
    const tenantId = request.tenantId!;
    const { action, asset_ids, data } = request.body as any;

    let processed = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const assetId of asset_ids) {
      try {
        const asset = await app.prisma.asset.findFirst({
          where: { id: assetId, tenant_id: tenantId },
        });
        if (!asset) {
          failed++;
          errors.push({ id: assetId, error: 'Asset not found' });
          continue;
        }

        switch (action) {
          case 'delete':
            await app.prisma.asset.delete({ where: { id: assetId } });
            break;
          case 'update_status':
            await app.prisma.asset.update({
              where: { id: assetId },
              data: { status: data.status, updated_by: request.user?.id },
            });
            break;
          case 'assign_custodian':
            await app.prisma.asset.update({
              where: { id: assetId },
              data: { custodian_user_id: data.custodian_user_id, updated_by: request.user?.id },
            });
            break;
          case 'assign_location':
            await app.prisma.asset.update({
              where: { id: assetId },
              data: { location_id: data.location_id, updated_by: request.user?.id },
            });
            break;
          case 'export':
            // Handled separately
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }

        processed++;
      } catch (error: any) {
        failed++;
        errors.push({ id: assetId, error: error.message });
      }
    }

    return { processed, failed, errors };
  });

  // Export assets
  api.get('/export', { schema: exportAssetsSchema }, async (request, reply) => {
    const { format = 'csv', status, category_id, site_id } = request.query as any;
    const tenantId = request.tenantId!;

    const where: any = { tenant_id: tenantId };
    if (status) where.status = status;
    if (category_id) where.category_id = category_id;
    if (site_id) where.site_id = site_id;

    const assets = await app.prisma.asset.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        custodian_user: { select: { id: true, first_name: true, last_name: true, email: true } },
      },
    });

    if (format === 'json') {
      return assets;
    }

    const headers = ['Asset Tag', 'Make', 'Model', 'Category', 'Site', 'Location', 'Department', 'Custodian', 'Status', 'Condition', 'Purchase Date', 'Purchase Cost', 'Currency', 'Warranty Expires'];
    const rows = assets.map(a => [
      a.asset_tag,
      a.make || '',
      a.model || '',
      a.category?.name || '',
      a.site?.name || '',
      a.location?.name || '',
      a.department?.name || '',
      a.custodian_user ? `${a.custodian_user.first_name} ${a.custodian_user.last_name}` : '',
      a.status,
      a.condition || '',
      a.purchase_date ? new Date(a.purchase_date).toLocaleDateString() : '',
      a.purchase_cost?.toString() || '',
      a.currency,
      a.warranty_expires ? new Date(a.warranty_expires).toLocaleDateString() : '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    return reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename="assets-export-${Date.now()}.csv"`)
      .send(csv);
  });

  // Import preview
  api.post('/import/preview', { schema: importPreviewSchema }, async (request, reply) => {
    // TODO: Implement CSV/JSON parsing for import preview
    return { rows: [], errors: [] };
  });

  // Import commit
  api.post('/import/commit', { schema: importCommitSchema }, async (request, reply) => {
    // TODO: Implement import commit with idempotency
    return { created: 0, errors: [] };
  });
}

export { assetRoutes };