import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';

@Injectable()
export class InvoiceLinkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async createLink(invoiceId: string, ttlMinutes?: number) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId },
      include: { org: true },
    });
    if (!invoice) {
      throw new NotFoundException();
    }

    const maxTtl = invoice.org.invoiceLinkTtlMinutes;
    const effectiveTtl = ttlMinutes ? Math.min(ttlMinutes, maxTtl) : maxTtl;

    const token = randomBytes(32).toString('hex');
    const tokenHash = await this.passwordService.hashRefreshToken(token);

    const link = await this.prisma.invoiceLink.create({
      data: {
        invoiceId,
        tokenHash,
        expiresAt: new Date(Date.now() + effectiveTtl * 60_000),
      },
    });

    return { id: link.id, token };
  }

  async verifyToken(token: string) {
    const candidates = await this.prisma.invoiceLink.findMany({
      where: {
        expiresAt: { gt: new Date() },
        consumedAt: null,
      },
      include: { invoice: { include: { lines: true, payments: true } } },
    });

    for (const link of candidates) {
      const ok = await this.passwordService.verifyRefreshToken(link.tokenHash, token);
      if (!ok) {
        continue;
      }

      await this.prisma.invoiceLink.update({
        where: { id: link.id },
        data: { consumedAt: new Date() },
      });

      return link.invoice;
    }

    throw new NotFoundException();
  }
}
