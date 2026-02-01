import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { AuditLogService } from '../audit/audit-log.service';
import { PasswordService } from '../auth/password.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOnboardingConfigDto } from './dto/update-onboarding-config.dto';
import { CreateLeaseTemplateDto } from './dto/create-lease-template.dto';
import { NewLeaseTemplateVersionDto } from './dto/new-lease-template-version.dto';
import { InviteTenantDto } from './dto/invite-tenant.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { PdfRendererService } from './pdf-renderer.service';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly auditLogService: AuditLogService,
    private readonly pdfRendererService: PdfRendererService,
  ) {}

  async getConfig(orgId: string) {
    return this.prisma.onboardingConfig.findUnique({
      where: { orgId },
    });
  }

  async updateConfig(orgId: string, actorUserId: string, dto: UpdateOnboardingConfigDto) {
    const config = await this.prisma.onboardingConfig.upsert({
      where: { orgId },
      update: {
        requiredDocuments: dto.requiredDocuments,
        requiredProfileFields: dto.requiredProfileFields,
        requiredLeaseTemplateIds: dto.requiredLeaseTemplateIds,
      },
      create: {
        orgId,
        requiredDocuments: dto.requiredDocuments,
        requiredProfileFields: dto.requiredProfileFields,
        requiredLeaseTemplateIds: dto.requiredLeaseTemplateIds,
      },
    });

    await this.auditLogService.log({
      orgId,
      actorUserId,
      action: 'ONBOARDING_CONFIG_UPDATE',
      entity: 'OnboardingConfig',
      entityId: config.id,
    });

    return config;
  }

  async createLeaseTemplate(orgId: string, actorUserId: string, dto: CreateLeaseTemplateDto) {
    const template = await this.prisma.leaseTemplate.create({
      data: {
        orgId,
        name: dto.name,
        version: 1,
        requiredFields: dto.requiredFields,
        documentMarkdown: dto.documentMarkdown,
        documentHtml: dto.documentHtml,
      },
    });

    await this.auditLogService.log({
      orgId,
      actorUserId,
      action: 'LEASE_TEMPLATE_CREATE',
      entity: 'LeaseTemplate',
      entityId: template.id,
    });

    return template;
  }

  async newLeaseTemplateVersion(
    orgId: string,
    actorUserId: string,
    templateId: string,
    dto: NewLeaseTemplateVersionDto,
  ) {
    const existing = await this.prisma.leaseTemplate.findFirst({
      where: { id: templateId, orgId },
    });
    if (!existing) {
      throw new NotFoundException();
    }

    const template = await this.prisma.leaseTemplate.create({
      data: {
        orgId,
        name: existing.name,
        version: existing.version + 1,
        requiredFields: dto.requiredFields ?? existing.requiredFields,
        documentMarkdown: dto.documentMarkdown ?? existing.documentMarkdown,
        documentHtml: dto.documentHtml ?? existing.documentHtml,
      },
    });

    await this.auditLogService.log({
      orgId,
      actorUserId,
      action: 'LEASE_TEMPLATE_VERSION',
      entity: 'LeaseTemplate',
      entityId: template.id,
      meta: { fromVersion: existing.version, toVersion: template.version },
    });

    return template;
  }

  async listLeaseTemplates(orgId: string) {
    return this.prisma.leaseTemplate.findMany({
      where: { orgId },
      orderBy: [{ name: 'asc' }, { version: 'desc' }],
    });
  }

  async inviteTenant(
    orgId: string,
    unitId: string,
    actorUserId: string,
    dto: InviteTenantDto,
  ) {
    const unit = await this.prisma.houseUnit.findFirst({
      where: { id: unitId, orgId, deletedAt: null },
    });
    if (!unit) {
      throw new NotFoundException();
    }

    const token = randomBytes(48).toString('hex');
    const tokenHash = await this.passwordService.hashRefreshToken(token);

    const invite = await this.prisma.onboardingInvite.create({
      data: {
        orgId,
        houseUnitId: unitId,
        tokenHash,
        tenantEmail: dto.email,
        tenantPhone: dto.phone,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        purpose: 'TENANT_INVITE',
      },
    });

    await this.auditLogService.log({
      orgId,
      actorUserId,
      action: 'TENANT_INVITE',
      entity: 'OnboardingInvite',
      entityId: invite.id,
      meta: { unitId, email: dto.email, phone: dto.phone },
    });

    return { inviteId: invite.id, token };
  }

  async claimInvite(token: string) {
    const candidates = await this.prisma.onboardingInvite.findMany({
      where: {
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (candidates.length === 0) {
      throw new NotFoundException();
    }

    for (const invite of candidates) {
      const match = await this.passwordService.verifyRefreshToken(
        invite.tokenHash,
        token,
      );
      if (!match) {
        continue;
      }

      await this.prisma.onboardingInvite.update({
        where: { id: invite.id },
        data: { claimedAt: new Date() },
      });

      return {
        inviteId: invite.id,
        orgId: invite.orgId,
        houseUnitId: invite.houseUnitId,
        tenantEmail: invite.tenantEmail ? mask(invite.tenantEmail) : null,
        tenantPhone: invite.tenantPhone ? mask(invite.tenantPhone) : null,
      };
    }

    throw new NotFoundException();
  }

  async completeProfile(inviteToken: string, dto: CompleteProfileDto) {
    const invite = await this.findInviteByToken(inviteToken);
    if (!invite) {
      throw new NotFoundException();
    }
    if (!invite.houseUnitId) {
      throw new ForbiddenException();
    }

    const unit = await this.prisma.houseUnit.findFirst({
      where: { id: invite.houseUnitId, orgId: invite.orgId, deletedAt: null },
    });
    if (!unit) {
      throw new NotFoundException();
    }

    const user =
      invite.tenantEmail
        ? await this.prisma.user.upsert({
            where: { email: invite.tenantEmail },
            update: {},
            create: {
              email: invite.tenantEmail,
            },
          })
        : await this.prisma.user.create({
            data: {},
          });

    await this.prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone ?? invite.tenantPhone ?? undefined,
        nationalId: dto.nationalId,
      },
      create: {
        userId: user.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone ?? invite.tenantPhone ?? undefined,
        nationalId: dto.nationalId,
      },
    });

    await this.prisma.orgMembership.upsert({
      where: { userId_orgId: { userId: user.id, orgId: invite.orgId } },
      update: { role: 'TENANT', deletedAt: null },
      create: {
        userId: user.id,
        orgId: invite.orgId,
        role: 'TENANT',
      },
    });

    const lease = await this.prisma.tenantLease.create({
      data: {
        orgId: invite.orgId,
        houseUnitId: unit.id,
        tenantUserId: user.id,
        status: 'PENDING',
        startDate: new Date(),
        rentSnapshot: unit.rent,
        depositSnapshot: unit.deposit,
        serviceChargeSnapshot: unit.serviceCharge,
      },
    });

    await this.auditLogService.log({
      orgId: invite.orgId,
      actorUserId: user.id,
      action: 'TENANT_PROFILE_COMPLETE',
      entity: 'Profile',
      entityId: user.id,
    });

    await this.auditLogService.log({
      orgId: invite.orgId,
      actorUserId: user.id,
      action: 'LEASE_CREATED',
      entity: 'TenantLease',
      entityId: lease.id,
      meta: { houseUnitId: unit.id },
    });

    await this.prisma.onboardingInvite.update({
      where: { id: invite.id },
      data: { consumedAt: new Date() },
    });

    return { userId: user.id, leaseId: lease.id };
  }

  async signLease(
    inviteToken: string,
    leaseId: string,
    signatureImageUrl?: string,
    meta?: { ip?: string; userAgent?: string },
  ) {
    const invite = await this.findInviteByToken(inviteToken);
    if (!invite || !invite.houseUnitId) {
      throw new NotFoundException();
    }

    const lease = await this.prisma.tenantLease.findFirst({
      where: { id: leaseId, orgId: invite.orgId },
    });
    if (!lease) {
      throw new NotFoundException();
    }

    const rendered = await this.pdfRendererService.renderLeasePdf({
      leaseId: lease.id,
      templateHtml: null,
    });

    const doc = await this.prisma.leaseDocument.create({
      data: {
        tenantLeaseId: lease.id,
        templateVersion: 1,
        renderedPdfUrl: rendered.url,
        pdfHash: rendered.hash,
        signatureEvidence: {
          signerUserId: lease.tenantUserId,
          signedAt: new Date().toISOString(),
          signatureImageUrl,
          ipAddress: meta?.ip ?? null,
          userAgent: meta?.userAgent ?? null,
        },
        signedAt: new Date(),
      },
    });

    await this.prisma.tenantLease.update({
      where: { id: lease.id },
      data: { signedAt: new Date(), status: 'ACTIVE' },
    });

    await this.auditLogService.log({
      orgId: lease.orgId,
      actorUserId: lease.tenantUserId,
      action: 'LEASE_SIGNED',
      entity: 'LeaseDocument',
      entityId: doc.id,
      meta: { pdfHash: rendered.hash },
    });

    return doc;
  }

  private async findInviteByToken(token: string) {
    const candidates = await this.prisma.onboardingInvite.findMany({
      where: {
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    for (const invite of candidates) {
      const match = await this.passwordService.verifyRefreshToken(
        invite.tokenHash,
        token,
      );
      if (match) {
        return invite;
      }
    }
    return null;
  }
}

function mask(value: string): string {
  if (value.length <= 4) {
    return '****';
  }
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
}
