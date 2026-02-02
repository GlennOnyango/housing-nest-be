import { IsEmail, IsString, MinLength } from 'class-validator';

export class AdminCreatePlatformUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
