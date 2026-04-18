import type { Socket } from 'socket.io';
import type { SessionService } from '../../session/session.service.js';

export class MasterGuard {
  static async isMaster(socket: Socket, sessionService: SessionService): Promise<boolean> {
    const { role, pin } = socket.data;

    if (role !== 'master' || !pin) {
      return false;
    }

    const session = await sessionService.getSession(pin);
    if (!session) {
      return false;
    }

    return session.masterSocketId === socket.id;
  }
}
