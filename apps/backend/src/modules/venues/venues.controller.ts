import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import type { AuthenticatedUser } from '../../common/current-user.interface';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { VenuesService } from './venues.service';
import { ConfirmVenueEntryDto } from './dto/confirm-venue-entry.dto';
import { CreateVenueDto } from './dto/create-venue.dto';
import { ResolveVenueEntryDto } from './dto/resolve-venue-entry.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';

@Controller('venues')
@UseGuards(JwtAuthGuard)
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get('active')
  listActive() {
    return this.venuesService.listActive();
  }

  @Get('public')
  listPublic() {
    return this.venuesService.listPublic();
  }

  @Get('invite-only')
  listInviteOnly() {
    return this.venuesService.listInviteOnly();
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.venuesService.listMine(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateVenueDto) {
    return this.venuesService.create(user.userId, dto);
  }

  @Post('resolve-entry')
  resolveEntry(@Body() dto: ResolveVenueEntryDto) {
    return this.venuesService.resolveEntryCode(dto.code);
  }

  @Post('confirm-entry')
  confirmEntry(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConfirmVenueEntryDto) {
    return this.venuesService.confirmEntry(user.userId, dto.venueId);
  }

  @Patch(':venueId')
  update(@CurrentUser() user: AuthenticatedUser, @Param('venueId') venueId: string, @Body() dto: UpdateVenueDto) {
    return this.venuesService.update(user.userId, venueId, dto);
  }

  @Post(':venueId/end')
  end(@CurrentUser() user: AuthenticatedUser, @Param('venueId') venueId: string) {
    return this.venuesService.end(user.userId, venueId);
  }
}
