import { Module } from '@nestjs/common';
import { ProximityController } from './proximity.controller';
import { ProximityService } from './proximity.service';

@Module({
  controllers: [ProximityController],
  providers: [ProximityService],
  exports: [ProximityService],
})
export class ProximityModule {}
