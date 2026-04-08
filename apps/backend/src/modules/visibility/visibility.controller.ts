import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import type { AuthenticatedUser } from '../../common/current-user.interface';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { VisibilityService } from './visibility.service';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('visibility')
@UseGuards(JwtAuthGuard)
export class VisibilityController {
  constructor(private readonly visibilityService: VisibilityService) {}

  @Post('start')
  start(@CurrentUser() user: AuthenticatedUser, @Body() location?: UpdateLocationDto) {
    return this.visibilityService.start(user.userId, location);
  }

  @Post('stop')
  stop(@CurrentUser() user: AuthenticatedUser) {
    return this.visibilityService.stop(user.userId);
  }

  @Post('leave-venue')
  leaveVenue(@CurrentUser() user: AuthenticatedUser) {
    return this.visibilityService.leaveVenue(user.userId);
  }

  @Get('status')
  status(@CurrentUser() user: AuthenticatedUser) {
    return this.visibilityService.status(user.userId);
  }

  @Post('location')
  updateLocation(@CurrentUser() user: AuthenticatedUser, @Body() location: UpdateLocationDto) {
    return this.visibilityService.updateLocation(user.userId, location);
  }
}
