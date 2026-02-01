import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { RequireRole } from '../common/auth/roles.decorator';
import { ServiceProvidersService } from './service-providers.service';

@ApiTags('service-providers')
@ApiBearerAuth('access-token')
@Controller('tenant/me')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceProvidersController {
  constructor(
    private readonly serviceProvidersService: ServiceProvidersService,
  ) {}

  @Get('service-providers')
  @RequireRole('TENANT')
  async list(
    @Req() req: Request & { user?: { id: string } },
    @Query('category') category?: string,
  ) {
    return this.serviceProvidersService.listForTenant(
      req.user?.id ?? '',
      category,
    );
  }
}
