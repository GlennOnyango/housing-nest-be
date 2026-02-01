import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateOnboardingConfigDto {
  @IsArray()
  @IsOptional()
  requiredDocuments?: string[];

  @IsArray()
  @IsOptional()
  requiredProfileFields?: string[];

  @IsArray()
  @IsOptional()
  requiredLeaseTemplateIds?: string[];
}
