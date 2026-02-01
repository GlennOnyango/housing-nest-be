import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { RequireRole } from '../common/auth/roles.decorator';
import { CreateNoticeDto } from './dto/notice-create.dto';
import { NoticesService } from './notices.service';

@ApiTags('notices')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Post('notices')
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async create(
    @Body() dto: CreateNoticeDto,
    @Req() req: Request & { user?: { id: string; orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.noticesService.create(orgId, req.user?.id ?? '', dto);
  }

  @Get('tenant/me/notices')
  @RequireRole('TENANT')
  async list(
    @Req() req: Request & { user?: { id: string } },
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedPageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
    return this.noticesService.listForTenant(
      req.user?.id ?? '',
      parsedPage,
      parsedPageSize,
    );
  }
}
