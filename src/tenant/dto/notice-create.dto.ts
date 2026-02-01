import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export enum NoticeScopeDto {
  ORG = 'ORG',
  PROPERTY = 'PROPERTY',
  UNIT = 'UNIT',
  TENANT = 'TENANT',
}

export class CreateNoticeDto {
  @IsEnum(NoticeScopeDto)
  scope!: NoticeScopeDto;

  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsString()
  @IsOptional()
  houseUnitId?: string;

  @IsString()
  @IsOptional()
  tenantUserId?: string;

  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  @IsOptional()
  endsAt?: string;
}
