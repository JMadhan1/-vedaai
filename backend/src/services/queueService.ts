import { Queue, Connection } from 'bullmq';
import { getRedisClient } from '../config/redis.js';

let generationQueue: Queue | null = null;

export interface GenerationJobData {
  assignmentId: string;
}

export async function initializeQueue() {
  const redisClient = getRedisClient();

  const connection: Connection = {
    host: new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname || 'localhost',
    port: parseInt(new URL(process.env.REDIS_URL || 'redis://localhost:6379').port || '6379'),
  };

  generationQueue = new Queue('paper-generation', { connection });

  generationQueue.on('error', (error) => {
    console.error('Queue error:', error);
  });

  console.log('Generation queue initialized');
  return generationQueue;
}

export function getGenerationQueue() {
  if (!generationQueue) {
    throw new Error('Generation queue not initialized');
  }
  return generationQueue;
}

export async function enqueueGeneration(
  assignmentId: string
): Promise<string> {
  const queue = getGenerationQueue();
  const job = await queue.add('generate', { assignmentId });
  console.log(`Job ${job.id} enqueued for assignment ${assignmentId}`);
  return job.id as string;
}

export async function getJobPosition(jobId: string): Promise<number> {
  const queue = getGenerationQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    throw new Error('Job not found');
  }

  const state = await job.getState();
  if (state === 'waiting' || state === 'delayed') {
    const position = await queue.getWaitingCount();
    return position;
  }

  return -1; // Job is processing or completed
}
