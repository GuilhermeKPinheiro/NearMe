import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import type { AuthenticatedUser } from '../../common/current-user.interface';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

type RegisterPushDeviceBody = {
  token: string;
  platform: string;
  deviceName?: string;
  appBuild?: string;
};

type DeactivatePushDeviceBody = {
  token: string;
};

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.list(user.userId);
  }

  @Post('read')
  read(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  @Post('push-devices')
  registerPushDevice(@CurrentUser() user: AuthenticatedUser, @Body() body: RegisterPushDeviceBody) {
    return this.notificationsService.registerPushDevice(user.userId, body);
  }

  @Post('push-devices/deactivate')
  deactivatePushDevice(@CurrentUser() user: AuthenticatedUser, @Body() body: DeactivatePushDeviceBody) {
    return this.notificationsService.deactivatePushDevice(user.userId, body.token);
  }
}
