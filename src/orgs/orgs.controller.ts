import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
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
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { OrgsService } from './orgs.service';

@ApiTags('orgs')
@ApiBearerAuth('access-token')
@Controller('orgs')
@UseGuards(JwtAuthGuard, RolesGuard, OrgScopeGuard)
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) {}

  @Post(':orgId/members/invite')
  @RequireOrgScope()
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async inviteMember(
    @Param('orgId') orgId: string,
    @Body() dto: InviteMemberDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.orgsService.inviteMember(orgId, req.user?.id ?? '', dto);
  }

  @Patch(':orgId/members/:memberId/role')
  @RequireOrgScope()
  @RequireRole('OWNER')
  async updateRole(
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.orgsService.updateMemberRole(orgId, memberId, req.user?.id ?? '', dto);
  }

  @Delete(':orgId/members/:memberId')
  @RequireOrgScope()
  @RequireRole('OWNER')
  async removeMember(
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
    @Req() req: Request & { user?: { id: string } },
  ) {
    await this.orgsService.removeMember(orgId, memberId, req.user?.id ?? '');
  }
}
