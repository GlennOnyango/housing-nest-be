import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async issueToken(params: {
    userId: string;
    token: string;
    sessionId?: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: Date;
  }): Promise<void> {
    const tokenHash = await this.passwordService.hashRefreshToken(params.token);

    await this.prisma.refreshToken.create({
      data: {
        userId: params.userId,
        tokenHash,
        sessionId: params.sessionId ?? randomUUID(),
        userAgent: params.userAgent,
        ipAddress: params.ipAddress,
        expiresAt: params.expiresAt,
      },
    });
  }

  async rotateToken(params: {
    tokenId: string;
    newToken: string;
    expiresAt: Date;
  }): Promise<void> {
    const tokenHash = await this.passwordService.hashRefreshToken(
      params.newToken,
    );
    await this.prisma.refreshToken.update({
      where: { id: params.tokenId },
      data: {
        tokenHash,
        rotatedAt: new Date(),
        expiresAt: params.expiresAt,
      },
    });
  }

  async revokeToken(tokenId: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
