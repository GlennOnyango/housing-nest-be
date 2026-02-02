import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { AdminCreateOrgDto } from './dto/admin-create-org.dto';
import { AdminCreatePlatformUserDto } from './dto/admin-create-platform-user.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminOnboardingDefaultsDto } from './dto/admin-onboarding-defaults.dto';
import { AdminSuspendOrgDto } from './dto/admin-suspend-org.dto';
import { AdminVerifyTotpDto } from './dto/admin-verify-totp.dto';
import { AdminService } from './admin.service';
import { AdminJwtGuard } from './admin-jwt.guard';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly adminService: AdminService,
  ) {}

  @Post('auth/login')
  async login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }

  @Post('auth/verify-totp')
  async verifyTotp(@Body() dto: AdminVerifyTotpDto) {
    return this.adminAuthService.verifyTotp(dto.tempToken, dto.token);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AdminJwtGuard)
  @Post('auth/setup-mfa')
  async setupMfa(@Req() req: Request & { user?: { id: string } }) {
    return this.adminAuthService.setupMfa(req.user?.id ?? '');
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AdminJwtGuard)
  @Post('auth/enable-mfa')
  async enableMfa(
    @Req() req: Request & { user?: { id: string } },
    @Body() dto: AdminVerifyTotpDto,
  ) {
    await this.adminAuthService.enableMfa(req.user?.id ?? '', dto.token);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AdminJwtGuard)
  @Post('auth/recovery-codes')
  async regenerateRecoveryCodes(@Req() req: Request & { user?: { id: string } }) {
    return this.adminAuthService.regenerateRecoveryCodes(req.user?.id ?? '');
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AdminJwtGuard)
  @Post('platform-admins')
  async createPlatformAdmin(
    @Body() dto: AdminCreatePlatformUserDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.adminService.createPlatformAdmin(dto, req.user?.id ?? '');
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AdminJwtGuard)
  @Post('orgs')
  async createOrg(
    @Body() dto: AdminCreateOrgDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.adminService.createOrg(dto, req.user?.id ?? '');
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AdminJwtGuard)
  @Patch('orgs/:orgId/suspend')
  async suspendOrg(
    @Param('orgId') orgId: string,
    @Body() dto: AdminSuspendOrgDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.adminService.suspendOrg(orgId, dto.reason, req.user?.id ?? '');
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AdminJwtGuard)
  @Patch('orgs/:orgId/unsuspend')
  async unsuspendOrg(
    @Param('orgId') orgId: string,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.adminService.unsuspendOrg(orgId, req.user?.id ?? '');
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AdminJwtGuard)
  @Get('orgs/:orgId/audit-logs')
  async auditLogs(@Param('orgId') orgId: string) {
    return this.adminService.getAuditLogs(orgId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AdminJwtGuard)
  @Patch('orgs/:orgId/onboarding-defaults')
  async updateOnboardingDefaults(
    @Param('orgId') orgId: string,
    @Body() dto: AdminOnboardingDefaultsDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.adminService.updateOnboardingDefaults(orgId, dto, req.user?.id ?? '');
  }
}
