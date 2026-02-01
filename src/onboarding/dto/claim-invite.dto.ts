import { IsString } from 'class-validator';

export class ClaimInviteDto {
  @IsString()
  token!: string;
}
