import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from '../../shared/shared.module';
import { AuthController } from './infrastructure/http/auth.controller';
import { AUTH_REPOSITORY } from './domain/ports/auth-repository.port';
import { EMAIL_SENDER } from './domain/ports/email-sender.port';
import { TOKEN_SERVICE } from './domain/ports/token-service.port';
import { EmailSenderAdapter } from './infrastructure/email/email-sender.adapter';
import { PrismaAuthRepository } from './infrastructure/persistence/prisma-auth.repository';
import { JwtTokenService } from './infrastructure/security/jwt-token.service';

// Use-cases
import {
  RegisterUseCase,
  LoginUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
  VerifyEmailUseCase,
  ResendVerificationUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  EnrollMfaUseCase,
  VerifyMfaUseCase,
  DisableMfaUseCase,
  GetMeUseCase,
} from './application/use-cases';

const USE_CASES = [
  RegisterUseCase,
  LoginUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
  VerifyEmailUseCase,
  ResendVerificationUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  EnrollMfaUseCase,
  VerifyMfaUseCase,
  DisableMfaUseCase,
  GetMeUseCase,
];

@Module({
  imports: [JwtModule.register({}), SharedModule],
  controllers: [AuthController],
  providers: [
    ...USE_CASES,
    {
      provide: AUTH_REPOSITORY,
      useClass: PrismaAuthRepository,
    },
    {
      provide: EMAIL_SENDER,
      useClass: EmailSenderAdapter,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
  ],
  exports: [JwtModule],
})
export class AuthModule {}
