import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InvoiceService } from './invoice.service';

@Injectable()
export class InvoiceJobsService implements OnModuleInit {
  private readonly logger = new Logger(InvoiceJobsService.name);

  constructor(
    @InjectQueue('invoice') private readonly invoiceQueue: Queue,
    private readonly invoiceService: InvoiceService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!process.env.REDIS_URL) {
      this.logger.warn('REDIS_URL not set; invoice scheduler disabled');
      return;
    }

    await this.invoiceQueue.add(
      'generate-monthly',
      {},
      {
        repeat: {
          cron: '0 0 1 * *',
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  async runMonthlyGeneration(): Promise<void> {
    const period = new Date().toISOString().slice(0, 7);
    await this.invoiceService.generateForPeriodAll(period);
  }
}
