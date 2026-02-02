import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VirusScanService {
  private readonly logger = new Logger(VirusScanService.name);

  async enqueueScan(fileKey: string): Promise<void> {
    this.logger.log(`Enqueued virus scan for ${fileKey}`);
  }
}
