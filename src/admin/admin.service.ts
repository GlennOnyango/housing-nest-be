import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';
import { AuditLogService } from '../audit/audit-log.service';
import { AdminCreateOrgDto } from './dto/admin-create-org.dto';
import { AdminOnboardingDefaultsDto } from './dto/admin-onboarding-defaults.dto';
import { AdminCreatePlatformUserDto } from './dto/admin-create-platform-user.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createPlatformAdmin(dto: AdminCreatePlatformUserDto, actorUserId?: string) {
    const passwordHash = await this.passwordService.hashPassword(dto.password);
    const user = await this.prisma.user.upsert({
      where: { email: dto.email },
      update: {
        passwordHash,
        isPlatformAdmin: true,
      },
      create: {
        email: dto.email,
        passwordHash,
        isPlatformAdmin: true,
      },
    });

    await this.auditLogService.log({
      actorUserId: actorUserId ?? user.id,
      action: 'PLATFORM_ADMIN_CREATE',
      entity: 'User',
      entityId: user.id,
    });

    return { id: user.id, email: user.email };
  }

  async createOrg(dto: AdminCreateOrgDto, actorUserId?: string) {
    const passwordHash = await this.passwordService.hashPassword(dto.ownerPassword);
    const owner = await this.prisma.user.upsert({
      where: { email: dto.ownerEmail },
      update: {
        passwordHash,
      },
      create: {
        email: dto.ownerEmail,
        passwordHash,
        profile: {
          create: {
            firstName: dto.ownerFirstName,
            lastName: dto.ownerLastName,
          },
        },
      },
    });

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        ownerUserId: owner.id,
        memberships: {
          create: {
            userId: owner.id,
            role: 'OWNER',
          },
        },
      },
    });

    await this.auditLogService.log({
      orgId: org.id,
      actorUserId: actorUserId ?? owner.id,
      action: 'ORG_CREATE',
      entity: 'Organization',
      entityId: org.id,
    });

    return org;
  }

  async suspendOrg(orgId: string, reason?: string, actorUserId?: string) {
    const org = await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        suspendedAt: new Date(),
        suspendedReason: reason ?? null,
      },
    });
    await this.auditLogService.log({
      orgId: org.id,
      actorUserId: actorUserId ?? null,
      action: 'ORG_SUSPEND',
      entity: 'Organization',
      entityId: org.id,
      meta: { reason },
    });
    return org;
  }

  async unsuspendOrg(orgId: string, actorUserId?: string) {
    const org = await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        suspendedAt: null,
        suspendedReason: null,
      },
    });
    await this.auditLogService.log({
      orgId: org.id,
      actorUserId: actorUserId ?? null,
      action: 'ORG_UNSUSPEND',
      entity: 'Organization',
      entityId: org.id,
    });
    return org;
  }

  async getAuditLogs(orgId: string) {
    return this.prisma.auditLog.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        createdAt: true,
        actorUserId: true,
      },
    });
  }

  async updateOnboardingDefaults(orgId: string, dto: AdminOnboardingDefaultsDto, actorUserId?: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true },
    });
    if (!org) {
      throw new NotFoundException();
    }

    const config = await this.prisma.onboardingConfig.upsert({
      where: { orgId },
      update: {
        requiredDocuments: dto.requiredDocuments,
        requiredProfileFields: dto.requiredProfileFields,
      },
      create: {
        orgId,
        requiredDocuments: dto.requiredDocuments,
        requiredProfileFields: dto.requiredProfileFields,
      },
    });

    await this.auditLogService.log({
      orgId,
      actorUserId: actorUserId ?? null,
      action: 'ONBOARDING_DEFAULTS_UPDATE',
      entity: 'OnboardingConfig',
      entityId: config.id,
    });

    return config;
  }
}
