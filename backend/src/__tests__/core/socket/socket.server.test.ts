import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import http from 'http';
import { Server } from 'socket.io';
import { SocketServer } from '../../../core/socket/socket.server.js';
import { disconnectRedis } from '../../../config/redis.js';

describe('SocketServer', () => {
  let httpServer: http.Server;

  beforeEach(() => {
    httpServer = http.createServer();
    // Reset singleton state before each test
    // @ts-ignore
    SocketServer.io = undefined;
  });

  afterEach(() => {
    try {
      if (SocketServer.getIO()) {
        SocketServer.getIO().close();
      }
    } catch (e) {
      // Ignore if not initialized
    }
    httpServer.close();
  });
  
  afterAll(async () => {
    await disconnectRedis();
  });

  it('should initialize socket.io server', () => {
    const io = SocketServer.init(httpServer);
    
    expect(io).toBeInstanceOf(Server);
    expect(SocketServer.getIO()).toBe(io);
  });

  it('should throw error if getIO is called before init', () => {
    expect(() => SocketServer.getIO()).toThrow('SocketServer not initialized');
  });

  it('should not re-initialize if already initialized', () => {
    const io1 = SocketServer.init(httpServer);
    const io2 = SocketServer.init(httpServer);
    
    expect(io1).toBe(io2);
  });
});
