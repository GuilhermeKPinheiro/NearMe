import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { hash, compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { AuthProvider } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { toOwnProfile, toPublicUser } from '../../common/auth-response';
import { ProfilesService } from '../profiles/profiles.service';
import type { LoginDto } from './dto/login.dto';
import type { GoogleLoginDto } from './dto/google-login.dto';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.toLowerCase(),
        passwordHash,
        authProvider: AuthProvider.EMAIL,
        profile: {
          create: {
            displayName: dto.name.trim(),
          },
        },
      },
      include: {
        profile: true,
      },
    });

    await this.profilesService.ensureDemoNetworkForUser(user.id);

    return this.buildAuthResponse(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await compare(dto.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user.id);
  }

  async loginWithGoogle(dto: GoogleLoginDto) {
    const email = dto.email.toLowerCase();
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email,
          googleId: dto.googleId ?? `dev-google-${email}`,
          authProvider: AuthProvider.GOOGLE,
          emailVerifiedAt: new Date(),
          profile: {
            create: {
              displayName: dto.name.trim(),
            },
          },
        },
        include: { profile: true },
      });

      await this.profilesService.ensureDemoNetworkForUser(user.id);
    }

    return this.buildAuthResponse(user.id);
  }

  async verifyEmail(_token: string) {
    return { success: true };
  }

  async forgotPassword(email: string) {
    return {
      success: true,
      email: email.toLowerCase(),
      message: 'Password reset flow is mocked for local MVP usage.',
    };
  }

  async resetPassword(_token: string, _password: string) {
    return { success: true };
  }

  private async buildAuthResponse(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true },
    });

    const token = sign(
      {
        sub: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET ?? 'change-me-local',
      { expiresIn: '7d' },
    );

    return {
      accessToken: token,
      user: toPublicUser(user),
      profile: toOwnProfile(user.profile),
    };
  }
}
