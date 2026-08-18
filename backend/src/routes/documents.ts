// backend/src/routes/documents.ts
// Document routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function documentRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List documents
  api.get('/', {
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(25),
        asset_id: z.string().uuid().optional(),
        mime_type: z.string().optional(),
      }),
      response: {
        200: z.object({
          data: z.array(z.object({
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
  api.get('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
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
        }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const document = await app.prisma.document.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!document) {
        return reply.code(404).send({ error: 'Document not found', code: 'NOT_FOUND' });
      }

      // Generate fresh signed URL
      const minio = new (await import('../utils/minio')).MinioClient();
      const freshUrl = await minio.presignedGetObject('assets', document.url.split('/').pop()!, 15 * 60);

      return { ...document, url: freshUrl };
    });

  // Delete document
  api.delete('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const document = await app.prisma.document.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!document) {
        return reply.code(404).send({ error: 'Document not found', code: 'NOT_FOUND' });
      }

      // Delete from MinIO
      const minio = new (await import('../utils/minio')).MinioClient();
      await minio.removeObject('assets', document.url.split('/').pop()!);

      // Delete from database
      await app.prisma.document.delete({ where: { id: request.params.id } });

      return { message: 'Document deleted successfully' };
    });

  // Update document metadata
  api.patch('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        title: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        tags: z.array(z.string()).optional(),
      }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const document = await app.prisma.document.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId! },
      });

      if (!document) {
        return reply.code(404).send({ error: 'Document not found', code: 'NOT_FOUND' });
      }

      await app.prisma.document.update({
        where: { id: request.params.id },
        data: request.body,
      });

      return { message: 'Document updated successfully' };
    });

  // Bulk delete
  api.post('/bulk/delete', {
    schema: {
      body: z.object({
        ids: z.array(z.string().uuid()).min(1).max(100),
      }),
      response: {
        200: z.object({
          deleted: z.number(),
          failed: z.number(),
          errors: z.array(z.object({ id: z.string(), error: z.string() })),
        }),
      },
    }, async (request, reply) => {
      const { ids } = request.body;
      const tenantId = request.tenantId!;

      const documents = await app.prisma.document.findMany({
        where: { id: { in: ids }, tenant_id: tenantId },
        select: { id: true, url: true },
      });

      const foundIds = new Set(documents.map(d => d.id));
      const errors = ids.filter(id => !foundIds.has(id)).map(id => ({ id, error: 'Document not found' }));

      let deleted = 0;
      const minio = new (await import('../utils/minio')).MinioClient();

      for (const doc of documents) {
        try {
          await minio.removeObject('assets', doc.url.split('/').pop()!);
          await app.prisma.document.delete({ where: { id: doc.id } });
          deleted++;
        } catch (e) {
          errors.push({ id: doc.id, error: e instanceof Error ? e.message : 'Unknown error' });
        }
      }

      return { deleted, failed: errors.length, errors };
    });

export { documentRoutes };