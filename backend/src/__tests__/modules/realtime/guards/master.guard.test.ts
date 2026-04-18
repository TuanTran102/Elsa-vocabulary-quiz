import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { MasterGuard } from '../../../../modules/realtime/guards/master.guard.js';

describe('MasterGuard', () => {
  let sessionServiceMock: any;
  let socketMock: any;

  beforeEach(() => {
    sessionServiceMock = {
      getSession: jest.fn()
    };
    socketMock = {
      id: 'master-socket-id',
      data: {
        role: 'master',
        pin: '123456'
      }
    };
  });

  it('should allow if socket is master and session matches', async () => {
    sessionServiceMock.getSession.mockResolvedValue({
      masterSocketId: 'master-socket-id'
    });

    const isAuthorized = await MasterGuard.isMaster(socketMock, sessionServiceMock);
    expect(isAuthorized).toBe(true);
  });

  it('should reject if socket is player', async () => {
    socketMock.data.role = 'player';
    sessionServiceMock.getSession.mockResolvedValue({
      masterSocketId: 'master-socket-id'
    });

    const isAuthorized = await MasterGuard.isMaster(socketMock, sessionServiceMock);
    expect(isAuthorized).toBe(false);
  });

  it('should reject if socket id does not match master socket id', async () => {
    socketMock.id = 'wrong-socket-id';
    sessionServiceMock.getSession.mockResolvedValue({
      masterSocketId: 'master-socket-id'
    });

    const isAuthorized = await MasterGuard.isMaster(socketMock, sessionServiceMock);
    expect(isAuthorized).toBe(false);
  });

  it('should reject if session does not exist', async () => {
    sessionServiceMock.getSession.mockResolvedValue(null);

    const isAuthorized = await MasterGuard.isMaster(socketMock, sessionServiceMock);
    expect(isAuthorized).toBe(false);
  });
});
