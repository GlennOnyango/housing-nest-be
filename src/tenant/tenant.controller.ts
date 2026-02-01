import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { RequireRole } from '../common/auth/roles.decorator';
import { TenantService } from './tenant.service';

@ApiTags('tenant')
@ApiBearerAuth('access-token')
@Controller('tenant/me')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('leases')
  @RequireRole('TENANT')
  async getLeases(
    @Req() req: Request & { user?: { id: string } },
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedPageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
    return this.tenantService.getLeases(req.user?.id ?? '', parsedPage, parsedPageSize);
  }

  @Get('invoices')
  @RequireRole('TENANT')
  async getInvoices(
    @Req() req: Request & { user?: { id: string } },
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedPageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
    return this.tenantService.getInvoices(
      req.user?.id ?? '',
      status,
      parsedPage,
      parsedPageSize,
    );
  }

  @Get('invoices/:id')
  @RequireRole('TENANT')
  async getInvoice(
    @Req() req: Request & { user?: { id: string } },
    @Param('id') id: string,
  ) {
    return this.tenantService.getInvoice(req.user?.id ?? '', id);
  }

  @Get('balance')
  @RequireRole('TENANT')
  async getBalance(@Req() req: Request & { user?: { id: string } }) {
    return this.tenantService.getBalance(req.user?.id ?? '');
  }
}
