import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { JwtPayload } from './jwt-payload';
import { authDebugLog } from '../observability/auth-debug';

type RequestWithUser = Request & { user?: JwtPayload };

@Injectable()
export class JwtAuthGuard implements CanActivate {
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
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
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
      return true;
    } catch {
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
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
