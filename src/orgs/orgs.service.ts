import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { PasswordService } from '../auth/password.service';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class OrgsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async inviteMember(orgId: string, actorUserId: string, dto: InviteMemberDto) {
    const membership = await this.prisma.orgMembership.findFirst({
      where: { orgId, userId: actorUserId, deletedAt: null },
    });
    if (!membership || membership.role === 'TENANT') {
      throw new ForbiddenException();
    }
    if (membership.role !== 'OWNER' && membership.role !== 'AGENT' && membership.role !== 'ADMIN') {
      throw new ForbiddenException();
    }

    const user = await this.prisma.user.upsert({
      where: { email: dto.email },
      update: {},
      create: {
        email: dto.email,
        profile: dto.phone ? { create: { phone: dto.phone } } : undefined,
      },
    });

    await this.prisma.orgMembership.upsert({
      where: { userId_orgId: { userId: user.id, orgId } },
      update: { role: dto.role, deletedAt: null },
      create: {
        userId: user.id,
        orgId,
        role: dto.role,
      },
    });

    const token = randomBytes(32).toString('hex');
    const tokenHash = await this.passwordService.hashRefreshToken(token);

    const invite = await this.prisma.onboardingInvite.create({
      data: {
        orgId,
        houseUnitId: null,
        tokenHash,
        tenantEmail: dto.email,
        tenantPhone: dto.phone,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
        purpose: 'ORG_MEMBER',
      },
    });

    await this.auditLogService.log({
      orgId,
      actorUserId: actorUserId,
      action: 'ORG_MEMBER_INVITE',
      entity: 'OrgMembership',
      entityId: invite.id,
      meta: { role: dto.role, email: dto.email },
    });

    return { inviteId: invite.id, token };
  }

  async updateMemberRole(
    orgId: string,
    memberId: string,
    actorUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const actor = await this.prisma.orgMembership.findFirst({
      where: { orgId, userId: actorUserId, deletedAt: null },
    });
    if (!actor || actor.role !== 'OWNER') {
      throw new ForbiddenException();
    }

    const member = await this.prisma.orgMembership.findFirst({
      where: { id: memberId, orgId, deletedAt: null },
    });
    if (!member) {
      throw new NotFoundException();
    }
    if (member.role === 'OWNER') {
      throw new ForbiddenException();
    }

    const updated = await this.prisma.orgMembership.update({
      where: { id: member.id },
      data: { role: dto.role },
    });

    await this.auditLogService.log({
      orgId,
      actorUserId: actorUserId,
      action: 'ORG_MEMBER_ROLE_UPDATE',
      entity: 'OrgMembership',
      entityId: member.id,
      meta: { role: dto.role },
    });

    return updated;
  }

  async removeMember(orgId: string, memberId: string, actorUserId: string) {
    const actor = await this.prisma.orgMembership.findFirst({
      where: { orgId, userId: actorUserId, deletedAt: null },
    });
    if (!actor || actor.role !== 'OWNER') {
      throw new ForbiddenException();
    }

    const member = await this.prisma.orgMembership.findFirst({
      where: { id: memberId, orgId, deletedAt: null },
    });
    if (!member) {
      throw new NotFoundException();
    }
    if (member.role === 'OWNER') {
      throw new ForbiddenException();
    }

    await this.prisma.orgMembership.update({
      where: { id: member.id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.log({
      orgId,
      actorUserId: actorUserId,
      action: 'ORG_MEMBER_REMOVED',
      entity: 'OrgMembership',
      entityId: member.id,
    });
  }
}
