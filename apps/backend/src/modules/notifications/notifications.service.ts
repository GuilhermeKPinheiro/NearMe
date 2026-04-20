import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '../../generated/prisma/enums';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

type NotificationDispatchReason = 'CONNECTION_REQUEST' | 'CONNECTION_ACCEPTED' | 'SYNC';

type DispatchNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  realtimeReason: NotificationDispatchReason;
};

type RegisterPushDeviceInput = {
  token: string;
  platform: string;
  deviceName?: string;
  appBuild?: string;
};

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
};

type ExpoPushTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
 };

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async list(userId: string) {
    return {
      notifications: await this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
    };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    this.realtimeService.publishNotificationsUpdated(userId, 'SYNC');

    return { success: true };
  }

  async registerPushDevice(userId: string, input: RegisterPushDeviceInput) {
    const token = input.token.trim();

    if (!token.startsWith('ExponentPushToken[') || !token.endsWith(']')) {
      throw new BadRequestException('Expo push token invalido');
    }

    await this.prisma.pushDevice.upsert({
      where: {
        expoPushToken: token,
      },
      update: {
        userId,
        platform: input.platform,
        deviceName: input.deviceName?.trim() || null,
        appBuild: input.appBuild?.trim() || null,
        lastSeenAt: new Date(),
        disabledAt: null,
      },
      create: {
        userId,
        expoPushToken: token,
        platform: input.platform,
        deviceName: input.deviceName?.trim() || null,
        appBuild: input.appBuild?.trim() || null,
        lastSeenAt: new Date(),
      },
    });

    return { success: true };
  }

  async deactivatePushDevice(userId: string, token: string) {
    await this.prisma.pushDevice.updateMany({
      where: {
        userId,
        expoPushToken: token.trim(),
        disabledAt: null,
      },
      data: {
        disabledAt: new Date(),
      },
    });

    return { success: true };
  }

  async createAndDispatch(input: DispatchNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    this.realtimeService.publishNotificationsUpdated(input.userId, input.realtimeReason);
    this.preparePushDelivery(notification.id, input);

    return notification;
  }

  private async preparePushDelivery(notificationId: string, input: DispatchNotificationInput) {
    const devices = await this.prisma.pushDevice.findMany({
      where: {
        userId: input.userId,
        disabledAt: null,
      },
      select: {
        expoPushToken: true,
      },
    });

    if (devices.length === 0) {
      this.logger.debug(`push skipped notification=${notificationId} user=${input.userId} reason=no-device`);
      return;
    }

    const messages: ExpoPushMessage[] = devices.map((device) => ({
      to: device.expoPushToken,
      title: input.title,
      body: input.body,
      data: {
        notificationId,
        type: input.type,
        ...(input.metadata ?? {}),
      },
      sound: 'default',
    }));

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`push failed notification=${notificationId} status=${response.status} body=${body}`);
        return;
      }

      const payload = (await response.json()) as { data?: ExpoPushTicket[] };
      const tickets = payload.data ?? [];

      await Promise.all(
        tickets.map(async (ticket, index) => {
          if (ticket.status !== 'error') {
            return;
          }

          const token = messages[index]?.to;
          this.logger.warn(
            `push ticket error notification=${notificationId} token=${token} code=${ticket.details?.error ?? 'unknown'} message=${ticket.message ?? ''}`,
          );

          if (ticket.details?.error === 'DeviceNotRegistered' && token) {
            await this.prisma.pushDevice.updateMany({
              where: {
                expoPushToken: token,
                disabledAt: null,
              },
              data: {
                disabledAt: new Date(),
              },
            });
          }
        }),
      );
    } catch (error) {
      this.logger.error(
        `push request failed notification=${notificationId} message=${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
