import { IsEmail, IsOptional, IsString } from 'class-validator';

export class InviteTenantDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
