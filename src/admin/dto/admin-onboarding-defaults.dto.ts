import { IsArray, IsOptional, IsString } from 'class-validator';

export class AdminOnboardingDefaultsDto {
  @IsArray()
  @IsOptional()
  requiredDocuments?: string[];

  @IsArray()
  @IsOptional()
  requiredProfileFields?: string[];
}
