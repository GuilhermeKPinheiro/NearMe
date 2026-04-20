import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

type NotificationRealtimePayload = {
  kind: 'notification';
  userId: string;
  reason: 'CONNECTION_REQUEST' | 'CONNECTION_ACCEPTED' | 'SYNC';
};

type ConnectionRealtimePayload = {
  kind: 'connection';
  userId: string;
  reason: 'REQUEST_CREATED' | 'REQUEST_ACCEPTED' | 'REQUEST_REJECTED' | 'SYNC';
};

@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  publishNotificationsUpdated(userId: string, reason: NotificationRealtimePayload['reason']) {
    this.gateway.emitToUser(userId, 'notifications:updated', {
      kind: 'notification',
      userId,
      reason,
      occurredAt: new Date().toISOString(),
    });
  }

  publishConnectionsUpdated(userId: string, reason: ConnectionRealtimePayload['reason']) {
    this.gateway.emitToUser(userId, 'connections:updated', {
      kind: 'connection',
      userId,
      reason,
      occurredAt: new Date().toISOString(),
    });
  }
}
