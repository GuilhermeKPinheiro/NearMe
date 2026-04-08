import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import type { AuthenticatedUser } from '../../common/current-user.interface';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { ProximityService } from './proximity.service';

@Controller('nearby')
@UseGuards(JwtAuthGuard)
export class ProximityController {
  constructor(private readonly proximityService: ProximityService) {}

  @Get('users')
  listNearbyUsers(
    @CurrentUser() user: AuthenticatedUser,
    @Query('radiusMeters') radiusMeters?: string,
    @Query('sameVenueOnly') sameVenueOnly?: string,
  ) {
    return this.proximityService.listNearbyUsers(
      user.userId,
      radiusMeters ? Number(radiusMeters) : undefined,
      sameVenueOnly === 'true',
    );
  }
}
