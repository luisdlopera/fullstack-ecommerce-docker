import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { SharedModule } from '../../shared/shared.module';
import { AuthController } from './infrastructure/http/auth.controller';
import { AuthService } from './application/auth.service';
import { AUTH_REPOSITORY } from './domain/ports/auth-repository.port';
import { EMAIL_SENDER } from './domain/ports/email-sender.port';
import { TOKEN_SERVICE } from './domain/ports/token-service.port';
import { EmailSenderAdapter } from './infrastructure/email/email-sender.adapter';
import { PrismaAuthRepository } from './infrastructure/persistence/prisma-auth.repository';
import { JwtTokenService } from './infrastructure/security/jwt-token.service';

@Module({
  imports: [JwtModule.register({}), ThrottlerModule, SharedModule],
  controllers: [AuthController],
  providers: [
    AuthService,
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
