import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async generateForPeriodAll(period: string) {
    const orgs = await this.prisma.organization.findMany({
      select: { id: true },
    });
    const results = [];
    for (const org of orgs) {
      results.push(await this.generateForPeriod(org.id, period));
    }
    return results;
  }

  async generateForPeriod(orgId: string, period: string) {
    const leases = await this.prisma.tenantLease.findMany({
      where: { orgId, status: 'ACTIVE' },
      include: { houseUnit: true },
    });

    const created: string[] = [];

    for (const lease of leases) {
      const existing = await this.prisma.invoice.findFirst({
        where: {
          orgId,
          tenantUserId: lease.tenantUserId,
          houseUnitId: lease.houseUnitId,
          period,
        },
      });
      if (existing) {
        continue;
      }

      const total =
        Number(lease.rentSnapshot) + Number(lease.serviceChargeSnapshot);

      const invoice = await this.prisma.invoice.create({
        data: {
          orgId,
          tenantUserId: lease.tenantUserId,
          houseUnitId: lease.houseUnitId,
          tenantLeaseId: lease.id,
          period,
          total,
          status: 'PENDING',
          lines: {
            create: [
              {
                type: 'RENT',
                amount: lease.rentSnapshot,
              },
              {
                type: 'SERVICE_CHARGE',
                amount: lease.serviceChargeSnapshot,
              },
            ],
          },
        },
      });

      created.push(invoice.id);
    }

    return { created, count: created.length };
  }

  async assertInvoiceOrg(invoiceId: string, orgId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, orgId },
      select: { id: true },
    });
    if (!invoice) {
      throw new NotFoundException();
    }
  }
}
