import { IsOptional, IsString } from 'class-validator';

export class PresignUploadDto {
  @IsString()
  filename!: string;

  @IsString()
  contentType!: string;

  @IsOptional()
  metadata?: Record<string, string>;
}
