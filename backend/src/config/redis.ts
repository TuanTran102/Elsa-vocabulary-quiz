import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';

export const pubClient = new Redis(redisUrl);
export const subClient = pubClient.duplicate();

pubClient.on('error', (err: Error) => console.error('Redis Pub Client Error', err));
subClient.on('error', (err: Error) => console.error('Redis Sub Client Error', err));

export const disconnectRedis = async () => {
  const quitClient = async (client: Redis) => {
    if (client.status !== 'end') {
      try {
        // Try quit first (graceful)
        await client.quit().catch(() => client.disconnect());
      } catch (err) {
        client.disconnect();
      }
    }
  };

  await Promise.all([
    quitClient(pubClient),
    quitClient(subClient)
  ]);
};
