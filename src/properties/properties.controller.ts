import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrgScopeGuard } from '../common/auth/org-scope.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { RequireRole } from '../common/auth/roles.decorator';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

@ApiTags('properties')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, OrgScopeGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post('properties')
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async create(
    @Body() dto: CreatePropertyDto,
    @Req() req: Request & { user?: { id: string; orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.propertiesService.create(orgId, req.user?.id ?? '', dto);
  }

  @Get('properties')
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async list(@Req() req: Request & { user?: { orgIds: string[] } }) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.propertiesService.list(orgId);
  }

  @Get('properties/:id')
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async get(
    @Param('id') id: string,
    @Req() req: Request & { user?: { orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.propertiesService.get(orgId, id);
  }

  @Patch('properties/:id')
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
    @Req() req: Request & { user?: { id: string; orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.propertiesService.update(orgId, id, req.user?.id ?? '', dto);
  }

  @Delete('properties/:id')
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async remove(
    @Param('id') id: string,
    @Req() req: Request & { user?: { id: string; orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    await this.propertiesService.remove(orgId, id, req.user?.id ?? '');
  }
}
