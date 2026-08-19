// backend/src/plugins/bullmq.ts
// BullMQ plugin for background job processing

import { FastifyPluginAsync } from 'fastify';
import { Queue, Worker, QueueScheduler, QueueEvents } from 'bullmq';

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

const connection = { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') };

const queues = {
  imports: new Queue('imports', { connection, defaultJobOptions: { removeOnComplete: 100, removeOnFail: 500, attempts: 3 } }),
  exports: new Queue('exports', { connection, defaultJobOptions: { removeOnComplete: 100, removeOnFail: 500, attempts: 2 } }),
  reports: new Queue('reports', { connection, defaultJobOptions: { removeOnComplete: 50, removeOnFail: 200, attempts: 1 } }),
  webhooks: new Queue('webhooks', { connection, defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 100, removeOnFail: 500 } }),
  agentSync: new Queue('agent-sync', { connection, defaultJobOptions: { removeOnComplete: 500, removeOnFail: 1000, attempts: 3 } }),
  notifications: new Queue('notifications', { connection, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 10000 }, removeOnComplete: 100, removeOnFail: 500 } }),
  auditSync: new Queue('audit-sync', { connection, defaultJobOptions: { removeOnComplete: 200, removeOnFail: 500, attempts: 2 } }),
};

const queueEvents = {
  imports: new QueueEvents('imports', { connection }),
  exports: new QueueEvents('exports', { connection }),
  reports: new QueueEvents('reports', { connection }),
  webhooks: new QueueEvents('webhooks', { connection }),
  agentSync: new QueueEvents('agent-sync', { connection }),
  notifications: new QueueEvents('notifications', { connection }),
  auditSync: new QueueEvents('audit-sync', { connection }),
};

const workers = {
  imports: new Worker('imports', async (job) => { await importProcessor(job.data); }, { connection, concurrency: 2 }),
  exports: new Worker('exports', async (job) => { await exportProcessor(job.data); }, { connection, concurrency: 2 }),
  reports: new Worker('reports', async (job) => { await reportProcessor(job.data); }, { connection, concurrency: 1 }),
  webhooks: new Worker('webhooks', async (job) => { await webhookProcessor(job.data); }, { connection, concurrency: 5 }),
  agentSync: new Worker('agent-sync', async (job) => { await agentSyncProcessor(job.data); }, { connection, concurrency: 10 }),
  notifications: new Worker('notifications', async (job) => { await notificationProcessor(job.data); }, { connection, concurrency: 5 }),
  auditSync: new Worker('audit-sync', async (job) => { await auditSyncProcessor(job.data); }, { connection, concurrency: 5 }),
};

export const bullmqPlugin: FastifyPluginAsync = async (app) => {
  // Register queues on app
  app.decorate('queues', queues);
  app.decorate('queueEvents', queueEvents);

  // Queue schedulers for delayed/repeat jobs
  await Promise.all(Object.values(queues).map(q => new QueueScheduler(q.name, { connection })));

  // Queue event listeners
  for (const [name, events] of Object.entries(queueEvents)) {
    events.on('completed', ({ jobId, returnvalue }) => {
      app.log.info({ jobId, queue: name }, 'Job completed');
    });
    events.on('failed', ({ jobId, failedReason }) => {
      app.log.error({ jobId, queue: name, failedReason }, 'Job failed');
    });
  }

  // Graceful shutdown
  app.addHook('onClose', async () => {
    await Promise.all([
      ...Object.values(queues).map(q => q.close()),
      ...Object.values(workers).map(w => w.close()),
      ...Object.values(queueEvents).map(e => e.close()),
    ]);
  });
};

async function importProcessor(data: any) {
  // Import processing logic
}

async function exportProcessor(data: any) {
}

async function reportProcessor(data: any) {
}

async function webhookProcessor(data: any) {
}

async function agentSyncProcessor(data: any) {
}

async function notificationProcessor(data: any) {
}

async function auditSyncProcessor(data: any) {
}

export default bullmqPlugin;