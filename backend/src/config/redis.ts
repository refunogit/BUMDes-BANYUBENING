import IORedis from 'ioredis';
import { env } from './env';
import { logger } from './pino';

let redisClient: IORedis | null = null;
let isRedisAvailable = false;

export function getRedisClient(): IORedis | null {
  if (redisClient) return redisClient;

  try {
    redisClient = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      logger.info('✅ Redis connected');
    });

    redisClient.on('error', (err) => {
      isRedisAvailable = false;
      logger.warn({ err: err.message }, '⚠️ Redis error (fallback to in-memory)');
    });

    redisClient.on('close', () => {
      isRedisAvailable = false;
    });

    // Attempt connection but don't block startup
    redisClient.connect().catch(() => {
      logger.warn('⚠️ Redis not available, using in-memory fallback');
    });

    return redisClient;
  } catch (error) {
    logger.warn({ error }, '⚠️ Redis init failed, using fallback');
    return null;
  }
}

export function isRedisReady(): boolean {
  return isRedisAvailable && redisClient?.status === 'ready';
}

// In-memory fallback queue
class InMemoryQueue {
  private queues: Map<string, any[]> = new Map();

  async lpush(queue: string, value: any) {
    if (!this.queues.has(queue)) this.queues.set(queue, []);
    this.queues.get(queue)!.unshift(value);
  }

  async rpop(queue: string) {
    const q = this.queues.get(queue);
    if (!q || q.length === 0) return null;
    return q.pop();
  }

  async llen(queue: string) {
    return this.queues.get(queue)?.length || 0;
  }
}

export const memoryQueue = new InMemoryQueue();

export const queueService = {
  async enqueue(queueName: string, data: any) {
    const payload = JSON.stringify(data);
    if (isRedisReady() && redisClient) {
      await redisClient.lpush(queueName, payload);
    } else {
      await memoryQueue.lpush(queueName, data);
    }
    logger.info({ queueName }, `Enqueued job to ${queueName}`);
  },
  async dequeue(queueName: string) {
    if (isRedisReady() && redisClient) {
      const result = await redisClient.rpop(queueName);
      return result ? JSON.parse(result) : null;
    } else {
      return await memoryQueue.rpop(queueName);
    }
  },
  async getQueueLength(queueName: string) {
    if (isRedisReady() && redisClient) {
      return await redisClient.llen(queueName);
    } else {
      return await memoryQueue.llen(queueName);
    }
  },
  async setCache(key: string, value: any, ttlSeconds = 3600) {
    const payload = JSON.stringify(value);
    if (isRedisReady() && redisClient) {
      await redisClient.setex(key, ttlSeconds, payload);
    }
  },
  async getCache(key: string) {
    if (isRedisReady() && redisClient) {
      const result = await redisClient.get(key);
      return result ? JSON.parse(result) : null;
    }
    return null;
  },
  async delCache(key: string) {
    if (isRedisReady() && redisClient) {
      await redisClient.del(key);
    }
  },
};
