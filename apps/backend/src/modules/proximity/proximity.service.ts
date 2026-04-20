import { Injectable } from '@nestjs/common';
import { cacheKeys } from '../../common/cache-keys';
import { ConnectionRequestStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { getActiveStoryUrls } from '../../common/story-media';
import { getVisibilityFreshCutoff } from '../../common/visibility-session';
import { RuntimeCacheService } from '../../common/runtime-cache.service';
import { haversineDistanceMeters } from '../venues/venue-utils';

@Injectable()
export class ProximityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runtimeCache: RuntimeCacheService,
  ) {}

  async listNearbyUsers(userId: string, radiusMeters = 1000, sameVenueOnly = false) {
    const safeRadiusMeters = Number.isFinite(radiusMeters) ? Math.min(Math.max(radiusMeters, 100), 10000) : 1000;
    return this.runtimeCache.getOrSet(
      cacheKeys.nearbyList(userId, safeRadiusMeters, sameVenueOnly),
      5_000,
      async () => {
        const freshCutoff = getVisibilityFreshCutoff();
        const myActiveSession = await this.prisma.visibilitySession.findFirst({
          where: {
            userId,
            isActive: true,
            updatedAt: {
              gte: freshCutoff,
            },
          },
          orderBy: {
            startedAt: 'desc',
          },
          include: {
            venue: true,
          },
        });
        const visibleUsers = await this.prisma.visibilitySession.findMany({
          where: {
            isActive: true,
            updatedAt: {
              gte: freshCutoff,
            },
            userId: {
              not: userId,
            },
            user: {
              email: {
                not: {
                  endsWith: '@nearme.app',
                },
              },
            },
            ...(sameVenueOnly && myActiveSession?.venueId ? { venueId: myActiveSession.venueId } : {}),
          },
          orderBy: {
            startedAt: 'desc',
          },
          include: {
            user: {
              include: {
                profile: true,
              },
            },
            venue: true,
          },
        });

        const [requests, connections, blockedRelations] = await Promise.all([
          this.prisma.connectionRequest.findMany({
            where: {
              OR: [{ fromUserId: userId }, { toUserId: userId }],
            },
          }),
          this.prisma.connection.findMany({
            where: {
              OR: [{ userAId: userId }, { userBId: userId }],
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

        const myCoordinates =
          myActiveSession?.latitude != null && myActiveSession.longitude != null
            ? {
                latitude: myActiveSession.latitude,
                longitude: myActiveSession.longitude,
              }
            : null;

        const users = visibleUsers.map((session, index) => {
        const hasPeerCoordinates = session.latitude != null && session.longitude != null;
        const exactDistanceMeters =
          myCoordinates && hasPeerCoordinates
            ? haversineDistanceMeters(myCoordinates, {
                latitude: session.latitude!,
                longitude: session.longitude!,
              })
            : null;
        const fallbackDistanceMeters = [80, 260, 900, 1800, 4200, 8200][index] ?? 9500;
        const distanceMeters = exactDistanceMeters ?? fallbackDistanceMeters;
        const pendingRequest = requests.find(
          (request) =>
            (request.fromUserId === userId && request.toUserId === session.userId) ||
            (request.toUserId === userId && request.fromUserId === session.userId),
        );
        const isConnected = connections.some(
          (connection) =>
            (connection.userAId === userId && connection.userBId === session.userId) ||
            (connection.userBId === userId && connection.userAId === session.userId),
        );

        return {
          id: session.userId,
          profileId: session.user.profile?.id ?? null,
          displayName: session.user.profile?.displayName ?? session.user.name,
          photoUrl: session.user.profile?.photoUrl ?? null,
          headline: session.user.profile?.headline ?? '',
          bio: session.user.profile?.bio ?? '',
          professionTag: session.user.profile?.professionTag ?? '',
          city: session.user.profile?.city ?? '',
          distanceMeters,
          distanceLabel:
            exactDistanceMeters == null
              ? 'Localizacao aproximada'
              : distanceMeters < 1000
                ? `${distanceMeters} m`
                : `${(distanceMeters / 1000).toFixed(1).replace('.', ',')} km`,
          visibilityStartedAt: session.startedAt,
          requestStatus: pendingRequest?.status ?? null,
          isConnected,
          linksUnlocked: isConnected,
          storyPhotoUrls: getActiveStoryUrls({
            urls: session.user.profile?.storyPhotoUrls ?? '',
            publishedAt:
              (session.user.profile as (typeof session.user.profile & { storyPublishedAt?: Date | null }) | null)
                ?.storyPublishedAt ?? null,
            fallbackUpdatedAt: session.user.profile?.updatedAt ?? null,
          }),
          publicPhotoUrls: session.user.profile?.publicPhotoUrls ?? '',
          matchOnlyPhotoUrls: isConnected ? session.user.profile?.matchOnlyPhotoUrls ?? '' : '',
          phoneNumber:
            isConnected && session.user.profile?.showPhoneNumber ? session.user.profile.phoneNumber : null,
          whatsappUrl:
            isConnected && session.user.profile?.showPhoneNumber ? session.user.profile.whatsappUrl : null,
          instagramUrl:
            session.user.profile?.showSocialLinks && session.user.profile?.instagramUrl
              ? session.user.profile.instagramUrl
              : null,
          tiktokUrl:
            session.user.profile?.showSocialLinks && session.user.profile?.tiktokUrl
              ? session.user.profile.tiktokUrl
              : null,
          snapchatUrl:
            session.user.profile?.showSocialLinks && session.user.profile?.snapchatUrl
              ? session.user.profile.snapchatUrl
              : null,
          otherSocialUrl:
            session.user.profile?.showSocialLinks && session.user.profile?.otherSocialUrl
              ? session.user.profile.otherSocialUrl
              : null,
          linkedInUrl:
            session.user.profile?.showSocialLinks && session.user.profile?.linkedInUrl
              ? session.user.profile.linkedInUrl
              : null,
          venue: session.venue
            ? {
                id: session.venue.id,
                slug: session.venue.slug,
                name: session.venue.name,
                city: session.venue.city,
                radiusMeters: session.venue.radiusMeters,
              }
            : null,
        };
      })
          .filter((user) => user.distanceMeters <= safeRadiusMeters && !blockedUserIds.has(user.id))
          .sort((first, second) => first.distanceMeters - second.distanceMeters);

        return {
          users,
          summary: {
            count: users.length,
            sameVenueOnly,
            venue: myActiveSession?.venueId
              ? {
                  id: myActiveSession.venueId,
                  name: myActiveSession.venue?.name ?? null,
                }
              : null,
            pendingReceived: requests.filter(
              (request) => request.toUserId === userId && request.status === ConnectionRequestStatus.PENDING,
            ).length,
          },
        };
      },
    );
  }
}
