import { IsString, Matches, MinLength } from 'class-validator';

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(10)
  @Matches(PASSWORD_POLICY, {
    message:
      'Password must include at least one uppercase letter, one lowercase letter, one number and one symbol',
  })
  newPassword!: string;
}
