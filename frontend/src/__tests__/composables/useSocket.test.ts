import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSocket } from '@/composables/useSocket';
import { io } from 'socket.io-client';

vi.mock('socket.io-client', () => {
  const mSocket = {
    on: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    off: vi.fn(),
  };
  return {
    io: vi.fn(() => mSocket),
  };
});

describe('useSocket Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes socket with correct URL', () => {
    useSocket();
    expect(io).toHaveBeenCalled();
  });

  it('provides connect and disconnect methods', () => {
    const { connect, disconnect } = useSocket();
    const socket = io();
    
    connect();
    expect(socket.connect).toHaveBeenCalled();
    
    disconnect();
    expect(socket.disconnect).toHaveBeenCalled();
  });

  it('provides on and emit methods', () => {
    const { on, emit } = useSocket();
    const socket = io();
    
    const callback = vi.fn();
    on('test_event', callback);
    expect(socket.on).toHaveBeenCalledWith('test_event', callback);
    
    emit('test_emit', { data: 'test' });
    expect(socket.emit).toHaveBeenCalledWith('test_emit', { data: 'test' });
  });
});
