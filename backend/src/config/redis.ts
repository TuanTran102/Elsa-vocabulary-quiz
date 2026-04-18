import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';

export const pubClient = new Redis(redisUrl);
export const subClient = pubClient.duplicate();

pubClient.on('error', (err: Error) => console.error('Redis Pub Client Error', err));
subClient.on('error', (err: Error) => console.error('Redis Sub Client Error', err));
