import { IsOptional, IsString } from 'class-validator';

export class CreateFileAssetDto {
  @IsString()
  type!: string;

  @IsString()
  url!: string;

  @IsString()
  @IsOptional()
  checksum?: string;

  @IsOptional()
  encryptedMeta?: Record<string, unknown>;
}
