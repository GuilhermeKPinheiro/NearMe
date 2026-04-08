import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { haversineDistanceMeters } from './venue-utils';
import type { CreateVenueDto } from './dto/create-venue.dto';
import type { UpdateVenueDto } from './dto/update-venue.dto';

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  private mapVenue(venue: {
    id: string;
    slug: string;
    joinCode: string;
    name: string;
    description: string | null;
    coverImageUrl: string | null;
      city: string;
      locationLabel: string | null;
      latitude: number;
      longitude: number;
      radiusMeters: number;
      privacy: 'PUBLIC' | 'INVITE_ONLY';
      ownerId: string | null;
      isActive: boolean;
  }) {
    return {
      id: venue.id,
      slug: venue.slug,
      joinCode: venue.joinCode,
      name: venue.name,
      description: venue.description,
      coverImageUrl: venue.coverImageUrl,
      city: venue.city,
      locationLabel: venue.locationLabel,
      latitude: venue.latitude,
      longitude: venue.longitude,
      radiusMeters: venue.radiusMeters,
      privacy: venue.privacy,
      ownerId: venue.ownerId,
      isActive: venue.isActive,
      entryUrl: `nearme://entry/${venue.joinCode}`,
    };
  }

  private activeVenueWhere() {
    const now = new Date();

    return {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    };
  }

  private async getActiveVenueRecords(extraWhere: Record<string, unknown> = {}) {
    return this.prisma.venue.findMany({
      where: {
        ...this.activeVenueWhere(),
        ...extraWhere,
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async listActive() {
    const venues = await this.getActiveVenueRecords();
    return { venues: venues.map((venue) => this.mapVenue(venue)) };
  }

  async listPublic() {
    const venues = await this.getActiveVenueRecords({ privacy: 'PUBLIC' });
    return { venues: venues.map((venue) => this.mapVenue(venue)) };
  }

  async listInviteOnly() {
    const venues = await this.getActiveVenueRecords({ privacy: 'INVITE_ONLY' });
    return { venues: venues.map((venue) => this.mapVenue(venue)) };
  }

  async listMine(userId: string) {
    const venues = await this.prisma.venue.findMany({
      where: { ownerId: userId },
      orderBy: [{ createdAt: 'desc' }],
    });

    return { venues: venues.map((venue) => this.mapVenue(venue)) };
  }

  private buildSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }

  private buildJoinCode(name: string) {
    const cleaned = name
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);

    return `${cleaned || 'LOCAL'}${Math.floor(100 + Math.random() * 900)}`;
  }

  private normalizeEntryCode(code: string) {
    const trimmed = code.trim();

    if (!trimmed) {
      return '';
    }

    const urlMatch = trimmed.match(/(?:code=|\/entry\/)([A-Za-z0-9_-]+)/i);
    const extracted = urlMatch?.[1] ?? trimmed;
    return extracted.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }

  async findVenueForCoordinates(latitude: number, longitude: number) {
    const venues = await this.getActiveVenueRecords();

    const matches = venues
      .map((venue) => ({
        venue,
        distanceMeters: haversineDistanceMeters(
          { latitude, longitude },
          { latitude: venue.latitude, longitude: venue.longitude }
        ),
      }))
      .filter((item) => item.distanceMeters <= item.venue.radiusMeters)
      .sort((first, second) => first.distanceMeters - second.distanceMeters);

    return matches[0] ?? null;
  }

  async resolveEntryCode(rawCode: string) {
    const normalizedCode = this.normalizeEntryCode(rawCode);

    if (!normalizedCode) {
      throw new BadRequestException('Informe um codigo ou QR valido.');
    }

    const venue = await this.prisma.venue.findFirst({
      where: {
        ...this.activeVenueWhere(),
        OR: [{ joinCode: normalizedCode }, { slug: rawCode.trim().toLowerCase() }],
      },
    });

    if (!venue) {
      throw new NotFoundException('Local ou evento nao encontrado para esse codigo.');
    }

    return { venue: this.mapVenue(venue) };
  }

  async create(userId: string, dto: CreateVenueDto) {
    const venue = await this.prisma.venue.create({
      data: {
        ownerId: userId,
        slug: `${this.buildSlug(dto.name)}-${Date.now().toString().slice(-4)}`,
        joinCode: this.buildJoinCode(dto.name),
        name: dto.name,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl,
        city: dto.city,
        locationLabel: dto.locationLabel,
        latitude: dto.latitude,
        longitude: dto.longitude,
        radiusMeters: dto.radiusMeters,
        privacy: dto.privacy,
        isActive: true,
      },
    });

    return { venue: this.mapVenue(venue) };
  }

  async update(userId: string, venueId: string, dto: UpdateVenueDto) {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });

    if (!venue) {
      throw new NotFoundException('Local ou evento nao encontrado.');
    }

    if (venue.ownerId !== userId) {
      throw new ForbiddenException('Apenas o criador pode editar este local ou evento.');
    }

    const updated = await this.prisma.venue.update({
      where: { id: venueId },
      data: dto,
    });

    return { venue: this.mapVenue(updated) };
  }

  async end(userId: string, venueId: string) {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });

    if (!venue) {
      throw new NotFoundException('Local ou evento nao encontrado.');
    }

    if (venue.ownerId !== userId) {
      throw new ForbiddenException('Apenas o criador pode encerrar este local ou evento.');
    }

    const updated = await this.prisma.venue.update({
      where: { id: venueId },
      data: {
        isActive: false,
        endsAt: new Date(),
      },
    });

    await this.prisma.visibilitySession.updateMany({
      where: {
        venueId,
        isActive: true,
      },
      data: {
        venueId: null,
      },
    });

    return { venue: this.mapVenue(updated) };
  }

  async confirmEntry(userId: string, venueId: string) {
    const venue = await this.prisma.venue.findFirst({
      where: {
        id: venueId,
        ...this.activeVenueWhere(),
      },
    });

    if (!venue) {
      throw new NotFoundException('Local ou evento nao encontrado.');
    }

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
      throw new BadRequestException('Entre no radar antes de confirmar o local.');
    }

    const session = await this.prisma.visibilitySession.update({
      where: { id: activeSession.id },
      data: {
        venueId: venue.id,
      },
      include: {
        venue: true,
      },
    });

    return {
      confirmed: true,
      session,
    };
  }
}
