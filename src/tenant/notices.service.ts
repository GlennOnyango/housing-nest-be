import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../audit/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoticeDto } from './dto/notice-create.dto';

@Injectable()
export class NoticesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(orgId: string, actorUserId: string, dto: CreateNoticeDto) {
    const notice = await this.prisma.notice.create({
      data: {
        orgId,
        propertyId: dto.propertyId,
        houseUnitId: dto.houseUnitId,
        tenantUserId: dto.tenantUserId,
        scope: dto.scope,
        title: dto.title,
        body: dto.body,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
    });

    await this.auditLogService.log({
      orgId,
      actorUserId,
      action: 'NOTICE_CREATE',
      entity: 'Notice',
      entityId: notice.id,
    });

    return notice;
  }

  async listForTenant(userId: string, page: number, pageSize: number) {
    const where = {
      OR: [
        { scope: 'ORG' },
        { scope: 'TENANT', tenantUserId: userId },
        {
          scope: 'UNIT',
          houseUnit: {
            leases: {
              some: { tenantUserId: userId, status: 'ACTIVE' },
            },
          },
        },
        {
          scope: 'PROPERTY',
          property: {
            units: {
              some: {
                leases: { some: { tenantUserId: userId, status: 'ACTIVE' } },
              },
            },
          },
        },
      ],
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notice.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }
}
