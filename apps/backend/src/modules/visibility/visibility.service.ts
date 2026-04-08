import { Injectable } from '@nestjs/common';
import { VisibilitySource } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import type { UpdateLocationDto } from './dto/update-location.dto';
import { VenuesService } from '../venues/venues.service';

@Injectable()
export class VisibilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly venuesService: VenuesService,
  ) {}

  private async resolveVenueId(location?: UpdateLocationDto) {
    if (!location) {
      return null;
    }

    const match = await this.venuesService.findVenueForCoordinates(location.latitude, location.longitude);
    return match?.venue.id ?? null;
  }

  async start(userId: string, location?: UpdateLocationDto) {
    await this.prisma.visibilitySession.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

    const venueId = await this.resolveVenueId(location);
    const session = await this.prisma.visibilitySession.create({
      data: {
        userId,
        venueId,
        source: VisibilitySource.MANUAL,
        latitude: location?.latitude,
        longitude: location?.longitude,
        accuracyMeters: location?.accuracyMeters,
      },
      include: {
        venue: true,
      },
    });

    return {
      isVisible: true,
      session,
    };
  }

  async stop(userId: string) {
    await this.prisma.visibilitySession.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

    return {
      isVisible: false,
      session: null,
    };
  }

  async leaveVenue(userId: string) {
    const activeSession = await this.prisma.visibilitySession.findFirst({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
      include: {
        venue: true,
      },
    });

    if (!activeSession) {
      return {
        isVisible: false,
        session: null,
      };
    }

    const session = await this.prisma.visibilitySession.update({
      where: { id: activeSession.id },
      data: {
        venueId: null,
      },
      include: {
        venue: true,
      },
    });

    return {
      isVisible: true,
      session,
    };
  }

  async status(userId: string) {
    const activeSession = await this.prisma.visibilitySession.findFirst({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
      include: {
        venue: true,
      },
    });

    return {
      isVisible: Boolean(activeSession),
      session: activeSession,
    };
  }

  async updateLocation(userId: string, location: UpdateLocationDto) {
    const activeSession = await this.prisma.visibilitySession.findFirst({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
      include: {
        venue: true,
      },
    });

    if (!activeSession) {
      return {
        isVisible: false,
        session: null,
      };
    }

    const venueId = await this.resolveVenueId(location);
    const session = await this.prisma.visibilitySession.update({
      where: { id: activeSession.id },
      data: {
        venueId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracyMeters: location.accuracyMeters,
      },
      include: {
        venue: true,
      },
    });

    return {
      isVisible: true,
      session,
    };
  }
}
