import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function initializeRedis() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = createClient({ url });

  redisClient.on('error', (error) => {
    console.error('Redis error:', error);
  });

  redisClient.on('connect', () => {
    console.log('Redis connected:', url);
  });

  await redisClient.connect();
  return redisClient;
}

export function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call initializeRedis first.');
  }
  return redisClient;
}
