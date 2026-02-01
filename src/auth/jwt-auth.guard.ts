import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<
        Request & { user?: { id: string; roles: string[]; orgIds: string[] } }
      >();
    const header = request.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    const token = header.substring('Bearer '.length).trim();
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
      const memberships = await this.prisma.orgMembership.findMany({
        where: { userId: payload.sub, deletedAt: null },
        select: { orgId: true, role: true },
      });
      request.user = {
        id: payload.sub,
        roles: memberships.map((m) => m.role),
        orgIds: memberships.map((m) => m.orgId),
      };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
