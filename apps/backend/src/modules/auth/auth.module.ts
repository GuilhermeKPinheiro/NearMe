import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [ProfilesModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
