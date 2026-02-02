import { Body, Controller, Delete, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { RequireRole } from '../common/auth/roles.decorator';
import { CreateFileAssetDto } from './dto/create-file-asset.dto';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { FilesService } from './files.service';

@ApiTags('files')
@ApiBearerAuth('access-token')
@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('presign-upload')
  @RequireRole('OWNER', 'AGENT', 'ADMIN', 'TENANT')
  async presignUpload(
    @Body() dto: PresignUploadDto,
    @Req() req: Request & { user?: { id: string; orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.filesService.presignUpload(orgId, req.user?.id ?? '', dto);
  }

  @Post()
  @RequireRole('OWNER', 'AGENT', 'ADMIN', 'TENANT')
  async createAsset(
    @Body() dto: CreateFileAssetDto,
    @Req() req: Request & { user?: { id: string; orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.filesService.createAsset(orgId, req.user?.id ?? '', dto);
  }

  @Post(':assetId/presign-download')
  @RequireRole('OWNER', 'AGENT', 'ADMIN', 'TENANT')
  async presignDownload(
    @Param('assetId') assetId: string,
    @Req() req: Request & { user?: { orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.filesService.presignDownload(orgId, assetId);
  }

  @Delete(':assetId')
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async deleteAsset(
    @Param('assetId') assetId: string,
    @Req() req: Request & { user?: { orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.filesService.softDelete(orgId, assetId);
  }
}
