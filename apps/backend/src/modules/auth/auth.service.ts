import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { sign } from 'jsonwebtoken';
import { toOwnProfile, toPublicUser } from '../../common/auth-response';
import { AuthProvider } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import type { GoogleLoginDto } from './dto/google-login.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client();
  private readonly verificationTokenTtlMs = 1000 * 60 * 60 * 24;
  private readonly passwordResetTokenTtlMs = 1000 * 60 * 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private issueToken() {
    const token = randomBytes(32).toString('hex');
    return {
      token,
      tokenHash: this.hashToken(token),
    };
  }

  private getGoogleAudiences() {
    return [
      process.env.GOOGLE_WEB_CLIENT_ID?.trim(),
      process.env.GOOGLE_ANDROID_CLIENT_ID?.trim(),
      process.env.GOOGLE_IOS_CLIENT_ID?.trim(),
      process.env.GOOGLE_CLIENT_ID?.trim(),
    ].filter((value): value is string => Boolean(value));
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('E-mail já está em uso.');
    }

    const passwordHash = await hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
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

    const verification = this.issueToken();
    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    try {
      await this.prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: verification.tokenHash,
          expiresAt: new Date(Date.now() + this.verificationTokenTtlMs),
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Falha ao criar o token de confirmacao: ${
          error instanceof Error ? error.message : 'erro desconhecido'
        }`,
      );
    }

    try {
      await this.emailService.sendEmailVerification({
        to: user.email,
        name: user.name,
        token: verification.token,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Falha ao enviar o e-mail de confirmacao: ${
          error instanceof Error ? error.message : 'erro desconhecido'
        }`,
      );
    }

    return {
      success: true,
      email: user.email,
      requiresEmailVerification: true,
      message: 'Cadastro criado. Confirme seu e-mail para entrar com senha.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const isValid = await compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Confirme seu e-mail antes de entrar com senha.');
    }

    return this.buildAuthResponse(user.id);
  }

  async loginWithGoogle(dto: GoogleLoginDto) {
    const audiences = this.getGoogleAudiences();

    if (audiences.length === 0) {
      throw new UnauthorizedException('Google Sign-In não está configurado no servidor.');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: dto.idToken,
      audience: audiences,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.sub) {
      throw new UnauthorizedException('Token do Google inválido.');
    }

    if (!payload.email_verified) {
      throw new UnauthorizedException('Sua conta Google precisa ter e-mail verificado.');
    }

    const email = payload.email.toLowerCase();
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: payload.sub }, { email }],
      },
      include: { profile: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: payload.name?.trim() || email.split('@')[0],
          email,
          googleId: payload.sub,
          authProvider: AuthProvider.GOOGLE,
          emailVerifiedAt: new Date(),
          profile: {
            create: {
              displayName: payload.name?.trim() || email.split('@')[0],
              photoUrl: payload.picture ?? null,
            },
          },
        },
        include: { profile: true },
      });

    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          name: payload.name?.trim() || user.name,
          googleId: user.googleId ?? payload.sub,
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
          authProvider: user.authProvider === AuthProvider.EMAIL ? AuthProvider.BOTH : user.authProvider,
          profile: {
            upsert: {
              create: {
                displayName: payload.name?.trim() || user.name,
                photoUrl: payload.picture ?? null,
              },
              update: {
                displayName: payload.name?.trim() || user.profile?.displayName || user.name,
                photoUrl: user.profile?.photoUrl ?? payload.picture ?? null,
              },
            },
          },
        },
        include: { profile: true },
      });
    }

    return this.buildAuthResponse(user.id);
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Link de confirmação inválido ou expirado.');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: record.user.emailVerifiedAt ?? new Date() },
      }),
    ]);

    return {
      success: true,
      message: 'E-mail confirmado. Agora você já pode entrar no app.',
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user?.passwordHash) {
      return {
        success: true,
        email: normalizedEmail,
        message: 'Se o e-mail existir, enviaremos um link de redefinição.',
      };
    }

    const reset = this.issueToken();
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: reset.tokenHash,
        expiresAt: new Date(Date.now() + this.passwordResetTokenTtlMs),
      },
    });

    await this.emailService.sendPasswordReset({
      to: user.email,
      name: user.name,
      token: reset.token,
    });

    return {
      success: true,
      email: normalizedEmail,
      message: 'Se o e-mail existir, enviaremos um link de redefinição.',
    };
  }

  async resetPassword(token: string, password: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Link de redefinição inválido ou expirado.');
    }

    const passwordHash = await hash(password, 10);
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          passwordHash,
          emailVerifiedAt: record.user.emailVerifiedAt ?? new Date(),
        },
      }),
    ]);

    return {
      success: true,
      message: 'Senha redefinida. Faça login com a nova senha.',
    };
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
