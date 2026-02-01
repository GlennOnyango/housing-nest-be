import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthTokensDto } from './auth.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { LogoutDto } from './dto/logout.dto';
import { RequestMagicLinkDto } from './dto/request-magic-link.dto';
import { ConsumeMagicLinkDto } from './dto/consume-magic-link.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-owner')
  @ApiOkResponse({ type: AuthTokensDto })
  async registerOwner(@Body() dto: RegisterOwnerDto) {
    return this.authService.registerOwner(dto);
  }

  @Post('login')
  @ApiOkResponse({ type: AuthTokensDto })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip =
      req.headers['x-forwarded-for']?.toString() ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, {
      ip: typeof ip === 'string' ? ip : undefined,
      userAgent: typeof userAgent === 'string' ? userAgent : undefined,
    });
  }

  @Post('refresh')
  @ApiOkResponse({ type: AuthTokensDto })
  async refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    const ip =
      req.headers['x-forwarded-for']?.toString() ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.refresh(dto.refreshToken, {
      ip: typeof ip === 'string' ? ip : undefined,
      userAgent: typeof userAgent === 'string' ? userAgent : undefined,
    });
  }

  @Post('request-magic-link')
  @HttpCode(204)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async requestMagicLink(@Body() dto: RequestMagicLinkDto) {
    await this.authService.requestMagicLink(dto.email);
  }

  @Post('consume-magic-link')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOkResponse({ type: AuthTokensDto })
  async consumeMagicLink(@Body() dto: ConsumeMagicLinkDto) {
    return this.authService.consumeMagicLink(dto.token);
  }

  @ApiBearerAuth('access-token')
  @HttpCode(204)
  @Post('logout')
  async logout(@Body() dto: LogoutDto) {
    await this.authService.logout(dto.refreshToken);
  }
}
