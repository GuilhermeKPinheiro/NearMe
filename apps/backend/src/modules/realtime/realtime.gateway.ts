import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'jsonwebtoken';
import type { Server, Socket } from 'socket.io';

type TokenPayload = {
  sub: string;
  email: string;
};

type JoinPayload = {
  token?: string;
};

@Injectable()
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly configService: ConfigService) {}

  handleConnection(client: Socket) {
    const token = this.extractToken(client);

    if (!token) {
      return;
    }

    const userId = this.resolveUserId(token);

    if (!userId) {
      client.disconnect();
      return;
    }

    client.data.userId = userId;
    void client.join(this.getUserRoom(userId));
    this.logger.debug(`socket connected ${client.id} -> ${userId}`);
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.logger.debug(`socket disconnected ${client.id} -> ${client.data.userId as string}`);
    }
  }

  @SubscribeMessage('auth:join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinPayload) {
    const token = payload?.token?.trim();

    if (!token) {
      client.disconnect();
      return;
    }

    const userId = this.resolveUserId(token);

    if (!userId) {
      client.disconnect();
      return;
    }

    client.data.userId = userId;
    void client.join(this.getUserRoom(userId));
    client.emit('auth:joined', { userId });
  }

  emitToUser(userId: string, event: string, payload: Record<string, unknown>) {
    this.server.to(this.getUserRoom(userId)).emit(event, payload);
  }

  private extractToken(client: Socket) {
    const authToken = typeof client.handshake.auth?.token === 'string' ? client.handshake.auth.token.trim() : '';

    if (authToken) {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length).trim();
    }

    return '';
  }

  private resolveUserId(token: string) {
    try {
      const payload = verify(token, this.configService.getOrThrow<string>('JWT_SECRET')) as TokenPayload;
      return payload.sub;
    } catch {
      return null;
    }
  }

  private getUserRoom(userId: string) {
    return `user:${userId}`;
  }
}
