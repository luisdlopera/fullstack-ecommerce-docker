import { Body, Controller, Get, Headers, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../../../../shared/infrastructure/auth/public.decorator';
import { CurrentUser } from '../../../../shared/infrastructure/auth/current-user.decorator';
import type { JwtPayload } from '../../../../shared/infrastructure/auth/jwt-payload';
import { AuthService } from '../../application/auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { UnauthorizedError } from '../../../../shared/domain/errors/domain-error';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  private extractClientIp(request: Request): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0]?.trim();
    }
    if (Array.isArray(forwarded) && forwarded.length) {
      return forwarded[0];
    }
    return request.ip;
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    console.log('[AUTH CONTROLLER /auth/login] ============================================');
    console.log('[AUTH CONTROLLER] Received login request:', JSON.stringify({ email: dto.email, hasPassword: !!dto.password, mfaCode: dto.mfaCode }));
    
    try {
      const clientMeta = {
        ip: this.extractClientIp(request),
        userAgent: request.headers['user-agent'],
      };
      console.log('[AUTH CONTROLLER] Client meta:', clientMeta);
      
      const result = await this.authService.login(dto, clientMeta);
      console.log('[AUTH CONTROLLER] Login successful, user:', result.user?.email);

      if (process.env.AUTH_COOKIES === 'true') {
        response.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
        });
        console.log('[AUTH CONTROLLER] Cookies set, returning response');
        console.log('[AUTH CONTROLLER] ============================================');
        return { user: result.user, accessToken: result.accessToken };
      }

      console.log('[AUTH CONTROLLER] Returning full result with tokens');
      console.log('[AUTH CONTROLLER] ============================================');
      return result;
    } catch (error) {
      console.error('[AUTH CONTROLLER] LOGIN ERROR:', error);
      console.error('[AUTH CONTROLLER] Error type:', error?.constructor?.name);
      console.error('[AUTH CONTROLLER] Error message:', error instanceof Error ? error.message : 'Unknown error');
      if (error instanceof Error && error.stack) {
        console.error('[AUTH CONTROLLER] Stack trace:', error.stack);
      }
      console.error('[AUTH CONTROLLER] ============================================');
      throw error;
    }
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = dto.refreshToken || request.cookies?.refreshToken;
    if (!token) throw new UnauthorizedError('Missing refresh token');

    const result = await this.authService.refresh(token, {
      ip: this.extractClientIp(request),
      userAgent: request.headers['user-agent'],
    });

    if (process.env.AUTH_COOKIES === 'true') {
      response.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return { user: result.user, accessToken: result.accessToken };
    }

    return result;
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.me(user.sub);
  }

  @Post('logout')
  logout(@CurrentUser() user: JwtPayload, @Headers('x-refresh-token') refreshToken?: string) {
    return this.authService.logout(user.sub, refreshToken);
  }

  @Post('mfa/enroll')
  enrollMfa(@CurrentUser() user: JwtPayload) {
    return this.authService.enrollMfa(user.sub);
  }

  @Post('mfa/verify')
  verifyMfa(@CurrentUser() user: JwtPayload, @Body() dto: MfaVerifyDto) {
    return this.authService.verifyMfaEnrollment(user.sub, dto.code);
  }

  @Post('mfa/disable')
  disableMfa(@CurrentUser() user: JwtPayload, @Body() dto: MfaVerifyDto) {
    return this.authService.disableMfa(user.sub, dto.code);
  }
}
