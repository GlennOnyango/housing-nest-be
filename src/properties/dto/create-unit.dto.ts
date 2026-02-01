import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { UnitStatus } from '@prisma/client';

export class CreateUnitDto {
  @IsString()
  @IsNotEmpty()
  unitLabel!: string;

  @IsNumber()
  @IsOptional()
  floor?: number;

  @IsEnum(UnitStatus)
  @IsOptional()
  status?: UnitStatus;

  @IsNumber()
  @Min(0)
  rent!: number;

  @IsNumber()
  @Min(0)
  deposit!: number;

  @IsNumber()
  @Min(0)
  serviceCharge!: number;
}
