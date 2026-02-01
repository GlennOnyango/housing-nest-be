import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { UnitStatus } from '@prisma/client';

export class UpdateUnitDto {
  @IsString()
  @IsOptional()
  unitLabel?: string;

  @IsNumber()
  @IsOptional()
  floor?: number;

  @IsEnum(UnitStatus)
  @IsOptional()
  status?: UnitStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  rent?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  deposit?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  serviceCharge?: number;

  @IsDateString()
  @IsOptional()
  effectiveAt?: string;
}
