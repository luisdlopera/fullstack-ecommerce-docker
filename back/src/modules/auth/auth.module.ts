import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { SharedModule } from '../../shared/shared.module';
import { AuthController } from './infrastructure/http/auth.controller';
import { AuthService } from './application/auth.service';

@Module({
  imports: [JwtModule.register({}), ThrottlerModule, SharedModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [JwtModule],
})
export class AuthModule {}
