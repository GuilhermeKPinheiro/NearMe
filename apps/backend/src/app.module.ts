import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { validateEnv } from './config/env.validation';
import { RuntimeCacheModule } from './common/runtime-cache.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { VisibilityModule } from './modules/visibility/visibility.module';
import { ProximityModule } from './modules/proximity/proximity.module';
import { ConnectionsModule } from './modules/connections/connections.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthModule } from './modules/health/health.module';
import { VenuesModule } from './modules/venues/venues.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { EmailModule } from './modules/email/email.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        join(process.cwd(), 'apps/backend/.env.local'),
        join(process.cwd(), 'apps/backend/.env'),
        '.env.local',
        '.env',
      ],
      validate: validateEnv,
    }),
    RuntimeCacheModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    VisibilityModule,
    ProximityModule,
    ConnectionsModule,
    NotificationsModule,
    RealtimeModule,
    VenuesModule,
    UploadsModule,
    EmailModule,
    HealthModule,
  ],
})
export class AppModule {}
