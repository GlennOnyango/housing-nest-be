import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { addMinutes } from '../common/date/add-minutes';
import { PrismaService } from '../prisma/prisma.service';
import { LoginAttemptService } from './login-attempt.service';
import { PasswordService } from './password.service';
import { RefreshTokenService } from './refresh-token.service';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { LoginDto } from './dto/login.dto';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly loginAttemptService: LoginAttemptService,
  ) {}
  private readonly logger = new Logger(AuthService.name);

  async registerOwner(dto: RegisterOwnerDto): Promise<AuthTokens> {
    const passwordHash = await this.passwordService.hashPassword(dto.password);

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('User already exists');
    }

    const owner = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
          },
        },
        ownedOrganizations: {
          create: {
            name: dto.orgName,
            memberships: {
              create: {
                role: 'OWNER',
              },
            },
          },
        },
      },
    });

    return this.issueTokens(owner.id);
  }

  async login(
    dto: LoginDto,
    meta: { ip?: string; userAgent?: string },
  ): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException();
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account locked');
    }

    const ok = await this.passwordService.verifyPassword(
      user.passwordHash,
      dto.password,
    );
    if (!ok) {
      await this.loginAttemptService.registerFailure(user.id);
      throw new UnauthorizedException();
    }

    await this.loginAttemptService.reset(user.id);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(user.id, meta);
  }

  async refresh(
    refreshToken: string,
    meta: { ip?: string; userAgent?: string },
  ): Promise<AuthTokens> {
    const stored = await this.prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (stored.length === 0) {
      throw new UnauthorizedException();
    }

    const match = await this.findMatchingToken(stored, refreshToken);
    if (!match) {
      throw new UnauthorizedException();
    }

    await this.prisma.refreshToken.update({
      where: { id: match.id },
      data: {
        userAgent: meta.userAgent ?? match.userAgent,
        ipAddress: meta.ip ?? match.ipAddress,
      },
    });

    const newRefreshToken = randomUUID();
    await this.refreshTokenService.rotateToken({
      tokenId: match.id,
      newToken: newRefreshToken,
      expiresAt: addMinutes(new Date(), 60 * 24 * 7),
    });

    const accessToken = await this.jwtService.signAsync({
      sub: match.userId,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }
    const stored = await this.prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
      },
    });
    if (stored.length === 0) {
      return;
    }
    const match = refreshToken
      ? await this.findMatchingToken(stored, refreshToken)
      : stored[0];
    if (!match) {
      return;
    }
    await this.refreshTokenService.revokeToken(match.id);
  }

  async requestMagicLink(email: string): Promise<void> {
    const token = randomUUID();
    const tokenHash = await this.passwordService.hashRefreshToken(token);
    await this.prisma.magicLinkToken.create({
      data: {
        email,
        tokenHash,
        expiresAt: addMinutes(new Date(), 30),
      },
    });

    this.logger.log(`Magic link token issued for ${email}: ${token}`);
  }

  async consumeMagicLink(token: string): Promise<AuthTokens> {
    const candidates = await this.prisma.magicLinkToken.findMany({
      where: {
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (candidates.length === 0) {
      throw new UnauthorizedException();
    }

    const match = await this.findMatchingMagicLink(candidates, token);
    if (!match) {
      throw new UnauthorizedException();
    }

    await this.prisma.magicLinkToken.update({
      where: { id: match.id },
      data: { consumedAt: new Date() },
    });

    const user = await this.prisma.user.upsert({
      where: { email: match.email },
      update: {},
      create: { email: match.email },
    });

    return this.issueTokens(user.id);
  }

  private async issueTokens(
    userId: string,
    meta?: { ip?: string; userAgent?: string },
  ) {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
    });
    const refreshToken = randomUUID();
    await this.refreshTokenService.issueToken({
      userId,
      token: refreshToken,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ip,
      expiresAt: addMinutes(new Date(), 60 * 24 * 7),
    });

    return { accessToken, refreshToken };
  }

  private async findMatchingToken(
    tokens: {
      id: string;
      tokenHash: string;
      userId: string;
      userAgent: string | null;
      ipAddress: string | null;
    }[],
    token: string,
  ) {
    for (const stored of tokens) {
      if (
        await this.passwordService.verifyRefreshToken(stored.tokenHash, token)
      ) {
        return stored;
      }
    }
    return null;
  }

  private async findMatchingMagicLink(
    tokens: { id: string; email: string; tokenHash: string }[],
    token: string,
  ) {
    for (const stored of tokens) {
      if (
        await this.passwordService.verifyRefreshToken(stored.tokenHash, token)
      ) {
        return stored;
      }
    }
    return null;
  }
}
