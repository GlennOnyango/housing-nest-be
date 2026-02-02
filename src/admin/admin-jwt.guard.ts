import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Injectable()
export class AdminJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: { id: string } }>();
    const header = request.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    const token = header.substring('Bearer '.length).trim();
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; role?: string }>(token);
      if (payload.role !== 'ADMIN_PLATFORM') {
        throw new UnauthorizedException();
      }
      request.user = { id: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
