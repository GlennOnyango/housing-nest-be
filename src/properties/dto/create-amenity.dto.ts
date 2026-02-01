import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAmenityDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
