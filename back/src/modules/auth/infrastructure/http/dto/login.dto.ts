import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(100)
  password!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/)
  mfaCode?: string;
}
