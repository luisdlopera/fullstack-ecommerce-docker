import { Body, Controller, Get, Headers, Inject, Post, Req, Res, UseInterceptors } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../../../../shared/infrastructure/auth/public.decorator';
import { CurrentUser } from '../../../../shared/infrastructure/auth/current-user.decorator';
import { RateLimit } from '../../../../rate-limit/infrastructure/decorators/rate-limit.decorator';
import type { JwtPayload } from '../../../../shared/infrastructure/auth/jwt-payload';
import { ResponseFormatInterceptor } from '../../../../shared/infrastructure/http/response-format.interceptor';
import { authDebugLog } from '../../../../shared/infrastructure/observability/auth-debug';
import { UnauthorizedError } from '../../../../shared/domain/errors/domain-error';

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
} from '../../application/use-cases';

// DTOs
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Controller('auth')
@UseInterceptors(ResponseFormatInterceptor)
export class AuthController {
  constructor(
    @Inject(RegisterUseCase) private readonly registerUseCase: RegisterUseCase,
    @Inject(LoginUseCase) private readonly loginUseCase: LoginUseCase,
    @Inject(RefreshTokenUseCase) private readonly refreshTokenUseCase: RefreshTokenUseCase,
    @Inject(LogoutUseCase) private readonly logoutUseCase: LogoutUseCase,
    @Inject(VerifyEmailUseCase) private readonly verifyEmailUseCase: VerifyEmailUseCase,
    @Inject(ResendVerificationUseCase) private readonly resendVerificationUseCase: ResendVerificationUseCase,
    @Inject(ForgotPasswordUseCase) private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    @Inject(ResetPasswordUseCase) private readonly resetPasswordUseCase: ResetPasswordUseCase,
    @Inject(EnrollMfaUseCase) private readonly enrollMfaUseCase: EnrollMfaUseCase,
    @Inject(VerifyMfaUseCase) private readonly verifyMfaUseCase: VerifyMfaUseCase,
    @Inject(DisableMfaUseCase) private readonly disableMfaUseCase: DisableMfaUseCase,
    @Inject(GetMeUseCase) private readonly getMeUseCase: GetMeUseCase,
  ) {}

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
  @RateLimit({ limit: 12, ttl: 60, policy: 'register' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(dto);
  }

  @Public()
  @RateLimit({ limit: 12, ttl: 60, policy: 'login' })
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const requestId = request.requestId;
    authDebugLog('[AUTH-BACK] login hit', {
      requestId,
      method: request.method,
      path: request.originalUrl ?? request.url,
      host: request.headers.host,
      origin: request.headers.origin,
      referer: request.headers.referer,
      userAgent: request.headers['user-agent'],
      hasAuthHeader: Boolean(request.headers.authorization),
      hasRefreshCookie: Boolean(request.cookies?.refreshToken),
      hasAccessCookie: Boolean(request.cookies?.accessToken),
      email: dto.email?.trim(),
      passwordLength: dto.password ? dto.password.length : 0,
      authCookiesEnabled: process.env.AUTH_COOKIES === 'true',
    });

    try {
      const result = await this.loginUseCase.execute(dto, {
        ip: this.extractClientIp(request),
        userAgent: request.headers['user-agent'],
      });

      if (process.env.AUTH_COOKIES === 'true') {
        response.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
        });
        authDebugLog('[AUTH-COOKIE] refresh cookie set', {
          requestId,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAgeSeconds: 7 * 24 * 60 * 60,
        });
        return { user: result.user, accessToken: result.accessToken };
      }

      authDebugLog('[AUTH-BACK] login response', {
        requestId,
        hasAccessToken: Boolean(result.accessToken),
        hasRefreshToken: Boolean(result.refreshToken),
        userId: result.user?.id,
        role: result.user?.role,
      });

      return result;
    } catch (error) {
      authDebugLog('[AUTH-BACK] login error', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  @Public()
  @RateLimit({ limit: 30, ttl: 60, policy: 'refresh' })
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const requestId = request.requestId;
    authDebugLog('[AUTH-BACK] refresh hit', {
      requestId,
      method: request.method,
      path: request.originalUrl ?? request.url,
      host: request.headers.host,
      origin: request.headers.origin,
      referer: request.headers.referer,
      userAgent: request.headers['user-agent'],
      hasRefreshBody: Boolean(dto.refreshToken),
      refreshBodyLength: dto.refreshToken ? dto.refreshToken.length : 0,
      hasRefreshCookie: Boolean(request.cookies?.refreshToken),
      refreshCookieLength: request.cookies?.refreshToken ? String(request.cookies.refreshToken).length : 0,
      authCookiesEnabled: process.env.AUTH_COOKIES === 'true',
    });

    const token = dto.refreshToken || request.cookies?.refreshToken;
    if (!token) throw new UnauthorizedError('Missing refresh token');

    const result = await this.refreshTokenUseCase.execute(token, {
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
      authDebugLog('[AUTH-COOKIE] refresh cookie set', {
        requestId,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAgeSeconds: 7 * 24 * 60 * 60,
      });
      return { user: result.user, accessToken: result.accessToken };
    }

    authDebugLog('[AUTH-BACK] refresh response', {
      requestId,
      hasAccessToken: Boolean(result.accessToken),
      hasRefreshToken: Boolean(result.refreshToken),
      userId: result.user?.id,
      role: result.user?.role,
    });

    return result;
  }

  @Public()
  @RateLimit({ limit: 12, ttl: 60, policy: 'verify-email' })
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.verifyEmailUseCase.execute(dto.token);
  }

  @Public()
  @RateLimit({ limit: 5, ttl: 60, policy: 'resend-verification' })
  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.resendVerificationUseCase.execute(dto.email);
  }

  @Public()
  @RateLimit({ limit: 6, ttl: 60, policy: 'forgot-password' })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.forgotPasswordUseCase.execute(dto.email);
  }

  @Public()
  @RateLimit({ limit: 10, ttl: 60, policy: 'reset-password' })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto.token, dto.newPassword);
  }

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    authDebugLog('[AUTH-ME] me hit', {
      userId: user?.sub,
      role: user?.role,
      email: user?.email,
      tokenType: user?.type,
    });
    return this.getMeUseCase.execute(user.sub);
  }

  @Post('logout')
  logout(@CurrentUser() user: JwtPayload, @Headers('x-refresh-token') refreshToken?: string) {
    return this.logoutUseCase.execute(user.sub, refreshToken);
  }

  @Post('mfa/enroll')
  enrollMfa(@CurrentUser() user: JwtPayload) {
    return this.enrollMfaUseCase.execute(user.sub);
  }

  @Post('mfa/verify')
  verifyMfa(@CurrentUser() user: JwtPayload, @Body() dto: MfaVerifyDto) {
    return this.verifyMfaUseCase.execute(user.sub, dto.code);
  }

  @Post('mfa/disable')
  disableMfa(@CurrentUser() user: JwtPayload, @Body() dto: MfaVerifyDto) {
    return this.disableMfaUseCase.execute(user.sub, dto.code);
  }
}
