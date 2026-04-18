import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { socketMiddleware } from '../../../modules/realtime/socket.middleware.js';
import { Socket } from 'socket.io';

describe('socketMiddleware', () => {
  let mockSocket: any;
  let next: any;

  beforeEach(() => {
    mockSocket = {
      handshake: {
        headers: {}
      },
      data: {}
    };
    next = jest.fn();
  });

  it('should attach user_id to socket.data if authorization header is present', () => {
    mockSocket.handshake.headers.authorization = 'user_123';
    
    socketMiddleware(mockSocket as Socket, next);
    
    expect(mockSocket.data.user_id).toBe('user_123');
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next without error if authorization header is missing', () => {
    socketMiddleware(mockSocket as Socket, next);
    
    expect(next).toHaveBeenCalledWith();
    expect(mockSocket.data.user_id).toBeUndefined();
  });
});
