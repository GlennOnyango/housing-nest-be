import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as speakeasy from 'speakeasy';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: AdminLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash || !user.isPlatformAdmin) {
      throw new UnauthorizedException();
    }
    const ok = await this.passwordService.verifyPassword(user.passwordHash, dto.password);
    if (!ok) {
      throw new UnauthorizedException();
    }

    if (user.mfaEnabled && user.mfaSecret) {
      const tempToken = await this.jwtService.signAsync(
        { sub: user.id, role: 'ADMIN_PLATFORM', mfaPending: true },
        { expiresIn: '5m' },
      );
      return { mfaRequired: true, tempToken };
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: 'ADMIN_PLATFORM',
    });
    return { accessToken };
  }

  async verifyTotp(tempToken: string, token: string) {
    const payload = await this.jwtService.verifyAsync<{
      sub: string;
      role: string;
      mfaPending?: boolean;
    }>(tempToken);
    if (!payload.mfaPending || payload.role !== 'ADMIN_PLATFORM') {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user?.mfaSecret || !user.mfaEnabled) {
      throw new UnauthorizedException();
    }

    const ok = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!ok) {
      const recovered = await this.verifyRecoveryCode(user.id, token);
      if (!recovered) {
        throw new UnauthorizedException();
      }
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: 'ADMIN_PLATFORM',
    });
    return { accessToken };
  }

  async setupMfa(adminUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    });
    if (!user || !user.isPlatformAdmin) {
      throw new UnauthorizedException();
    }
    if (user.mfaEnabled) {
      throw new ConflictException('MFA already enabled');
    }

    const secret = speakeasy.generateSecret({
      name: `Housing Admin (${user.email ?? user.id})`,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { mfaSecret: secret.base32 },
    });

    const recoveryCodes = await this.generateRecoveryCodes(user.id);

    return { otpauthUrl: secret.otpauth_url, base32: secret.base32, recoveryCodes };
  }

  async enableMfa(adminUserId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    });
    if (!user || !user.mfaSecret) {
      throw new UnauthorizedException();
    }

    const ok = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!ok) {
      throw new UnauthorizedException();
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: true },
    });
  }

  async regenerateRecoveryCodes(adminUserId: string) {
    await this.prisma.adminRecoveryCode.deleteMany({
      where: { userId: adminUserId },
    });
    return this.generateRecoveryCodes(adminUserId);
  }

  async verifyRecoveryCode(adminUserId: string, code: string) {
    const codes = await this.prisma.adminRecoveryCode.findMany({
      where: { userId: adminUserId, consumedAt: null },
    });
    for (const entry of codes) {
      const ok = await this.passwordService.verifyRefreshToken(entry.codeHash, code);
      if (ok) {
        await this.prisma.adminRecoveryCode.update({
          where: { id: entry.id },
          data: { consumedAt: new Date() },
        });
        return true;
      }
    }
    return false;
  }

  private async generateRecoveryCodes(userId: string) {
    const codes = Array.from({ length: 8 }, () => randomBytes(6).toString('hex'));
    for (const code of codes) {
      const codeHash = await this.passwordService.hashRefreshToken(code);
      await this.prisma.adminRecoveryCode.create({
        data: { userId, codeHash },
      });
    }
    return codes;
  }
}
