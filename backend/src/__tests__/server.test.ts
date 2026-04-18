import 'dotenv/config';
import { io as Client, Socket } from 'socket.io-client';
import { server } from '../server.js';
import { disconnectRedis } from '../config/redis.js';
import type { AddressInfo } from 'net';

describe('Socket.io Handshake', () => {
  let clientSocket: Socket;
  let port: number;

  beforeAll((done) => {
    // Ensure we start from a clean state
    if (server.listening) {
        server.close();
    }
    
    server.listen(0, () => {
      port = (server.address() as AddressInfo).port;
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  }, 10000);

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.close();
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectRedis();
  });

  it('should connect to the server', () => {
    expect(clientSocket.connected).toBe(true);
  });
});
