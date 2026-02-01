import { Processor, Process } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InvoiceJobsService } from './invoice-jobs.service';

@Processor('invoice')
export class InvoiceJobsProcessor {
  constructor(private readonly invoiceJobsService: InvoiceJobsService) {}

  @Process('generate-monthly')
  async handleGenerateMonthly(_job: Job) {
    await this.invoiceJobsService.runMonthlyGeneration();
  }
}
