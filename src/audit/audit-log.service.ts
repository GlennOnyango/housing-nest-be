import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    orgId?: string | null;
    actorUserId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    beforeHash?: string | null;
    afterHash?: string | null;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        orgId: params.orgId ?? null,
        actorUserId: params.actorUserId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        beforeHash: params.beforeHash ?? null,
        afterHash: params.afterHash ?? null,
        meta: params.meta ?? undefined,
      },
    });
  }
}
