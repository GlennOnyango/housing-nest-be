import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FilesService } from './files.service';

@Injectable()
export class FilesRetentionService {
  constructor(private readonly filesService: FilesService) {}

  @Cron('0 2 * * *')
  async purge(): Promise<void> {
    const days = Number(process.env.FILE_RETENTION_DAYS ?? 30);
    await this.filesService.purgeDeleted(days);
  }
}
