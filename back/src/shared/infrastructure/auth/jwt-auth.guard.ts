import { CanActivate, ExecutionContext, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { JwtPayload } from './jwt-payload';
import { AuthMessages } from '../../../modules/auth/domain/enums/auth-messages.enum';
import { authDebugLog, authDebugEnabled } from '../observability/auth-debug';

type RequestWithUser = Request & { user?: JwtPayload };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    // Debug logging
    if (authDebugEnabled()) {
      this.logger.debug(`JwtAuthGuard check: ${JSON.stringify({
        url: request.url,
        method: request.method,
        isPublic,
        hasAuthHeader: !!authHeader,
        hasToken: !!token,
        origin: request.headers.origin,
      })}`);
    }

    if (!token) {
      const requestId = (request as { requestId?: string }).requestId;
      authDebugLog('[AUTH-GUARD] missing bearer', {
        requestId,
        isPublic,
        method: request.method,
        path: request.originalUrl ?? request.url,
        hasAuthorizationHeader: Boolean(authHeader),
        hasRefreshCookie: Boolean(request.cookies?.refreshToken),
        hasAccessCookie: Boolean(request.cookies?.accessToken),
      });
      if (isPublic) return true;
      throw new UnauthorizedException(AuthMessages.MISSING_AUTH_HEADER);
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException(AuthMessages.INVALID_TOKEN_TYPE);
      }

      request.user = payload;
      const requestId = (request as { requestId?: string }).requestId;
      authDebugLog('[AUTH-GUARD] access ok', {
        requestId,
        method: request.method,
        path: request.originalUrl ?? request.url,
        userId: payload.sub,
        role: payload.role,
        tokenType: payload.type,
      });

      if (authDebugEnabled()) {
        this.logger.debug(`Token valid: ${JSON.stringify({ userId: payload.sub, email: payload.email, role: payload.role })}`);
      }

      return true;
    } catch (err: unknown) {
      const requestId = (request as { requestId?: string }).requestId;
      authDebugLog('[AUTH-GUARD] invalid token', {
        requestId,
        isPublic,
        method: request.method,
        path: request.originalUrl ?? request.url,
        hasAuthorizationHeader: Boolean(authHeader),
        tokenLength: token.length,
      });
      if (isPublic) return true;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (authDebugEnabled()) {
        this.logger.debug(`Token verification failed: ${JSON.stringify({ error: errorMessage })}`);
      }
      throw new UnauthorizedException(AuthMessages.INVALID_TOKEN);
    }
  }
}
