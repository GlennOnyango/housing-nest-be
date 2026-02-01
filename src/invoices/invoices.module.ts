import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InvoiceController } from './invoice.controller';
import { InvoiceJobsProcessor } from './invoice-jobs.processor';
import { InvoiceJobsService } from './invoice-jobs.service';
import { InvoiceLinkService } from './invoice-link.service';
import { InvoiceRetryService } from './invoice-retry.service';
import { InvoiceService } from './invoice.service';
import { NotificationService } from './notification.service';
import { PublicInvoiceController } from './public-invoice.controller';

@Module({
  imports: [
    BullModule.forRoot({
      connection: process.env.REDIS_URL
        ? { url: process.env.REDIS_URL }
        : undefined,
    }),
    BullModule.registerQueue({ name: 'invoice' }),
  ],
  controllers: [InvoiceController, PublicInvoiceController],
  providers: [
    InvoiceService,
    InvoiceLinkService,
    NotificationService,
    InvoiceJobsService,
    InvoiceJobsProcessor,
    InvoiceRetryService,
  ],
})
export class InvoicesModule {}
