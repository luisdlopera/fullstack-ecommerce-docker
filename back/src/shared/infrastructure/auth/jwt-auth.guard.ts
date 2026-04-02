import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { JwtPayload } from './jwt-payload';

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

    // Debug logging
    if (process.env.AUTH_DEBUG_LOGS === 'true') {
      console.log('[AUTH DEBUG] JwtAuthGuard check:', {
        url: request.url,
        method: request.method,
        isPublic,
        hasAuthHeader: !!authHeader,
        hasToken: !!token,
        origin: request.headers.origin,
      });
    }

    if (!token) {
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

      if (process.env.AUTH_DEBUG_LOGS === 'true') {
        console.log('[AUTH DEBUG] Token valid:', { userId: payload.sub, email: payload.email, role: payload.role });
      }

      return true;
    } catch (err: any) {
      if (isPublic) return true;
      if (process.env.AUTH_DEBUG_LOGS === 'true') {
        console.log('[AUTH DEBUG] Token verification failed:', { error: err?.message });
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
