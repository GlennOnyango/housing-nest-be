import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrgScopeGuard } from '../common/auth/org-scope.guard';
import { RequireOrgScope } from '../common/auth/org-scope.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { RequireRole } from '../common/auth/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { UpdateOnboardingConfigDto } from './dto/update-onboarding-config.dto';
import { CreateLeaseTemplateDto } from './dto/create-lease-template.dto';
import { NewLeaseTemplateVersionDto } from './dto/new-lease-template-version.dto';
import { InviteTenantDto } from './dto/invite-tenant.dto';
import { ClaimInviteDto } from './dto/claim-invite.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { SignLeaseDto } from './dto/sign-lease.dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('onboarding')
@ApiBearerAuth('access-token')
@Controller()
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('orgs/:orgId/onboarding-config')
  @UseGuards(JwtAuthGuard, RolesGuard, OrgScopeGuard)
  @RequireOrgScope({ param: 'orgId' })
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async getConfig(@Param('orgId') orgId: string) {
    return this.onboardingService.getConfig(orgId);
  }

  @Put('orgs/:orgId/onboarding-config')
  @UseGuards(JwtAuthGuard, RolesGuard, OrgScopeGuard)
  @RequireOrgScope({ param: 'orgId' })
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async updateConfig(
    @Param('orgId') orgId: string,
    @Body() dto: UpdateOnboardingConfigDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.onboardingService.updateConfig(orgId, req.user?.id ?? '', dto);
  }

  @Post('lease-templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async createTemplate(
    @Body() dto: CreateLeaseTemplateDto,
    @Req() req: Request & { user?: { id: string; orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.onboardingService.createLeaseTemplate(orgId, req.user?.id ?? '', dto);
  }

  @Post('lease-templates/:id/new-version')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async newTemplateVersion(
    @Param('id') id: string,
    @Body() dto: NewLeaseTemplateVersionDto,
    @Req() req: Request & { user?: { id: string; orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.onboardingService.newLeaseTemplateVersion(orgId, req.user?.id ?? '', id, dto);
  }

  @Get('lease-templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async listTemplates(@Req() req: Request & { user?: { orgIds: string[] } }) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.onboardingService.listLeaseTemplates(orgId);
  }

  @Post('units/:unitId/invite-tenant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async inviteTenant(
    @Param('unitId') unitId: string,
    @Body() dto: InviteTenantDto,
    @Req() req: Request & { user?: { id: string; orgIds: string[] } },
  ) {
    const orgId = req.user?.orgIds[0] ?? '';
    return this.onboardingService.inviteTenant(orgId, unitId, req.user?.id ?? '', dto);
  }

  @Post('onboarding/claim')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async claim(@Body() dto: ClaimInviteDto) {
    return this.onboardingService.claimInvite(dto.token);
  }

  @Post('onboarding/complete-profile')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async completeProfile(@Body() dto: CompleteProfileDto, @Req() req: Request) {
    const token = req.headers['x-invite-token']?.toString() ?? '';
    return this.onboardingService.completeProfile(token, dto);
  }

  @Post('onboarding/sign-lease')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async signLease(@Body() dto: SignLeaseDto, @Req() req: Request) {
    const token = req.headers['x-invite-token']?.toString() ?? '';
    const ip = req.headers['x-forwarded-for']?.toString() ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.onboardingService.signLease(token, dto.leaseId, dto.signatureImageUrl, {
      ip: typeof ip === 'string' ? ip : undefined,
      userAgent: typeof userAgent === 'string' ? userAgent : undefined,
    });
  }
}
