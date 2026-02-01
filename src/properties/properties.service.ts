import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogService } from '../audit/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(orgId: string, actorUserId: string, dto: CreatePropertyDto) {
    const property = await this.prisma.property.create({
      data: {
        orgId,
        name: dto.name,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country,
      },
    });

    await this.auditLogService.log({
      orgId,
      actorUserId,
      action: 'PROPERTY_CREATE',
      entity: 'Property',
      entityId: property.id,
    });

    return property;
  }

  async list(orgId: string) {
    return this.prisma.property.findMany({
      where: { orgId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(orgId: string, id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, orgId, deletedAt: null },
    });
    if (!property) {
      throw new NotFoundException();
    }
    return property;
  }

  async update(orgId: string, id: string, actorUserId: string, dto: UpdatePropertyDto) {
    const existing = await this.prisma.property.findFirst({
      where: { id, orgId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException();
    }

    const property = await this.prisma.property.update({
      where: { id: existing.id },
      data: {
        name: dto.name,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country,
      },
    });

    await this.auditLogService.log({
      orgId,
      actorUserId,
      action: 'PROPERTY_UPDATE',
      entity: 'Property',
      entityId: property.id,
    });

    return property;
  }

  async remove(orgId: string, id: string, actorUserId: string) {
    const existing = await this.prisma.property.findFirst({
      where: { id, orgId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException();
    }

    await this.prisma.property.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.log({
      orgId,
      actorUserId,
      action: 'PROPERTY_DELETE',
      entity: 'Property',
      entityId: existing.id,
    });
  }
}
