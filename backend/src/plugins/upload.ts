// backend/src/plugins/upload.ts
// File upload plugin with ClamAV scanning and MinIO storage

import { FastifyPluginAsync } from 'fastify';
import { spawn } from 'child_process';
import { MinioClient } from '../utils/minio.js';

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/zip',
];
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

interface UploadFile {
  filename: string;
  mimetype: string;
  encoding: string;
  file: NodeJS.ReadableStream;
  fields: Record<string, string>;
  toBuffer(): Promise<Buffer>;
}

interface ScanResult {
  clean: boolean;
  threat?: string;
  sha256: string;
}

export const uploadPlugin: FastifyPluginAsync = async (app) => {
  await app.register(import('@fastify/multipart'), {
    limits: { fileSize: MAX_SIZE, files: 10 },
    attachFieldsToBody: true,
  });

  // Single file upload
  app.post('/api/upload', async (request, reply) => {
    const data = await request.file() as UploadFile | undefined;
    if (!data) return reply.status(400).send({ error: 'No file uploaded' });

    // Validate type
    if (!ALLOWED_TYPES.includes(data.mimetype)) {
      return reply.status(400).send({ error: `File type ${data.mimetype} not allowed` });
    }

    // Get file buffer for size check and scanning
    const fileBuffer = await data.toBuffer();
    if (fileBuffer.length > MAX_SIZE) {
      return reply.status(400).send({ error: 'File too large (max 25MB)' });
    }

    // Scan with ClamAV
    const scanResult = await scanFile(fileBuffer);
    if (!scanResult.clean) {
      return reply.status(400).send({ error: `File infected: ${scanResult.threat}` });
    }

    // Upload to MinIO
    const minio = new MinioClient();
    const tenantId = request.tenantId!;
    const key = `uploads/${tenantId}/${Date.now()}-${data.filename}`;
    await minio.putObject('assets', key, fileBuffer, { 'Content-Type': data.mimetype });

    // Generate presigned URL
    const url = await minio.presignedGetObject('assets', key, 15 * 60); // 15 min

    // Save document record
    const body = request.body as { asset_id?: string } | undefined;
    const document = await app.prisma.document.create({
      data: {
        tenant_id: tenantId,
        asset_id: body?.asset_id || null,
        filename: data.filename,
        mime_type: data.mimetype,
        size: fileBuffer.length,
        url,
        sha256: scanResult.sha256,
        uploaded_by: (request.user as { id: string }).id,
      },
    });

    return { document: { id: document.id, url, filename: data.filename, size: document.size } };
  });

  // Multiple file upload
  app.post('/api/upload/multiple', async (request, reply) => {
    const files = await request.files();
    if (!files || (typeof files[Symbol.asyncIterator] === 'function' && (await files.next()).done)) {
      return reply.status(400).send({ error: 'No files uploaded' });
    }

    const results = [];
    for await (const data of files as AsyncIterableIterator<UploadFile>) {
      if (!ALLOWED_TYPES.includes(data.mimetype)) {
        results.push({ filename: data.filename, error: `File type ${data.mimetype} not allowed` });
        continue;
      }

      const fileBuffer = await data.toBuffer();
      const scanResult = await scanFile(fileBuffer);
      if (!scanResult.clean) {
        results.push({ filename: data.filename, error: `File infected: ${scanResult.threat}` });
        continue;
      }

      const minio = new MinioClient();
      const tenantId = request.tenantId!;
      const key = `uploads/${tenantId}/${Date.now()}-${data.filename}`;
      await minio.putObject('assets', key, fileBuffer, { 'Content-Type': data.mimetype });
      const url = await minio.presignedGetObject('assets', key, 15 * 60);

      const body = request.body as { asset_id?: string } | undefined;
      const document = await app.prisma.document.create({
        data: {
          tenant_id: tenantId,
          asset_id: body?.asset_id || null,
          filename: data.filename,
          mime_type: data.mimetype,
          size: fileBuffer.length,
          url,
          sha256: scanResult.sha256,
          uploaded_by: (request.user as { id: string }).id,
        },
      });

      results.push({ id: document.id, url, filename: data.filename, size: document.size });
    }

    return { documents: results };
  });
};

async function scanFile(fileBuffer: Buffer): Promise<ScanResult> {
  return new Promise((resolve) => {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    const sha256 = hash.digest('hex');

    const clam = spawn('clamdscan', ['--stdout', '--no-summary', '-']);
    let output = '';

    clam.stdin.write(fileBuffer);
    clam.stdin.end();

    clam.stdout.on('data', (data) => { output += data.toString(); });
    clam.stderr.on('data', (data) => { output += data.toString(); });

    clam.on('close', (code) => {
      if (code === 0) resolve({ clean: true, sha256 });
      else if (code === 1) resolve({ clean: false, threat: output.trim(), sha256 });
      else resolve({ clean: false, threat: `Scan error: ${output}`, sha256 });
    });
  });
}

export default uploadPlugin;