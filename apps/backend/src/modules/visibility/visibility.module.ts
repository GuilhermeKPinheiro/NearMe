import { Module } from '@nestjs/common';
import { VisibilityController } from './visibility.controller';
import { VisibilityService } from './visibility.service';
import { VenuesModule } from '../venues/venues.module';

@Module({
  imports: [VenuesModule],
  controllers: [VisibilityController],
  providers: [VisibilityService],
  exports: [VisibilityService],
})
export class VisibilityModule {}
