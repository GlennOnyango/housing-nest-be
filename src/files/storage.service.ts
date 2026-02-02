import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  async presignUpload(params: {
    key: string;
    contentType: string;
    expiresInSeconds: number;
  }) {
    const url = `https://storage.example.com/upload/${params.key}`;
    this.logger.log(`Presigned upload for ${params.key}`);
    return { url, method: 'PUT', expiresInSeconds: params.expiresInSeconds };
  }

  async presignDownload(params: { key: string; expiresInSeconds: number }) {
    const url = `https://storage.example.com/download/${params.key}`;
    this.logger.log(`Presigned download for ${params.key}`);
    return { url, expiresInSeconds: params.expiresInSeconds };
  }
}
