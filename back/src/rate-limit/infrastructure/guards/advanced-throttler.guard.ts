import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Reflector } from '@nestjs/core';
import type { JwtPayload } from '../../../shared/infrastructure/auth/jwt-payload';

import { RateLimitStorePort, RATE_LIMIT_STORE } from '../../domain/ports/rate-limit-store.port';
import {
  loadRateLimitConfig,
  RateLimitConfig,
  RateLimitRule,
} from '../../domain/rate-limit.config';
import { extractClientIp, isPrivateIp } from '../utils/ip-extractor.util';
import {
  buildIpKey,
  buildUserKey,
  buildAuthKey,
  buildTenantIpKey,
  isAuthRoute,
  isAdminRoute,
  isHealthRoute,
  isMetricsRoute,
  extractRouteKey,
  KeyBuilderOptions,
} from '../utils/key-builder.util';
import { RATE_LIMIT_METADATA_KEY, RateLimitMetadata } from '../decorators/rate-limit.decorator';

/**
 * Guard de rate limiting avanzado con múltiples estrategias
 * 
 * Estrategias aplicadas (en orden):
 * 1. Exclusiones (health checks, métricas)
 * 2. @RateLimit() decorador (override manual)
 * 3. Rutas de auth específicas (límites estrictos)
 * 4. Usuario autenticado (límite separado más alto)
 * 5. IP + Tenant (multi-tenant aware)
 * 6. IP global (fallback)
 * 
 * Headers de respuesta (RFC 6585 + draft-ietf-httpapi-ratelimit-headers):
 * - X-RateLimit-Limit: Límite de requests
 * - X-RateLimit-Remaining: Requests restantes
 * - X-RateLimit-Reset: Segundos hasta reset
 * - X-RateLimit-Policy: Política aplicada
 */
@Injectable()
export class AdvancedThrottlerGuard implements CanActivate {
  private readonly logger = new Logger(AdvancedThrottlerGuard.name);
  private readonly config: RateLimitConfig;
  
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(RATE_LIMIT_STORE) private readonly store: RateLimitStorePort,
  ) {
    this.config = loadRateLimitConfig();
    
    if (!this.config.enabled) {
      this.logger.warn('Rate limiting is DISABLED');
    } else {
      this.logger.log(`Rate limiting enabled with storage: ${this.config.storage}`);
      this.logger.log(`Trust proxy: ${this.config.trustProxy}`);
    }
  }
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Rate limiting deshabilitado
    if (!this.config.enabled) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { user, ip, route, method } = this.extractRequestInfo(request);
    
    // 1. Verificar exclusiones
    if (this.shouldExclude(route)) {
      return true;
    }
    
    // 2. Verificar @RateLimit() decorador (override más prioritario)
    const metadata = this.getRateLimitMetadata(context);
    if (metadata) {
      return this.checkWithMetadata(metadata, request, response, { ip, user, route, method });
    }
    
    // 3. Rutas de auth específicas
    if (isAuthRoute(route)) {
      return this.checkAuthRoute(request, response, { ip, user, route, method });
    }
    
    // 4. Usuario autenticado (límite separado más generoso)
    if (user) {
      const userAllowed = await this.checkAuthenticatedUser(request, response, { ip, user, route, method });
      if (!userAllowed) return false;
      
      // También verificar IP para detectar comportamiento sospechoso
      // pero con límites más altos
      return this.checkIpWithUser(request, response, { ip, user, route, method });
    }
    
    // 5. IP + Tenant (para entornos multi-tenant)
    const tenantAllowed = await this.checkTenantIp(request, response, { ip, user, route, method });
    if (!tenantAllowed) return false;
    
    // 6. IP global (último fallback)
    return this.checkGlobalIp(request, response, { ip, user, route, method });
  }
  
  /**
   * Verificación usando metadata de @RateLimit() decorador
   */
  private async checkWithMetadata(
    metadata: RateLimitMetadata,
    request: Request,
    response: Response,
    info: Required<Pick<KeyBuilderOptions, 'ip' | 'user' | 'route' | 'method'>> & { user?: JwtPayload },
  ): Promise<boolean> {
    const key = metadata.key || this.buildKeyFromMetadata(metadata, info);
    const ttl = metadata.ttl;
    const limit = metadata.limit;
    
    const result = await this.store.checkAndUpdate({
      key,
      ttl,
      limit,
      cost: metadata.cost,
    });
    
    this.setRateLimitHeaders(response, result, metadata.policy || 'custom');
    
    if (!result.allowed) {
      this.throwRateLimitError(result, metadata.policy || 'custom');
    }
    
    if (this.config.debugLogs) {
      this.logger.debug(`[${metadata.policy}] ${info.ip} - ${info.route}: ${result.remaining}/${limit}`);
    }
    
    return result.allowed;
  }
  
  /**
   * Verificación específica para rutas de auth
   */
  private async checkAuthRoute(
    request: Request,
    response: Response,
    info: Required<Pick<KeyBuilderOptions, 'ip' | 'route' | 'method'>> & { user?: JwtPayload },
  ): Promise<boolean> {
    const authAction = this.extractAuthAction(info.route);
    const key = buildAuthKey(info.ip, authAction);
    const { ttl, limit } = this.config.auth;
    
    const result = await this.store.checkAndUpdate({
      key,
      ttl,
      limit,
      cost: 1,
    });
    
    this.setRateLimitHeaders(response, result, 'auth');
    
    if (!result.allowed) {
      this.throwRateLimitError(result, `auth:${authAction}`, 'Too many authentication attempts. Please try again later.');
    }
    
    if (this.config.debugLogs) {
      this.logger.debug(`[auth:${authAction}] ${info.ip} - remaining: ${result.remaining}/${limit}`);
    }
    
    return result.allowed;
  }
  
  /**
   * Verificación para usuarios autenticados (límite más alto)
   */
  private async checkAuthenticatedUser(
    request: Request,
    response: Response,
    info: Required<Pick<KeyBuilderOptions, 'userId' | 'route' | 'method'>> & { user: JwtPayload; ip: string },
  ): Promise<boolean> {
    const key = buildUserKey({
      userId: info.user.sub,
      tenantId: this.extractTenantId(request),
      prefix: 'user',
    });
    
    const { ttl, limit } = this.config.authenticated;
    
    const result = await this.store.checkAndUpdate({
      key,
      ttl,
      limit,
      cost: 1,
    });
    
    // No seteamos headers aquí, lo haremos en la verificación de IP
    // para no duplicar headers
    
    if (!result.allowed) {
      this.setRateLimitHeaders(response, result, 'user');
      this.throwRateLimitError(result, 'user', 'Rate limit exceeded for your account.');
    }
    
    if (this.config.debugLogs) {
      this.logger.debug(`[user] ${info.user.sub} (${info.ip}) - remaining: ${result.remaining}/${limit}`);
    }
    
    return result.allowed;
  }
  
  /**
   * Verificación de IP para usuarios autenticados (más estricta que user pero menos que anon)
   */
  private async checkIpWithUser(
    request: Request,
    response: Response,
    info: Required<Pick<KeyBuilderOptions, 'ip' | 'route' | 'method'>> & { user: JwtPayload },
  ): Promise<boolean> {
    // Usamos el límite de usuarios autenticados pero con key de IP
    // para detectar comportamiento sospechoso desde múltiples IPs
    const key = buildTenantIpKey({
      ip: info.ip,
      tenantId: this.extractTenantId(request),
      prefix: 'ip-auth',
    });
    
    const { ttl, limit } = this.config.authenticated;
    
    const result = await this.store.checkAndUpdate({
      key,
      ttl,
      limit,
      cost: 1,
    });
    
    this.setRateLimitHeaders(response, result, 'user-ip');
    
    if (!result.allowed) {
      this.throwRateLimitError(result, 'user-ip', 'Unusual activity detected from your network. Please try again later.');
    }
    
    return result.allowed;
  }
  
  /**
   * Verificación de IP + Tenant (multi-tenant aware)
   */
  private async checkTenantIp(
    request: Request,
    response: Response,
    info: Required<Pick<KeyBuilderOptions, 'ip' | 'route' | 'method'>> & { user?: JwtPayload },
  ): Promise<boolean> {
    // TODO: Cuando se implemente multi-tenant real, usar tenantId real
    const tenantId = this.extractTenantId(request);
    
    const key = buildTenantIpKey({
      ip: info.ip,
      tenantId,
      prefix: 'tenant',
    });
    
    const { ttl, limit } = this.config.global;
    
    const result = await this.store.checkAndUpdate({
      key,
      ttl,
      limit,
      cost: 1,
    });
    
    // Solo seteamos headers si falla o es la última verificación
    if (!result.allowed) {
      this.setRateLimitHeaders(response, result, 'tenant');
      this.throwRateLimitError(result, 'tenant');
    }
    
    if (this.config.debugLogs) {
      this.logger.debug(`[tenant] ${info.ip} (${tenantId}) - remaining: ${result.remaining}/${limit}`);
    }
    
    return result.allowed;
  }
  
  /**
   * Verificación de IP global (fallback)
   */
  private async checkGlobalIp(
    request: Request,
    response: Response,
    info: Required<Pick<KeyBuilderOptions, 'ip' | 'route' | 'method'>> & { user?: JwtPayload },
  ): Promise<boolean> {
    const key = buildIpKey({
      ip: info.ip,
      prefix: 'global',
    });
    
    const { ttl, limit } = this.config.global;
    
    const result = await this.store.checkAndUpdate({
      key,
      ttl,
      limit,
      cost: 1,
    });
    
    this.setRateLimitHeaders(response, result, 'global');
    
    if (!result.allowed) {
      this.throwRateLimitError(result, 'global');
    }
    
    if (this.config.debugLogs) {
      this.logger.debug(`[global] ${info.ip} - remaining: ${result.remaining}/${limit}`);
    }
    
    return result.allowed;
  }
  
  /**
   * Extrae información del request
   */
  private extractRequestInfo(request: Request): {
    user?: JwtPayload;
    ip: string;
    route: string;
    method: string;
  } {
    const user = request.user;
    const ip = extractClientIp(request, this.config.trustProxy);
    const route = request.path || request.url || '/';
    const method = request.method || 'GET';
    
    return { user, ip, route, method };
  }
  
  /**
   * Extrae tenantId del request
   * TODO: Implementar resolución real de tenant desde hostname/subdomain
   */
  private extractTenantId(request: Request): string {
    // Por ahora usamos 'default' hasta que se implemente multi-tenant real
    // En el futuro: return request.headers['x-tenant-id'] || request.hostname || 'default';
    return 'default';
  }
  
  /**
   * Determina si una ruta debe ser excluida del rate limiting
   */
  private shouldExclude(route: string): boolean {
    if (this.config.excludeHealthChecks && isHealthRoute(route)) {
      return true;
    }
    
    if (this.config.excludeMetrics && isMetricsRoute(route)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Obtiene metadata del decorador @RateLimit()
   */
  private getRateLimitMetadata(context: ExecutionContext): RateLimitMetadata | undefined {
    return this.reflector.getAllAndOverride<RateLimitMetadata>(RATE_LIMIT_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }
  
  /**
   * Construye key desde metadata
   */
  private buildKeyFromMetadata(
    metadata: RateLimitMetadata,
    info: Required<Pick<KeyBuilderOptions, 'ip' | 'route' | 'method'>> & { user?: JwtPayload },
  ): string {
    if (metadata.type === 'user' && info.user) {
      return buildUserKey({
        userId: info.user.sub,
        tenantId: this.extractTenantId({} as Request), // TODO
        prefix: metadata.policy || 'custom',
      });
    }
    
    return buildTenantIpKey({
      ip: info.ip,
      tenantId: this.extractTenantId({} as Request), // TODO
      prefix: metadata.policy || 'custom',
    });
  }
  
  /**
   * Extrae tipo de acción de auth desde la ruta
   */
  private extractAuthAction(route: string): string {
    if (route.includes('/login')) return 'login';
    if (route.includes('/register')) return 'register';
    if (route.includes('/refresh')) return 'refresh';
    if (route.includes('/forgot-password')) return 'forgot-password';
    if (route.includes('/reset-password')) return 'reset-password';
    if (route.includes('/verify-email')) return 'verify-email';
    if (route.includes('/resend-verification')) return 'resend-verification';
    return 'auth';
  }
  
  /**
   * Setea headers de rate limit en la respuesta
   */
  private setRateLimitHeaders(
    response: Response,
    result: { limit: number; remaining: number; resetTime: number },
    policy: string,
  ): void {
    if (!this.config.includeHeaders) return;
    
    response.setHeader('X-RateLimit-Limit', result.limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining));
    response.setHeader('X-RateLimit-Reset', result.resetTime);
    response.setHeader('X-RateLimit-Policy', policy);
  }
  
  /**
   * Lanza error de rate limit con información útil
   */
  private throwRateLimitError(
    result: { resetTime: number; limit: number },
    policy: string,
    customMessage?: string,
  ): never {
    const message = customMessage || this.config.errorMessage;
    
    throw new ForbiddenException({
      statusCode: 429,
      message,
      error: 'Too Many Requests',
      retryAfter: result.resetTime,
      limit: result.limit,
      policy,
    });
  }
}
