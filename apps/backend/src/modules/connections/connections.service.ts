import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { cacheKeys } from '../../common/cache-keys';
import { ConnectionRequestStatus, NotificationType } from '../../generated/prisma/enums';
import { getActiveStoryUrls } from '../../common/story-media';
import { RuntimeCacheService } from '../../common/runtime-cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';

function buildPairKey(firstId: string, secondId: string) {
  return [firstId, secondId].sort().join(':');
}

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: RealtimeService,
    private readonly runtimeCache: RuntimeCacheService,
  ) {}

  private invalidateUserCaches(userIds: string[]) {
    for (const userId of new Set(userIds)) {
      this.runtimeCache.invalidate(cacheKeys.connectionsList(userId));
      this.runtimeCache.invalidatePrefix(cacheKeys.nearbyPrefix(userId));
      this.runtimeCache.invalidate(cacheKeys.notificationsList(userId));
    }
  }

  async createRequest(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot connect to yourself');
    }

    const blockedRelation = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: fromUserId, blockedId: toUserId },
          { blockerId: toUserId, blockedId: fromUserId },
        ],
      },
    });

    if (blockedRelation) {
      throw new BadRequestException('Connection unavailable');
    }

    const existingRequest = await this.prisma.connectionRequest.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId,
          toUserId,
        },
      },
    });

    if (existingRequest) {
      return { request: existingRequest };
    }

    const request = await this.prisma.connectionRequest.create({
      data: {
        fromUserId,
        toUserId,
      },
    });

    await this.notificationsService.createAndDispatch({
      userId: toUserId,
      type: NotificationType.CONNECTION_REQUEST,
      title: 'Novo pedido de conexão',
      body: 'Alguém por perto quer se conectar com você.',
      realtimeReason: 'CONNECTION_REQUEST',
      metadata: {
        actorUserId: fromUserId,
        requestId: request.id,
        route: {
          screen: 'connections',
          tab: 'received',
        },
      },
    });

    this.realtimeService.publishConnectionsUpdated(fromUserId, 'REQUEST_CREATED');
    this.realtimeService.publishConnectionsUpdated(toUserId, 'REQUEST_CREATED');
    this.invalidateUserCaches([fromUserId, toUserId]);

    return { request };
  }

  async acceptRequest(userId: string, requestId: string) {
    const request = await this.prisma.connectionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.toUserId !== userId) {
      throw new NotFoundException('Connection request not found');
    }

    const updatedRequest = await this.prisma.connectionRequest.update({
      where: { id: requestId },
      data: {
        status: ConnectionRequestStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    const pairKey = buildPairKey(request.fromUserId, request.toUserId);

    await this.prisma.connection.upsert({
      where: { pairKey },
      update: {},
      create: {
        userAId: request.fromUserId < request.toUserId ? request.fromUserId : request.toUserId,
        userBId: request.fromUserId < request.toUserId ? request.toUserId : request.fromUserId,
        pairKey,
      },
    });

    await this.notificationsService.createAndDispatch({
      userId: request.fromUserId,
      type: NotificationType.CONNECTION_ACCEPTED,
      title: 'Conexão aceita',
      body: 'Seu pedido de conexão foi aceito.',
      realtimeReason: 'CONNECTION_ACCEPTED',
      metadata: {
        actorUserId: request.toUserId,
        requestId: request.id,
        route: {
          screen: 'connections',
          tab: 'connections',
        },
      },
    });

    this.realtimeService.publishConnectionsUpdated(request.fromUserId, 'REQUEST_ACCEPTED');
    this.realtimeService.publishConnectionsUpdated(request.toUserId, 'REQUEST_ACCEPTED');
    this.invalidateUserCaches([request.fromUserId, request.toUserId]);

    return { request: updatedRequest };
  }

  async rejectRequest(userId: string, requestId: string) {
    const request = await this.prisma.connectionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.toUserId !== userId) {
      throw new NotFoundException('Connection request not found');
    }

    const updatedRequest = await this.prisma.connectionRequest.update({
      where: { id: requestId },
      data: {
        status: ConnectionRequestStatus.REJECTED,
        respondedAt: new Date(),
      },
    });

    this.realtimeService.publishConnectionsUpdated(request.fromUserId, 'REQUEST_REJECTED');
    this.realtimeService.publishConnectionsUpdated(request.toUserId, 'REQUEST_REJECTED');
    this.invalidateUserCaches([request.fromUserId, request.toUserId]);

    return { request: updatedRequest };
  }

  async disconnect(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection || (connection.userAId !== userId && connection.userBId !== userId)) {
      throw new NotFoundException('Connection not found');
    }

    await this.prisma.connection.delete({
      where: { id: connectionId },
    });

    this.realtimeService.publishConnectionsUpdated(connection.userAId, 'SYNC');
    this.realtimeService.publishConnectionsUpdated(connection.userBId, 'SYNC');
    this.invalidateUserCaches([connection.userAId, connection.userBId]);

    return { success: true };
  }

  async blockUser(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot block yourself');
    }

    await this.prisma.blockedUser.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId: targetUserId,
        },
      },
      update: {},
      create: {
        blockerId: userId,
        blockedId: targetUserId,
      },
    });

    const pairKey = buildPairKey(userId, targetUserId);

    await this.prisma.connection.deleteMany({
      where: { pairKey },
    });

    await this.prisma.connectionRequest.deleteMany({
      where: {
        OR: [
          { fromUserId: userId, toUserId: targetUserId },
          { fromUserId: targetUserId, toUserId: userId },
        ],
      },
    });

    this.realtimeService.publishConnectionsUpdated(userId, 'SYNC');
    this.realtimeService.publishConnectionsUpdated(targetUserId, 'SYNC');
    this.invalidateUserCaches([userId, targetUserId]);

    return { success: true };
  }

  async listForUser(userId: string) {
    return this.runtimeCache.getOrSet(cacheKeys.connectionsList(userId), 5_000, async () => {
      const [received, sent, connections, blockedRelations] = await Promise.all([
      this.prisma.connectionRequest.findMany({
        where: {
          toUserId: userId,
          fromUser: {
            email: {
              not: {
                endsWith: '@nearme.app',
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          fromUser: {
            include: { profile: true },
          },
        },
      }),
      this.prisma.connectionRequest.findMany({
        where: {
          fromUserId: userId,
          toUser: {
            email: {
              not: {
                endsWith: '@nearme.app',
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          toUser: {
            include: { profile: true },
          },
        },
      }),
      this.prisma.connection.findMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
          AND: [
            {
              userA: {
                email: {
                  not: {
                    endsWith: '@nearme.app',
                  },
                },
              },
            },
            {
              userB: {
                email: {
                  not: {
                    endsWith: '@nearme.app',
                  },
                },
              },
            },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          userA: { include: { profile: true } },
          userB: { include: { profile: true } },
        },
      }),
      this.prisma.blockedUser.findMany({
        where: {
          OR: [{ blockerId: userId }, { blockedId: userId }],
        },
      }),
      ]);

      const blockedUserIds = new Set(
        blockedRelations.map((item) => (item.blockerId === userId ? item.blockedId : item.blockerId)),
      );

      return {
        received: received
        .filter((request) => !blockedUserIds.has(request.fromUser.id))
        .map((request) => ({
          id: request.id,
          status: request.status,
          createdAt: request.createdAt,
          fromUser: {
            id: request.fromUser.id,
            displayName: request.fromUser.profile?.displayName ?? request.fromUser.name,
            photoUrl: request.fromUser.profile?.photoUrl ?? null,
            headline: request.fromUser.profile?.headline ?? '',
          },
        })),
        sent: sent
        .filter((request) => !blockedUserIds.has(request.toUser.id))
        .map((request) => ({
          id: request.id,
          status: request.status,
          createdAt: request.createdAt,
          toUser: {
            id: request.toUser.id,
            displayName: request.toUser.profile?.displayName ?? request.toUser.name,
            photoUrl: request.toUser.profile?.photoUrl ?? null,
            headline: request.toUser.profile?.headline ?? '',
          },
        })),
        connections: connections
        .filter((connection) => {
          const peerId = connection.userAId === userId ? connection.userBId : connection.userAId;
          return !blockedUserIds.has(peerId);
        })
        .map((connection) => {
        const peer = connection.userAId === userId ? connection.userB : connection.userA;
        return {
          id: connection.id,
          createdAt: connection.createdAt,
          user: {
            id: peer.id,
            displayName: peer.profile?.displayName ?? peer.name,
            photoUrl: peer.profile?.photoUrl ?? null,
            headline: peer.profile?.headline ?? '',
            phoneNumber: peer.profile?.showPhoneNumber ? peer.profile?.phoneNumber ?? null : null,
            whatsappUrl: peer.profile?.showPhoneNumber ? peer.profile?.whatsappUrl ?? null : null,
            instagramUrl: peer.profile?.instagramUrl ?? null,
            tiktokUrl: peer.profile?.tiktokUrl ?? null,
            snapchatUrl: peer.profile?.snapchatUrl ?? null,
            otherSocialUrl: peer.profile?.otherSocialUrl ?? null,
            linkedInUrl: peer.profile?.linkedInUrl ?? null,
            matchOnlyPhotoUrls: peer.profile?.matchOnlyPhotoUrls ?? '',
            matchOnlyStoryPhotoUrls: getActiveStoryUrls({
              urls: peer.profile?.matchOnlyStoryPhotoUrls ?? '',
              publishedAt:
                (peer.profile as (typeof peer.profile & { matchOnlyStoryPublishedAt?: Date | null }) | null)
                  ?.matchOnlyStoryPublishedAt ?? null,
              fallbackUpdatedAt: peer.profile?.updatedAt ?? null,
            }),
          },
        };
      }),
      };
    });
  }
}
