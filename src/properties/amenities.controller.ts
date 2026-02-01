import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { RequireRole } from '../common/auth/roles.decorator';
import { CreateAmenityDto } from './dto/create-amenity.dto';
import { AmenitiesService } from './amenities.service';

@ApiTags('amenities')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Post('amenities')
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async create(
    @Body() dto: CreateAmenityDto,
    @Req() req: Request & { user?: { id: string; orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.amenitiesService.create(orgId, req.user?.id ?? '', dto);
  }

  @Get('amenities')
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async list(@Req() req: Request & { user?: { orgIds: string[] } }) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.amenitiesService.list(orgId);
  }

  @Post('units/:unitId/amenities/:amenityId')
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async assign(
    @Param('unitId') unitId: string,
    @Param('amenityId') amenityId: string,
    @Req() req: Request & { user?: { id: string; orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    await this.amenitiesService.assign(
      orgId,
      unitId,
      amenityId,
      req.user?.id ?? '',
    );
  }

  @Delete('units/:unitId/amenities/:amenityId')
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async unassign(
    @Param('unitId') unitId: string,
    @Param('amenityId') amenityId: string,
    @Req() req: Request & { user?: { id: string; orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    await this.amenitiesService.unassign(
      orgId,
      unitId,
      amenityId,
      req.user?.id ?? '',
    );
  }
}
