import { IsString } from 'class-validator';

export class GenerateInvoicesDto {
  @IsString()
  period!: string; // YYYY-MM
}
