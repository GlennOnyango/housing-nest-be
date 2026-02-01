import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeases(userId: string, page: number, pageSize: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.tenantLease.findMany({
        where: { tenantUserId: userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.tenantLease.count({
        where: { tenantUserId: userId },
      }),
    ]);

    return { items, total, page, pageSize };
  }

  async getInvoices(userId: string, status: string | undefined, page: number, pageSize: number) {
    const where = {
      tenantUserId: userId,
      status: status ? (status as never) : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async getInvoice(userId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantUserId: userId },
      include: { lines: true, payments: true },
    });
    if (!invoice) {
      throw new NotFoundException();
    }
    return invoice;
  }

  async getBalance(userId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { tenantUserId: userId },
      select: { total: true, payments: { select: { amount: true, status: true } } },
    });
    const total = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
    const paid = invoices.reduce((sum, invoice) => {
      const invoicePaid = invoice.payments.reduce((p, payment) => {
        if (payment.status === 'CONFIRMED') {
          return p + Number(payment.amount);
        }
        return p;
      }, 0);
      return sum + invoicePaid;
    }, 0);
    return { total, paid, balance: total - paid };
  }
}
