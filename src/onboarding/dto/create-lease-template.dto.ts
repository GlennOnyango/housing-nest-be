import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class CreateLeaseTemplateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  documentMarkdown?: string;

  @IsString()
  @IsOptional()
  documentHtml?: string;

  @IsObject()
  @IsOptional()
  requiredFields?: Record<string, unknown>;
}
