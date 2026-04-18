import { Socket } from 'socket.io';

export const socketMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const userId = socket.handshake.headers.authorization;

  if (userId) {
    socket.data.user_id = userId;
  }
  
  next();
};
