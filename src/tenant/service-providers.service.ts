import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServiceProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async listForTenant(userId: string, category?: string) {
    const membership = await this.prisma.orgMembership.findFirst({
      where: { userId, deletedAt: null },
      select: { orgId: true },
    });
    if (!membership) {
      return [];
    }
    return this.prisma.serviceProvider.findMany({
      where: {
        orgId: membership.orgId,
        category: category ?? undefined,
      },
      orderBy: { name: 'asc' },
    });
  }
}
