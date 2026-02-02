import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { VirusScanService } from './virus-scan.service';
import { CreateFileAssetDto } from './dto/create-file-asset.dto';
import { PresignUploadDto } from './dto/presign-upload.dto';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly virusScanService: VirusScanService,
  ) {}

  async presignUpload(orgId: string, userId: string, dto: PresignUploadDto) {
    const key = `${orgId}/${userId}/${Date.now()}-${dto.filename}`;
    const result = await this.storageService.presignUpload({
      key,
      contentType: dto.contentType,
      expiresInSeconds: 300,
    });
    await this.virusScanService.enqueueScan(key);
    return { ...result, key };
  }

  async createAsset(orgId: string, userId: string, dto: CreateFileAssetDto) {
    return this.prisma.fileAsset.create({
      data: {
        orgId,
        ownerUserId: userId,
        type: dto.type,
        url: dto.url,
        checksum: dto.checksum,
        encryptedMeta: dto.encryptedMeta,
      },
    });
  }

  async presignDownload(orgId: string, assetId: string) {
    const asset = await this.prisma.fileAsset.findFirst({
      where: { id: assetId, orgId, deletedAt: null },
    });
    if (!asset) {
      throw new NotFoundException();
    }
    const key = asset.url.split('/').pop() ?? asset.id;
    return this.storageService.presignDownload({
      key,
      expiresInSeconds: 300,
    });
  }

  async softDelete(orgId: string, assetId: string) {
    const asset = await this.prisma.fileAsset.findFirst({
      where: { id: assetId, orgId, deletedAt: null },
    });
    if (!asset) {
      throw new NotFoundException();
    }
    return this.prisma.fileAsset.update({
      where: { id: asset.id },
      data: { deletedAt: new Date() },
    });
  }

  async purgeDeleted(olderThanDays: number) {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    await this.prisma.fileAsset.deleteMany({
      where: { deletedAt: { lt: cutoff } },
    });
  }
}
