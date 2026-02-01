import { IsOptional, IsString, IsObject } from 'class-validator';

export class NewLeaseTemplateVersionDto {
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
