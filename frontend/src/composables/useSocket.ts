import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  if (!socket) {
    socket = io(apiUrl, {
      autoConnect: false,
    });
  }

  const connect = () => {
    socket?.connect();
  };

  const disconnect = () => {
    socket?.disconnect();
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    socket?.on(event, callback);
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    socket?.off(event, callback);
  };

  const emit = (event: string, data: any) => {
    socket?.emit(event, data);
  };

  return {
    socket,
    connect,
    disconnect,
    on,
    off,
    emit,
  };
}
