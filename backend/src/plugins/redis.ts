// backend/src/plugins/redis.ts
// Redis plugin with BullMQ support - registers directly on main app

import { FastifyInstance } from 'fastify';
import { createClient, RedisClientType } from 'redis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: RedisClientType;
  }
}

export const redisPlugin: FastifyPluginAsync = async (app) => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  const redis = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          return new Error('Max retries reached');
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  redis.on('error', (err) => {
    app.log.error({ err }, 'Redis connection error');
  });

  redis.on('connect', () => {
    app.log.info('Redis connected');
  });

  redis.on('reconnecting', () => {
    app.log.warn('Redis reconnecting...');
  });

  await redis.connect();

  // Graceful shutdown
  app.addHook('onClose', async () => {
    await redis.quit();
  });

  app.decorate('redis', redis);
};

export default redisPlugin;