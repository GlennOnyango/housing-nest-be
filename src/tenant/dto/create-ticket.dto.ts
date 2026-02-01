import { IsOptional, IsString } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  category!: string;

  @IsString()
  description!: string;

  @IsOptional()
  attachments?: Record<string, unknown>;
}
