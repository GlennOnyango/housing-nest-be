import { IsEnum } from 'class-validator';
import { InviteRole } from './invite-member.dto';

export class UpdateMemberRoleDto {
  @IsEnum(InviteRole)
  role!: InviteRole;
}
