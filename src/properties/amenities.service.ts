import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogService } from '../audit/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAmenityDto } from './dto/create-amenity.dto';

@Injectable()
export class AmenitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(orgId: string, actorUserId: string, dto: CreateAmenityDto) {
    const amenity = await this.prisma.amenity.create({
      data: {
        orgId,
        name: dto.name,
      },
    });

    await this.auditLogService.log({
      orgId,
      actorUserId,
      action: 'AMENITY_CREATE',
      entity: 'Amenity',
      entityId: amenity.id,
    });

    return amenity;
  }

  async list(orgId: string) {
    return this.prisma.amenity.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assign(orgId: string, unitId: string, amenityId: string, actorUserId: string) {
    const unit = await this.prisma.houseUnit.findFirst({
      where: { id: unitId, orgId, deletedAt: null },
    });
    if (!unit) {
      throw new NotFoundException();
    }

    const amenity = await this.prisma.amenity.findFirst({
      where: { id: amenityId, orgId },
    });
    if (!amenity) {
      throw new NotFoundException();
    }

    await this.prisma.houseAmenity.create({
      data: {
        houseUnitId: unitId,
        amenityId,
      },
    });

    await this.auditLogService.log({
      orgId,
      actorUserId,
      action: 'AMENITY_ASSIGN',
      entity: 'HouseAmenity',
      entityId: `${unitId}:${amenityId}`,
    });
  }

  async unassign(orgId: string, unitId: string, amenityId: string, actorUserId: string) {
    const unit = await this.prisma.houseUnit.findFirst({
      where: { id: unitId, orgId, deletedAt: null },
    });
    if (!unit) {
      throw new NotFoundException();
    }

    const amenity = await this.prisma.amenity.findFirst({
      where: { id: amenityId, orgId },
    });
    if (!amenity) {
      throw new NotFoundException();
    }

    await this.prisma.houseAmenity.delete({
      where: {
        houseUnitId_amenityId: {
          houseUnitId: unitId,
          amenityId,
        },
      },
    });

    await this.auditLogService.log({
      orgId,
      actorUserId,
      action: 'AMENITY_UNASSIGN',
      entity: 'HouseAmenity',
      entityId: `${unitId}:${amenityId}`,
    });
  }
}
