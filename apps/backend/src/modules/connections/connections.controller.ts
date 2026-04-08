import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import type { AuthenticatedUser } from '../../common/current-user.interface';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { ConnectionsService } from './connections.service';
import { CreateConnectionRequestDto } from './dto/create-connection-request.dto';

@Controller('connections')
@UseGuards(JwtAuthGuard)
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post('request')
  createRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateConnectionRequestDto,
  ) {
    return this.connectionsService.createRequest(user.userId, dto.toUserId);
  }

  @Post(':id/accept')
  accept(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.connectionsService.acceptRequest(user.userId, id);
  }

  @Post(':id/reject')
  reject(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.connectionsService.rejectRequest(user.userId, id);
  }

  @Get()
  listConnections(@CurrentUser() user: AuthenticatedUser) {
    return this.connectionsService.listForUser(user.userId);
  }

  @Get('requests')
  listRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.connectionsService.listForUser(user.userId);
  }
}
