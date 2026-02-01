import { IsString } from 'class-validator';

export class ConsumeInviteDto {
  @IsString()
  token!: string;
}
