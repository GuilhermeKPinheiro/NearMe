import { Injectable } from '@nestjs/common';
import { AuthProvider, ConnectionRequestStatus, VisibilitySource } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { toOwnProfile } from '../../common/auth-response';
import type { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    return {
      profile: toOwnProfile(profile),
    };
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        ...dto,
      },
      update: dto,
    });

    return {
      profile: toOwnProfile(profile),
    };
  }

  async ensureDemoNetworkForUser(userId: string) {
    const venue = await this.prisma.venue.upsert({
      where: { slug: 'vault-sp' },
      update: {
        name: 'Vault SP',
        joinCode: 'VAULTSP',
        privacy: 'PUBLIC',
        city: 'Sao Paulo',
        locationLabel: 'Consolacao',
        latitude: -23.561684,
        longitude: -46.655981,
        radiusMeters: 220,
        isActive: true,
      },
      create: {
        slug: 'vault-sp',
        joinCode: 'VAULTSP',
        name: 'Vault SP',
        privacy: 'PUBLIC',
        city: 'Sao Paulo',
        locationLabel: 'Consolacao',
        latitude: -23.561684,
        longitude: -46.655981,
        radiusMeters: 220,
        isActive: true,
      },
    });

    const demos = [
      {
        email: 'ana@nearme.app',
        name: 'Ana Silva',
        headline: 'UX Designer | Freelancer',
        bio: 'Ajudo marcas a criar experiencias mais simples e bonitas.',
        professionTag: 'UX',
        city: 'Sao Paulo',
        latitude: -23.561684,
        longitude: -46.655981,
      },
      {
        email: 'joao@nearme.app',
        name: 'Joao Pedro',
        headline: 'Dev Backend | NestJS',
        bio: 'Construo APIs escalaveis e times pragmáticos.',
        professionTag: 'Backend',
        city: 'Sao Paulo',
        latitude: -23.562101,
        longitude: -46.658323,
      },
      {
        email: 'carla@nearme.app',
        name: 'Carla Mendes',
        headline: 'Growth e Comunidade',
        bio: 'Conecto produtos digitais a comunidades reais.',
        professionTag: 'Growth',
        city: 'Sao Paulo',
        latitude: -23.558917,
        longitude: -46.654402,
      },
    ];

    const createdUsers: string[] = [];

    for (const demo of demos) {
      const existing = await this.prisma.user.findUnique({
        where: { email: demo.email },
      });

      const user =
        existing ??
        (await this.prisma.user.create({
          data: {
            email: demo.email,
            name: demo.name,
            authProvider: AuthProvider.GOOGLE,
            emailVerifiedAt: new Date(),
            googleId: `seed-${demo.email}`,
            profile: {
              create: {
                displayName: demo.name,
                headline: demo.headline,
                bio: demo.bio,
                professionTag: demo.professionTag,
                city: demo.city,
              },
            },
          },
        }));

      createdUsers.push(user.id);

      const activeSession = await this.prisma.visibilitySession.findFirst({
        where: {
          userId: user.id,
          isActive: true,
        },
      });

      if (!activeSession) {
        await this.prisma.visibilitySession.create({
          data: {
            userId: user.id,
            venueId: venue.id,
            source: VisibilitySource.MOCK,
            latitude: demo.latitude,
            longitude: demo.longitude,
            accuracyMeters: 25,
          },
        });
      }
    }

    const requesterId = createdUsers[0];

    if (requesterId && requesterId !== userId) {
      const existingRequest = await this.prisma.connectionRequest.findFirst({
        where: {
          fromUserId: requesterId,
          toUserId: userId,
          status: ConnectionRequestStatus.PENDING,
        },
      });

      if (!existingRequest) {
        await this.prisma.connectionRequest.create({
          data: {
            fromUserId: requesterId,
            toUserId: userId,
          },
        });
      }
    }
  }
}
