// backend/src/routes/documents.ts
// Document routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const documentListItemSchema = z.object({
  id: z.string(),
  asset_id: z.string().nullable(),
  filename: z.string(),
  mime_type: z.string(),
  size: z.number(),
  url: z.string(),
  sha256: z.string(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  tags: z.array(z.string()),
  uploaded_by: z.string(),
  uploaded_at: z.string(),
  scanned: z.boolean(),
  scan_result: z.string().nullable(),
});

const documentsListResponse = z.object({
  data: z.array(documentListItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
});

const documentDetailSchema = z.object({
  id: z.string(),
  asset_id: z.string().nullable(),
  filename: z.string(),
  mime_type: z.string(),
  size: z.number(),
  url: z.string(),
  sha256: z.string(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  tags: z.array(z.string()),
  uploaded_by: z.string(),
  uploaded_at: z.string(),
  scanned: z.boolean(),
  scan_result: z.string().nullable(),
});

const messageResponse = z.object({ message: z.string() });
const errorResponse = z.object({ error: z.string(), code: z.string() });

const listDocumentsSchema = {
  querystring: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(25),
    asset_id: z.string().uuid().optional(),
    mime_type: z.string().optional(),
  }),
  response: { 200: documentsListResponse },
};

const getDocumentSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: documentDetailSchema, 404: errorResponse },
};

const uploadDocumentSchema = {
  body: z.object({
    asset_id: z.string().uuid().optional(),
    filename: z.string(),
    mime_type: z.string(),
    size: z.number().int().positive(),
    url: z.string().url(),
    sha256: z.string().length(64),
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
  response: { 201: documentDetailSchema, 400: errorResponse },
};

const updateDocumentSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
    asset_id: z.string().uuid().optional().nullable(),
  }),
  response: { 200: documentDetailSchema, 400: errorResponse, 404: errorResponse },
};

const deleteDocumentSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: messageResponse, 404: errorResponse },
};

export async function documentRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List documents
  api.get('/', listDocumentsSchema, async (request) => {
    const { page, limit, asset_id, mime_type } = request.query;
    const tenantId = request.tenantId!;

    const where: any = { tenant_id: tenantId };
    if (asset_id) where.asset_id = asset_id;
    if (mime_type) where.mime_type = mime_type;

    const [documents, total] = await Promise.all([
      app.prisma.document.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { uploaded_at: 'desc' },
      }),
      app.prisma.document.count({ where }),
    ]);

    return { data: documents, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
  });

  // Get document
  api.get('/:id', getDocumentSchema, async (request, reply) => {
    const document = await app.prisma.document.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
    });

    if (!document) {
      return reply.code(404).send({ error: 'Document not found', code: 'NOT_FOUND' });
    }

    return document;
  });

  // Upload document (metadata only - file upload handled separately)
  api.post('/', uploadDocumentSchema, async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    // Verify asset exists if provided
    if (request.body.asset_id) {
      const asset = await app.prisma.asset.findFirst({
        where: { id: request.body.asset_id, tenant_id: tenantId },
      });
      if (!asset) {
        return reply.code(400).send({ error: 'Asset not found', code: 'ASSET_NOT_FOUND' });
      }
    }

    const document = await app.prisma.document.create({
      data: {
        tenant_id: tenantId,
        ...request.body,
        uploaded_by: userId,
      },
    });

    return reply.code(201).send(document);
  });

  // Update document
  api.put('/:id', updateDocumentSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.document.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Document not found', code: 'NOT_FOUND' });
    }

    // Verify asset exists if provided
    if (request.body.asset_id) {
      const asset = await app.prisma.asset.findFirst({
        where: { id: request.body.asset_id, tenant_id: tenantId },
      });
      if (!asset) {
        return reply.code(400).send({ error: 'Asset not found', code: 'ASSET_NOT_FOUND' });
      }
    }

    const updated = await app.prisma.document.update({
      where: { id: request.params.id },
      data: request.body,
    });

    return updated;
  });

  // Delete document
  api.delete('/:id', deleteDocumentSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.document.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Document not found', code: 'NOT_FOUND' });
    }

    await app.prisma.document.delete({
      where: { id: request.params.id },
    });

    return { message: 'Document deleted' };
  });
}