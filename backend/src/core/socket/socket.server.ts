import { Server } from 'socket.io';
import http from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from '../../config/redis.js';

export class SocketServer {
  private static io: Server;

  public static init(server: http.Server): Server {
    if (this.io) {
      return this.io;
    }

    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.io.adapter(createAdapter(pubClient, subClient));

    return this.io;
  }

  public static getIO(): Server {
    if (!this.io) {
      throw new Error('SocketServer not initialized');
    }
    return this.io;
  }
}
