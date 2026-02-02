import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class AdminCreateOrgDto {
  @IsString()
  name!: string;

  @IsEmail()
  ownerEmail!: string;

  @IsString()
  @MinLength(8)
  ownerPassword!: string;

  @IsString()
  @IsOptional()
  ownerFirstName?: string;

  @IsString()
  @IsOptional()
  ownerLastName?: string;
}
