import { IsString, Matches } from 'class-validator';

export class MfaVerifyDto {
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}
