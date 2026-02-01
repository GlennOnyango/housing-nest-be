import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export enum InviteRole {
  AGENT = 'AGENT',
  CARETAKER = 'CARETAKER',
  ADMIN = 'ADMIN',
}

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(InviteRole)
  role!: InviteRole;

  @IsString()
  @IsOptional()
  phone?: string;
}
