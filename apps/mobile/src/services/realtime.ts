import { io, type Socket } from 'socket.io-client';
import { env } from '@/config/env';

type RealtimeEventName = 'connections:updated' | 'notifications:updated';

type RealtimeListener = (payload: Record<string, unknown>) => void;

class RealtimeClient {
  private socket: Socket | null = null;
  private listeners = new Map<RealtimeEventName, Set<RealtimeListener>>();
  private currentToken: string | null = null;

  connect(token: string) {
    if (!token) {
      return;
    }

    if (this.socket && this.currentToken === token) {
      return;
    }

    this.disconnect();

    this.currentToken = token;
    this.socket = io(env.socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
      auth: {
        token,
      },
    });

    this.socket.on('connect', () => {
      this.socket?.emit('auth:join', { token });
    });

    this.socket.on('connections:updated', (payload) => {
      this.emit('connections:updated', payload);
    });

    this.socket.on('notifications:updated', (payload) => {
      this.emit('notifications:updated', payload);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.currentToken = null;
  }

  subscribe(event: RealtimeEventName, listener: RealtimeListener) {
    const existing = this.listeners.get(event) ?? new Set<RealtimeListener>();
    existing.add(listener);
    this.listeners.set(event, existing);

    return () => {
      const next = this.listeners.get(event);
      next?.delete(listener);

      if (next && next.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  private emit(event: RealtimeEventName, payload: Record<string, unknown>) {
    const listeners = this.listeners.get(event);

    if (!listeners) {
      return;
    }

    for (const listener of listeners) {
      listener(payload);
    }
  }
}

export const realtimeClient = new RealtimeClient();
