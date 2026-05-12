export { AuthModule } from './auth.module';

// Use-cases
export {
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
  type AuthUserPayload,
} from './application/use-cases';

// Domain
export { AUTH_REPOSITORY, type AuthRepositoryPort } from './domain/ports/auth-repository.port';
export { TOKEN_SERVICE, type TokenServicePort } from './domain/ports/token-service.port';
export { EMAIL_SENDER, type EmailSenderPort } from './domain/ports/email-sender.port';
export { AuthMessages } from './domain/enums/auth-messages.enum';

// Infrastructure
export { AuthController } from './infrastructure/http/auth.controller';
export { RegisterDto } from './infrastructure/http/dto/register.dto';
export { LoginDto } from './infrastructure/http/dto/login.dto';
