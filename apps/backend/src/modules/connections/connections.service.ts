import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConnectionRequestStatus, NotificationType } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';

function buildPairKey(firstId: string, secondId: string) {
  return [firstId, secondId].sort().join(':');
}

@Injectable()
export class ConnectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequest(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot connect to yourself');
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

    await this.prisma.notification.create({
      data: {
        userId: toUserId,
        type: NotificationType.CONNECTION_REQUEST,
        title: 'Novo pedido de conexao',
        body: 'Alguem proximo quer se conectar com voce.',
      },
    });

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

    await this.prisma.notification.create({
      data: {
        userId: request.fromUserId,
        type: NotificationType.CONNECTION_ACCEPTED,
        title: 'Conexao aceita',
        body: 'Seu pedido de conexao foi aceito.',
      },
    });

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

    return { request: updatedRequest };
  }

  async listForUser(userId: string) {
    const [received, sent, connections] = await Promise.all([
      this.prisma.connectionRequest.findMany({
        where: {
          toUserId: userId,
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
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          userA: { include: { profile: true } },
          userB: { include: { profile: true } },
        },
      }),
    ]);

    return {
      received: received.map((request) => ({
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
      sent: sent.map((request) => ({
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
      connections: connections.map((connection) => {
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
            matchOnlyStoryPhotoUrls: peer.profile?.matchOnlyStoryPhotoUrls ?? '',
          },
        };
      }),
    };
  }
}
