# ADR 0004: Free Backend Stack

**Status:** Accepted  
**Date:** 2024-08-17  
**Author:** Founding Product Architect  
**Decision:** Node.js 20 LTS + Fastify + TypeScript + Prisma + BullMQ + JWT + Argon2id

---

## Context

The backend must handle multi-tenant SaaS operations: REST API, WebSocket for real-time scanner/agent sync, background jobs, file uploads with malware scanning, authentication, and full observability. All components must be free and self-hosted.

## Decision

We adopt a **modern, type-safe, plugin-based backend stack**:

| Layer | Technology | Version | License | Purpose |
|-------|------------|---------|---------|---------|
| Runtime | Node.js | 20 LTS | MIT | JavaScript runtime |
| Language | TypeScript | 5.3+ | Apache-2.0 | Type safety |
| Framework | Fastify | 4.25+ | MIT | Fast, plugin-based HTTP server |
| Validation | Zod | 3.22+ | MIT | Schema validation (shared with frontend) |
| ORM | Prisma | 5.9+ | Apache-2.0 | Type-safe database access |
| Auth | jose (JWT) + Argon2id | 5.2+ / MIT | MIT | JWT tokens, password hashing |
| Background Jobs | BullMQ | 5.6+ | MIT | Redis-based job queues |
| WebSocket | fastify-websocket | 10.0+ | MIT | Real-time scanner/agent sync |
| File Upload | fastify-multipart | 8.2+ | MIT | Streaming file uploads |
| Malware Scan | ClamAV (clamdscan) | 1.0+ | GPL-2.0 | Virus scanning |
| Logging | Pino | 8.17+ | MIT | Structured JSON logs |
| Metrics | prom-client | 15.1+ | MIT | Prometheus metrics |
| Tracing | @opentelemetry/api + SDK | 1.0+ | Apache-2.0 | Distributed tracing |

---

## Package.json

```json
{
  "name": "asset-mt-backend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint . --ext ts --max-warnings 0",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "fastify": "^4.25.0",
    "fastify-type-provider-zod": "^1.1.0",
    "fastify-websocket": "^10.0.0",
    "fastify-multipart": "^8.2.0",
    "fastify-cors": "^6.0.0",
    "fastify-helmet": "^11.0.0",
    "fastify-rate-limit": "^9.1.0",
    "fastify-jwt": "^8.0.0",
    "fastify-cookie": "^9.3.0",
    "@prisma/client": "^5.9.0",
    "zod": "^3.22.0",
    "jose": "^5.2.0",
    "argon2": "^0.40.0",
    "bullmq": "^5.6.0",
    "ioredis": "^5.3.0",
    "pino": "^8.17.0",
    "pino-pretty": "^10.3.0",
    "prom-client": "^15.1.0",
    "@opentelemetry/api": "^1.0.0",
    "@opentelemetry/sdk-node": "^0.48.0",
    "@opentelemetry/auto-instrumentations-node": "^0.40.0",
    "@opentelemetry/exporter-prometheus": "^0.50.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.3.0",
    "uuid": "^9.0.0",
    "csv-parse": "^5.5.0",
    "exceljs": "^4.4.0",
    "pdfkit": "^0.15.0",
    "qrcode": "^1.5.0",
    "sharp": "^0.33.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/uuid": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.56.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0",
    "vitest": "^1.3.0",
    "@vitest/coverage-v8": "^1.3.0",
    "prisma": "^5.9.0"
  }
}
```

---

## Fastify Plugin Architecture

```typescript
// src/plugins/index.ts
import { FastifyInstance } from 'fastify';
import { prismaPlugin } from './prisma';
import { redisPlugin } from './redis';
import { authPlugin } from './auth';
import { bullmqPlugin } from './bullmq';
import { websocketPlugin } from './websocket';
import { metricsPlugin } from './metrics';
import { tracingPlugin } from './tracing';
import { uploadPlugin } from './upload';

export async function registerPlugins(app: FastifyInstance) {
  // Core infrastructure
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  
  // Auth & security
  await app.register(authPlugin);
  
  // Background jobs
  await app.register(bullmqPlugin);
  
  // Real-time
  await app.register(websocketPlugin);
  
  // File uploads
  await app.register(uploadPlugin);
  
  // Observability
  await app.register(metricsPlugin);
  await app.register(tracingPlugin);
  
  // Security headers
  await app.register(import('fastify-helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'wss:', 'https:'],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  });
  
  // Rate limiting
  await app.register(import('fastify-rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.tenantId || req.ip,
  });
}
```

---

## Prisma Plugin with RLS Middleware

```typescript
// src/plugins/prisma.ts
import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tenantMiddleware } from '../middleware/tenant-middleware';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export const prismaPlugin: FastifyPluginAsync = async (app) => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });

  // Apply tenant middleware
  tenantMiddleware(prisma);

  // Graceful shutdown
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  app.decorate('prisma', prisma);
};

export default prismaPlugin;
```

---

## Authentication Plugin (JWT + Argon2id)

```typescript
// src/plugins/auth.ts
import { FastifyPluginAsync } from 'fastify';
import { fastifyJwt } from '@fastify/jwt';
import { fastifyCookie } from '@fastify/cookie';
import { fastifyHelmet } from '@fastify/helmet';
import { argon2id } from 'argon2';
import { prisma } from '../utils/prisma'; // singleton

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; tenantId: string; role: string; email: string };
    tenantId?: string;
  }
}

export const authPlugin: FastifyPluginAsync = async (app) => {
  // Cookie parsing
  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET!,
    parseOptions: { httpOnly: true, secure: true, sameSite: 'strict' },
  });

  // JWT verification
  await app.register(fastifyJwt, {
    secret: {
      private: process.env.JWT_PRIVATE_KEY!,
      public: process.env.JWT_PUBLIC_KEY!,
    },
    sign: { algorithm: 'RS256', expiresIn: '15m' },
    verify: { algorithms: ['RS256'] },
    cookie: { cookieName: 'accessToken', signed: false },
  });

  // Refresh token cookie
  await app.register(fastifyJwt, {
    secret: {
      private: process.env.JWT_REFRESH_PRIVATE_KEY!,
      public: process.env.JWT_REFRESH_PUBLIC_KEY!,
    },
    sign: { algorithm: 'RS256', expiresIn: '7d' },
    verify: { algorithms: ['RS256'] },
    cookie: { cookieName: 'refreshToken', signed: false },
    namespace: 'refresh',
  });

  // Auth hook
  app.addHook('preHandler', async (request, reply) => {
    // Skip auth for public routes
    if (isPublicRoute(request.url)) return;

    try {
      const accessToken = request.cookies.accessToken;
      const refreshToken = request.cookies.refreshToken;

      if (!accessToken) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      // Verify access token
      const decoded = await request.jwtVerify<{ userId: string; tenantId: string; role: string }>();
      
      // Verify tenant access
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, tenantId: true, role: true, email: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE' || user.tenantId !== decoded.tenantId) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      request.user = { id: user.id, tenantId: user.tenantId, role: user.role, email: user.email };
      request.tenantId = user.tenantId;
    } catch (err) {
      // Try refresh token
      if (refreshToken) {
        try {
          const decoded = await request.refreshJwtVerify<{ userId: string }>();
          const newAccessToken = app.jwt.sign({ userId: decoded.userId }, { expiresIn: '15m' });
          const newRefreshToken = app.refreshJwt.sign({ userId: decoded.userId }, { expiresIn: '7d' });
          
          reply.setCookie('accessToken', newAccessToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60 });
          reply.setCookie('refreshToken', newRefreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 });
          
          // Retry original request
          const decodedNew = await request.jwtVerify();
          const user = await prisma.user.findUnique({ where: { id: decodedNew.userId } });
          if (user) {
            request.user = { id: user.id, tenantId: user.tenantId, role: user.role, email: user.email };
            request.tenantId = user.tenantId;
            return;
          }
        } catch {}
      }
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }
  });

  // Password hashing helpers
  app.decorate('hashPassword', async (password: string) => {
    return argon2id.hash(password, { memoryCost: 65536, timeCost: 3, parallelism: 4 });
  });

  app.decorate('verifyPassword', async (password: string, hash: string) => {
    return argon2id.verify(hash, password);
  });
});

function isPublicRoute(url: string): boolean {
  const publicRoutes = ['/health', '/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/forgot-password', '/api/auth/reset-password'];
  return publicRoutes.some(route => url.startsWith(route));
}

export default authPlugin;
```

---

## BullMQ Plugin (Background Jobs)

```typescript
// src/plugins/bullmq.ts
import { FastifyPluginAsync } from 'fastify';
import { Queue, Worker, QueueScheduler } from 'bullmq';
import { redis } from '../utils/redis';

declare module 'fastify' {
  interface FastifyInstance {
    queues: {
      imports: Queue;
      exports: Queue;
      reports: Queue;
      webhooks: Queue;
      agentSync: Queue;
      notifications: Queue;
      auditSync: Queue;
    };
  }
}

export const bullmqPlugin: FastifyPluginAsync = async (app) => {
  const connection = { host: process.env.REDIS_HOST!, port: parseInt(process.env.REDIS_PORT!) };

  const queues = {
    imports: new Queue('imports', { connection, defaultJobOptions: { removeOnComplete: 100, removeOnFail: 500 } }),
    exports: new Queue('exports', { connection, defaultJobOptions: { removeOnComplete: 100, removeOnFail: 500 } }),
    reports: new Queue('reports', { connection, defaultJobOptions: { removeOnComplete: 50, removeOnFail: 200 } }),
    webhooks: new Queue('webhooks', { connection, defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 100, removeOnFail: 500 } }),
    agentSync: new Queue('agent-sync', { connection, defaultJobOptions: { removeOnComplete: 500, removeOnFail: 1000 } }),
    notifications: new Queue('notifications', { connection, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 10000 }, removeOnComplete: 100, removeOnFail: 500 } }),
    auditSync: new Queue('audit-sync', { connection, defaultJobOptions: { removeOnComplete: 200, removeOnFail: 500 } }),
  };

  // Register workers
  const workers = {
    imports: new Worker('imports', async (job) => { await importProcessor(job.data); }, { connection, concurrency: 2 }),
    exports: new Worker('exports', async (job) => { await exportProcessor(job.data); }, { connection, concurrency: 2 }),
    reports: new Worker('reports', async (job) => { await reportProcessor(job.data); }, { connection, concurrency: 1 }),
    webhooks: new Worker('webhooks', async (job) => { await webhookProcessor(job.data); }, { connection, concurrency: 5 }),
    agentSync: new Worker('agent-sync', async (job) => { await agentSyncProcessor(job.data); }, { connection, concurrency: 10 }),
    notifications: new Worker('notifications', async (job) => { await notificationProcessor(job.data); }, { connection, concurrency: 5 }),
    auditSync: new Worker('audit-sync', async (job) => { await auditSyncProcessor(job.data); }, { connection, concurrency: 5 }),
  };

  // Queue schedulers for delayed/repeat jobs
  await Promise.all(Object.values(queues).map(q => new QueueScheduler(q.name, { connection })));

  // Graceful shutdown
  app.addHook('onClose', async () => {
    await Promise.all([
      ...Object.values(queues).map(q => q.close()),
      ...Object.values(workers).map(w => w.close()),
    ]);
  });

  app.decorate('queues', queues);
});

export default bullmqPlugin;
```

---

## WebSocket Plugin (Real-time Scanner/Agent Sync)

```typescript
// src/plugins/websocket.ts
import { FastifyPluginAsync } from 'fastify';
import { WebSocket } from 'ws';
import { jwtVerify } from 'jose';

declare module 'fastify' {
  interface FastifyRequest {
    ws?: WebSocket;
    wsUser?: { userId: string; tenantId: string; role: string };
  }
}

export const websocketPlugin: FastifyPluginAsync = async (app) => {
  await app.register(import('fastify-websocket'));

  // Scanner WebSocket (mobile PWA)
  app.get('/ws/scanner', { websocket: true }, async (connection, request) => {
    const token = request.query.token as string;
    if (!token) return connection.close(4001, 'Missing token');

    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_PUBLIC_KEY!));
      request.wsUser = { userId: payload.userId, tenantId: payload.tenantId, role: payload.role };
    } catch {
      return connection.close(4001, 'Invalid token');
    }

    // Register scanner connection
    const scannerConnections = new Map<string, Set<WebSocket>>();
    if (!scannerConnections.has(request.wsUser.tenantId)) {
      scannerConnections.set(request.wsUser.tenantId, new Set());
    }
    scannerConnections.get(request.wsUser.tenantId)!.add(connection.socket);

    connection.socket.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'scan') {
          // Process barcode scan
          await handleScan(request.wsUser!, message.data, connection.socket);
        }
      } catch (err) {
        connection.socket.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
      }
    });

    connection.socket.on('close', () => {
      scannerConnections.get(request.wsUser!.tenantId)?.delete(connection.socket);
    });
  });

  // Agent WebSocket (endpoint agents)
  app.get('/ws/agent', { websocket: true }, async (connection, request) => {
    // Agent auth via mTLS or JWT
    const agentToken = request.headers['x-agent-token'];
    if (!agentToken) return connection.close(4001, 'Missing agent token');

    // Validate agent token, get agent info
    const agent = await validateAgentToken(agentToken);
    if (!agent) return connection.close(4001, 'Invalid agent token');

    // Handle agent messages (heartbeat, data sync, commands)
    connection.socket.on('message', async (data) => {
      const message = JSON.parse(data.toString());
      await handleAgentMessage(agent, message, connection.socket);
    });
  });
});

export default websocketPlugin;
```

---

## File Upload + ClamAV Plugin

```typescript
// src/plugins/upload.ts
import { FastifyPluginAsync } from 'fastify';
import { spawn } from 'child_process';
import { pipeline } from 'stream/promises';
import { MinioClient } from '../utils/minio';

declare module 'fastify' {
  interface FastifyRequest {
    file?: { buffer: Buffer; filename: string; mimetype: string; size: number };
  }
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv'];
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export const uploadPlugin: FastifyPluginAsync = async (app) => {
  await app.register(import('fastify-multipart'), {
    limits: { fileSize: MAX_SIZE, files: 10 },
    attachFieldsToBody: true,
  });

  // Upload endpoint
  app.post('/api/upload', async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.code(400).send({ error: 'No file uploaded' });

    // Validate type
    if (!ALLOWED_TYPES.includes(data.mimetype)) {
      return reply.code(400).send({ error: `File type ${data.mimetype} not allowed` });
    }

    // Stream to ClamAV
    const scanResult = await scanFile(data.file);
    if (!scanResult.clean) {
      return reply.code(400).send({ error: `File infected: ${scanResult.threat}` });
    }

    // Upload to MinIO
    const minio = new MinioClient();
    const key = `uploads/${request.tenantId}/${Date.now()}-${data.filename}`;
    await minio.putObject('assets', key, data.file, { 'Content-Type': data.mimetype });

    // Generate presigned URL
    const url = await minio.presignedGetObject('assets', key, 15 * 60); // 15 min

    return { url, key, filename: data.filename, size: data.file.byteLength };
  });
});

async function scanFile(file: NodeJS.ReadableStream): Promise<{ clean: boolean; threat?: string }> {
  return new Promise((resolve) => {
    const clam = spawn('clamdscan', ['--stdout', '--no-summary', '-']);
    let output = '';
    
    pipeline(file, clam.stdin).catch(() => {});
    clam.stdout.on('data', (data) => { output += data.toString(); });
    clam.stderr.on('data', (data) => { output += data.toString(); });
    
    clam.on('close', (code) => {
      if (code === 0) resolve({ clean: true });
      else if (code === 1) resolve({ clean: false, threat: output.trim() });
      else resolve({ clean: false, threat: `Scan error: ${output}` });
    });
  });
}
```

---

## Metrics & Tracing Plugin

```typescript
// src/plugins/metrics.ts
import { FastifyPluginAsync } from 'fastify';
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export const metricsPlugin: FastifyPluginAsync = async (app) => {
  const register = new Registry();
  collectDefaultMetrics({ register, prefix: 'assetmt_' });

  // Custom metrics
  const httpRequestsTotal = new Counter({ name: 'http_requests_total', help: 'Total HTTP requests', labelNames: ['method', 'route', 'status', 'tenant'], registers: [register] });
  const httpRequestDuration = new Histogram({ name: 'http_request_duration_seconds', help: 'HTTP request duration', labelNames: ['method', 'route'], buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5], registers: [register] });
  const activeTenants = new Gauge({ name: 'active_tenants', help: 'Number of active tenants', registers: [register] });
  const queueDepth = new Gauge({ name: 'queue_depth', help: 'Job queue depth', labelNames: ['queue'], registers: [register] });

  // Metrics endpoint
  app.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });

  // Hook for HTTP metrics
  app.addHook('onRequest', async (request) => {
    request.startTime = process.hrtime.bigint();
  });

  app.addHook('onResponse', async (request, reply) => {
    const duration = Number(process.hrtime.bigint() - request.startTime!) / 1e9;
    httpRequestsTotal.inc({ method: request.method, route: request.routeOptions?.url || 'unknown', status: reply.statusCode.toString(), tenant: request.tenantId || 'none' });
    httpRequestDuration.observe({ method: request.method, route: request.routeOptions?.url || 'unknown' }, duration);
  });
});

export default metricsPlugin;
```

```typescript
// src/plugins/tracing.ts
import { FastifyPluginAsync } from 'fastify';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

export const tracingPlugin: FastifyPluginAsync = async (app) => {
  const sdk = new NodeSDK({
    traceExporter: new PrometheusExporter({ port: 9464 }),
    instrumentations: [getNodeAutoInstrumentations()],
    serviceName: 'asset-mt-backend',
  });

  sdk.start();

  app.addHook('onClose', async () => {
    await sdk.shutdown();
  });
});

export default tracingPlugin;
```

---

## Consequences

### Positive
- **Type-safe end-to-end** — Zod schemas shared with frontend
- **Plugin architecture** — Clean separation, easy testing
- **Real-time ready** — WebSocket for scanner/agent
- **Background jobs** — BullMQ with Redis, reliable retries
- **Observability built-in** — Logs, metrics, tracing from day one
- **Security-first** — Helmet, rate limiting, JWT rotation, Argon2id

### Negative
- **Node.js single-threaded** — CPU-bound tasks need worker threads
- **GPL ClamAV** — Must ensure compliance (dynamic linking OK)
- **TypeScript compilation** — Build step required

---

## References

- [Fastify Documentation](https://fastify.dev/docs/latest/)
- [Prisma Multi-Tenant](https://www.prisma.io/docs/orm/prisma-client/client-extensions/middleware)
- [BullMQ Patterns](https://docs.bullmq.io/patterns)
- [Jose JWT](https://github.com/panva/jose)
- [Argon2id](https://github.com/ranisalt/node-argon2)
- [OpenTelemetry JS](https://opentelemetry.io/docs/instrumentation/js/)

---

**Next:** ADR 0005 — Free Infrastructure