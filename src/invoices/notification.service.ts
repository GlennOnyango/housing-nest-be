import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendInvoiceLink(params: {
    invoiceId: string;
    channel: 'IN_APP' | 'WHATSAPP' | 'SMS' | 'EMAIL';
    provider?: string;
    payload?: Record<string, unknown>;
  }) {
    this.logger.log(`Send invoice ${params.invoiceId} via ${params.channel}`);
    await this.prisma.invoiceDeliveryLog.create({
      data: {
        invoiceId: params.invoiceId,
        channel: params.channel,
        status: 'SENT',
        provider: params.provider,
        payload: params.payload,
      },
    });
  }

  async recordFailure(params: {
    invoiceId: string;
    channel: 'IN_APP' | 'WHATSAPP' | 'SMS' | 'EMAIL';
    error: string;
    attempt: number;
  }) {
    await this.prisma.invoiceDeliveryLog.create({
      data: {
        invoiceId: params.invoiceId,
        channel: params.channel,
        status: 'FAILED',
        error: params.error,
        attempt: params.attempt,
        nextRetryAt: new Date(Date.now() + 60_000),
      },
    });
  }

  async retryFailedDeliveries() {
    const pending = await this.prisma.invoiceDeliveryLog.findMany({
      where: {
        status: 'FAILED',
        nextRetryAt: { lte: new Date() },
        attempt: { lt: 3 },
      },
      orderBy: { attemptedAt: 'asc' },
      take: 50,
    });

    for (const log of pending) {
      this.logger.warn(`Retry delivery ${log.id} for invoice ${log.invoiceId}`);
      await this.prisma.invoiceDeliveryLog.update({
        where: { id: log.id },
        data: {
          status: 'RETRYING',
          attempt: log.attempt + 1,
          nextRetryAt: new Date(Date.now() + 5 * 60_000),
        },
      });
    }

    const toDeadLetter = await this.prisma.invoiceDeliveryLog.findMany({
      where: {
        status: 'FAILED',
        attempt: { gte: 3 },
      },
      take: 50,
    });

    for (const log of toDeadLetter) {
      await this.prisma.invoiceDeliveryLog.update({
        where: { id: log.id },
        data: { status: 'DEAD_LETTER', deadLetteredAt: new Date() },
      });
    }
  }
}
