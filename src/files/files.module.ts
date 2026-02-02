import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesRetentionService } from './files-retention.service';
import { FilesService } from './files.service';
import { StorageService } from './storage.service';
import { VirusScanService } from './virus-scan.service';

@Module({
  controllers: [FilesController],
  providers: [
    FilesService,
    StorageService,
    VirusScanService,
    FilesRetentionService,
  ],
})
export class FilesModule {}
