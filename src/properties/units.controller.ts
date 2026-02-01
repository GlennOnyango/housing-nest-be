import {
  Body,
  Controller,
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
import { RolesGuard } from '../common/auth/roles.guard';
import { RequireRole } from '../common/auth/roles.decorator';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitsService } from './units.service';

@ApiTags('units')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post('properties/:propertyId/units')
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async create(
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateUnitDto,
    @Req() req: Request & { user?: { id: string; orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.unitsService.create(orgId, propertyId, req.user?.id ?? '', dto);
  }

  @Get('properties/:propertyId/units')
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async listByProperty(
    @Param('propertyId') propertyId: string,
    @Req() req: Request & { user?: { orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.unitsService.listByProperty(orgId, propertyId);
  }

  @Patch('units/:unitId')
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async update(
    @Param('unitId') unitId: string,
    @Body() dto: UpdateUnitDto,
    @Req() req: Request & { user?: { id: string; orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.unitsService.update(orgId, unitId, req.user?.id ?? '', dto);
  }
}
