// backend/src/types/fastify.d.ts
// Unified Fastify type declarations - single source of truth

import { PrismaClient } from '@prisma/client';
import { RedisClientType } from 'redis';
import { Queue, QueueEvents } from 'bullmq';
import { WebSocket } from 'ws';

declare module 'fastify' {
  interface FastifyRequest {
    // Auth - explicitly override @fastify/jwt's user type
    user?: { id: string; tenantId: string; role: string; email: string } | string | object | Buffer;
    tenantId?: string;
    tenant?: { id: string; status: string; slug: string };
    
    // Request logging
    startTime?: bigint;
    
    // WebSocket
    ws?: any;
    wsUser?: { userId: string; tenantId: string; role: string };
    wsAgent?: { enrollmentId: string; assetId?: string };
    
    // File upload
    file?: any;
    query?: Record<string, string | string[] | undefined>;
    
    // Multipart
    file?: () => Promise<any>;
    files?: () => Promise<any[]>;
    body?: any;
  }

  interface FastifyInstance {
    // Plugins
    prisma: PrismaClient;
    redis: RedisClientType;
    hashPassword: (password: string) => Promise<string>;
    verifyPassword: (password: string, hash: string) => Promise<boolean>;
    
    // BullMQ
    queues: {
      imports: Queue;
      exports: Queue;
      reports: Queue;
      webhooks: Queue;
      agentSync: Queue;
      notifications: Queue;
      auditSync: Queue;
    };
    queueEvents: {
      imports: QueueEvents;
      exports: QueueEvents;
      reports: QueueEvents;
      webhooks: QueueEvents;
      agentSync: QueueEvents;
      notifications: QueueEvents;
      auditSync: QueueEvents;
    };
  }
}