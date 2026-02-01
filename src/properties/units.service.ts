import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogService } from '../audit/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(orgId: string, propertyId: string, actorUserId: string, dto: CreateUnitDto) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, orgId, deletedAt: null },
    });
    if (!property) {
      throw new NotFoundException();
    }

    const unit = await this.prisma.houseUnit.create({
      data: {
        orgId,
        propertyId,
        unitLabel: dto.unitLabel,
        floor: dto.floor,
        status: dto.status,
        rent: dto.rent,
        deposit: dto.deposit,
        serviceCharge: dto.serviceCharge,
      },
    });

    await this.prisma.unitRentChange.create({
      data: {
        orgId,
        houseUnitId: unit.id,
        effectiveAt: new Date(),
        rent: unit.rent,
        deposit: unit.deposit,
        serviceCharge: unit.serviceCharge,
        actorUserId,
      },
    });

    await this.auditLogService.log({
      orgId,
      actorUserId,
      action: 'UNIT_CREATE',
      entity: 'HouseUnit',
      entityId: unit.id,
    });

    return unit;
  }

  async update(orgId: string, unitId: string, actorUserId: string, dto: UpdateUnitDto) {
    const unit = await this.prisma.houseUnit.findFirst({
      where: { id: unitId, orgId, deletedAt: null },
    });
    if (!unit) {
      throw new NotFoundException();
    }

    const nextRent = dto.rent ?? unit.rent;
    const nextDeposit = dto.deposit ?? unit.deposit;
    const nextServiceCharge = dto.serviceCharge ?? unit.serviceCharge;

    const updated = await this.prisma.houseUnit.update({
      where: { id: unit.id },
      data: {
        unitLabel: dto.unitLabel,
        floor: dto.floor,
        status: dto.status,
        rent: dto.rent,
        deposit: dto.deposit,
        serviceCharge: dto.serviceCharge,
      },
    });

    const pricingChanged =
      dto.rent !== undefined ||
      dto.deposit !== undefined ||
      dto.serviceCharge !== undefined;
    if (pricingChanged) {
      await this.prisma.unitRentChange.create({
        data: {
          orgId,
          houseUnitId: unit.id,
          effectiveAt: dto.effectiveAt ? new Date(dto.effectiveAt) : new Date(),
          rent: nextRent,
          deposit: nextDeposit,
          serviceCharge: nextServiceCharge,
          actorUserId,
        },
      });
      await this.auditLogService.log({
        orgId,
        actorUserId,
        action: 'UNIT_PRICING_UPDATE',
        entity: 'HouseUnit',
        entityId: unit.id,
        meta: {
          rent: dto.rent,
          deposit: dto.deposit,
          serviceCharge: dto.serviceCharge,
          effectiveAt: dto.effectiveAt,
        },
      });
    }

    await this.auditLogService.log({
      orgId,
      actorUserId,
      action: 'UNIT_UPDATE',
      entity: 'HouseUnit',
      entityId: unit.id,
    });

    return updated;
  }

  async listByProperty(orgId: string, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, orgId, deletedAt: null },
    });
    if (!property) {
      throw new NotFoundException();
    }

    return this.prisma.houseUnit.findMany({
      where: { propertyId, orgId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }
}
