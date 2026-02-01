import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class PdfRendererService {
  private readonly logger = new Logger(PdfRendererService.name);

  async renderLeasePdf(params: {
    leaseId: string;
    templateHtml?: string | null;
  }): Promise<{ url: string; hash: string }> {
    const payload = `${params.leaseId}:${params.templateHtml ?? ''}:${Date.now()}`;
    const hash = createHash('sha256').update(payload).digest('hex');
    const url = `https://storage.example.com/leases/${params.leaseId}.pdf`;
    this.logger.log(`Rendered lease PDF for ${params.leaseId}: ${url}`);
    return { url, hash };
  }
}
