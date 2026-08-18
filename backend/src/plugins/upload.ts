// backend/src/plugins/upload.ts
// File upload plugin with ClamAV scanning and MinIO storage

import { FastifyPluginAsync } from 'fastify';
import { spawn } from 'child_process';
import { pipeline } from 'stream/promises';
import { MinioClient } from '../utils/minio';

declare module 'fastify' {
  interface FastifyRequest {
    file?: { buffer: Buffer; filename: string; mimetype: string; size: number; file: NodeJS.ReadableStream };
  }
}

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/zip',
];
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export const uploadPlugin: FastifyPluginAsync = async (app) => {
  await app.register(import('@fastify/multipart'), {
    limits: { fileSize: MAX_SIZE, files: 10 },
    attachFieldsToBody: true,
  });

  // Single file upload
  app.post('/api/upload', async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.code(400).send({ error: 'No file uploaded' });

    // Validate type
    if (!ALLOWED_TYPES.includes(data.mimetype)) {
      return reply.code(400).send({ error: `File type ${data.mimetype} not allowed` });
    }

    // Validate size
    if (data.file.bytesRead > MAX_SIZE) {
      return reply.code(400).send({ error: 'File too large (max 25MB)' });
    }

    // Scan with ClamAV
    const scanResult = await scanFile(data.file);
    if (!scanResult.clean) {
      return reply.code(400).send({ error: `File infected: ${scanResult.threat}` });
    }

    // Upload to MinIO
    const minio = new MinioClient();
    const tenantId = request.tenantId!;
    const key = `uploads/${tenantId}/${Date.now()}-${data.filename}`;
    await minio.putObject('assets', key, data.file, { 'Content-Type': data.mimetype });

    // Generate presigned URL
    const url = await minio.presignedGetObject('assets', key, 15 * 60); // 15 min

    // Save document record
    const document = await app.prisma.document.create({
      data: {
        tenant_id: tenantId,
        asset_id: request.body.asset_id || null,
        filename: data.filename,
        mime_type: data.mimetype,
        size: data.file.bytesRead,
        url,
        sha256: scanResult.sha256,
        uploaded_by: request.user!.id,
      },
    });

    return { document: { id: document.id, url, filename: data.filename, size: document.size } };
  });

  // Multiple file upload
  app.post('/api/upload/multiple', async (request, reply) => {
    const files = await request.files();
    if (!files || files.length === 0) {
      return reply.code(400).send({ error: 'No files uploaded' });
    }

    const results = [];
    for (const data of files) {
      if (!ALLOWED_TYPES.includes(data.mimetype)) {
        results.push({ filename: data.filename, error: `File type ${data.mimetype} not allowed` });
        continue;
      }

      const scanResult = await scanFile(data.file);
      if (!scanResult.clean) {
        results.push({ filename: data.filename, error: `File infected: ${scanResult.threat}` });
        continue;
      }

      const minio = new MinioClient();
      const tenantId = request.tenantId!;
      const key = `uploads/${tenantId}/${Date.now()}-${data.filename}`;
      await minio.putObject('assets', key, data.file, { 'Content-Type': data.mimetype });
      const url = await minio.presignedGetObject('assets', key, 15 * 60);

      const document = await app.prisma.document.create({
        data: {
          tenant_id: tenantId,
          asset_id: request.body.asset_id || null,
          filename: data.filename,
          mime_type: data.mimetype,
          size: data.file.bytesRead,
          url,
          sha256: scanResult.sha256,
          uploaded_by: request.user!.id,
        },
      });

      results.push({ id: document.id, url, filename: data.filename, size: document.size });
    }

    return { documents: results };
  });
});

async function scanFile(file: NodeJS.ReadableStream): Promise<{ clean: boolean; threat?: string; sha256: string }> {
  return new Promise((resolve) => {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    
    const clam = spawn('clamdscan', ['--stdout', '--no-summary', '-']);
    let output = '';
    
    const chunks: Buffer[] = [];
    file.on('data', (chunk) => {
      chunks.push(chunk);
      hash.update(chunk);
      clam.stdin.write(chunk);
    });
    
    file.on('end', () => {
      clam.stdin.end();
    });
    
    clam.stdout.on('data', (data) => { output += data.toString(); });
    clam.stderr.on('data', (data) => { output += data.toString(); });
    
    clam.on('close', (code) => {
      const sha256 = hash.digest('hex');
      if (code === 0) resolve({ clean: true, sha256 });
      else if (code === 1) resolve({ clean: false, threat: output.trim(), sha256 });
      else resolve({ clean: false, threat: `Scan error: ${output}`, sha256 });
    });
  });
}

export default uploadPlugin;