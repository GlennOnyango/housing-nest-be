import { IsOptional, IsString } from 'class-validator';

export class SignLeaseDto {
  @IsString()
  leaseId!: string;

  @IsString()
  @IsOptional()
  signatureImageUrl?: string;
}
