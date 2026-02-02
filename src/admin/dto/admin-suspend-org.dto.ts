import { IsOptional, IsString } from 'class-validator';

export class AdminSuspendOrgDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
