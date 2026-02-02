import { IsString } from 'class-validator';

export class AdminVerifyTotpDto {
  @IsString()
  token!: string;

  @IsString()
  tempToken!: string;
}
