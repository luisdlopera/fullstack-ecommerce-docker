import { Body, Controller, Get, Headers, Inject, Post, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../../../../shared/infrastructure/auth/public.decorator';
import { CurrentUser } from '../../../../shared/infrastructure/auth/current-user.decorator';
import type { JwtPayload } from '../../../../shared/infrastructure/auth/jwt-payload';
import { ResponseFormatInterceptor } from '../../../../shared/infrastructure/http/response-format.interceptor';
import { authDebugLog } from '../../../../shared/infrastructure/observability/auth-debug';
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
@UseInterceptors(ResponseFormatInterceptor)
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
    const requestId = (request as { requestId?: string }).requestId;
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

    const result = await this.authService.login(dto, {
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
      console.log(`[AUTH_DEBUG] Successfully set refreshToken cookie for request ${requestId}`);
      authDebugLog('[AUTH-COOKIE] refresh cookie set', {
        requestId,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAgeSeconds: 7 * 24 * 60 * 60,
      });
    }

    console.log(`[AUTH_DEBUG] Returning JSON response with tokens and user object`);
    authDebugLog('[AUTH-BACK] login response', {
      requestId,
      hasAccessToken: Boolean(result.accessToken),
      hasRefreshToken: Boolean(result.refreshToken),
      userId: result.user?.id,
      role: result.user?.role,
    });

    // We always return the refreshToken in the payload even if cookies are set
    // so that the Next.js BFF does not break due to missing tokens in the payload.
    return result;
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
    const requestId = (request as { requestId?: string }).requestId;
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
      console.log(`[AUTH_DEBUG] Successfully set refreshToken cookie for request ${requestId}`);
      authDebugLog('[AUTH-COOKIE] refresh cookie set', {
        requestId,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAgeSeconds: 7 * 24 * 60 * 60,
      });
    }

    console.log(`[AUTH_DEBUG] Returning JSON response with tokens and user object on refresh`);
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
    authDebugLog('[AUTH-ME] me hit', {
      userId: user?.sub,
      role: user?.role,
      email: user?.email,
      tokenType: user?.type,
    });
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
