import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationService } from './notification.service';

@Injectable()
export class InvoiceRetryService {
  constructor(private readonly notificationService: NotificationService) {}

  @Cron('*/5 * * * *')
  async handleRetries(): Promise<void> {
    await this.notificationService.retryFailedDeliveries();
  }
}
