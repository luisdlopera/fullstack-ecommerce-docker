import { Controller, Get, Inject, Delete, Query } from '@nestjs/common';
import { Public } from '../../../shared/infrastructure/auth/public.decorator';
import { RequireRoles } from '../../../shared/infrastructure/auth/rbac.decorator';
import { Role } from '@prisma/client';
import { RateLimitStorePort, RATE_LIMIT_STORE } from '../../domain/ports/rate-limit-store.port';
import { loadRateLimitConfig, RateLimitConfig } from '../../domain/rate-limit.config';
import { MemoryRateLimitStore } from '../persistence/memory-rate-limit.store';
import { RedisRateLimitStore } from '../persistence/redis-rate-limit.store';

/**
 * Controller para monitorear y administrar Rate Limiting
 * 
 * Endpoints disponibles:
 * - GET /rate-limit/health - Estado del sistema de rate limiting
 * - GET /rate-limit/config - Configuración actual
 * - GET /rate-limit/stats - Estadísticas del store
 * - POST /rate-limit/reset - Resetear buckets por patrón (admin only)
 * 
 * Todos los endpoints requieren rol ADMIN o SUPER_ADMIN excepto health check básico.
 */
@Controller('rate-limit')
export class RateLimitController {
  private readonly config: RateLimitConfig;

  constructor(
    @Inject(RATE_LIMIT_STORE) private readonly store: RateLimitStorePort,
  ) {
    this.config = loadRateLimitConfig();
  }

  /**
   * Health check básico del sistema de rate limiting
   * 
   * Útil para monitoreo y debugging.
   * No requiere autenticación (público).
   */
  @Public()
  @Get('health')
  async getHealth() {
    let storeStatus: 'connected' | 'disconnected' | 'unknown' = 'unknown';
    let storeStats = null;

    try {
      if (this.store instanceof MemoryRateLimitStore) {
        storeStats = this.store.getStats();
        storeStatus = 'connected';
      } else if (this.store instanceof RedisRateLimitStore) {
        const redisStats = await this.store.getStats();
        storeStatus = redisStats.connected ? 'connected' : 'disconnected';
        storeStats = redisStats;
      }
    } catch {
      storeStatus = 'disconnected';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      rateLimit: {
        enabled: this.config.enabled,
        storage: this.config.storage,
        storeStatus,
        storeStats,
      },
    };
  }

  /**
   * Obtener configuración actual de rate limiting
   * 
   * Útil para verificar qué límites están aplicados.
   * Requiere rol ADMIN.
   */
  @Get('config')
  @RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
  getConfig() {
    return {
      enabled: this.config.enabled,
      storage: this.config.storage,
      trustProxy: this.config.trustProxy,
      limits: {
        global: this.config.global,
        auth: this.config.auth,
        refresh: this.config.refresh,
        public: this.config.public,
        admin: this.config.admin,
        authenticated: this.config.authenticated,
      },
      features: {
        excludeHealthChecks: this.config.excludeHealthChecks,
        excludeMetrics: this.config.excludeMetrics,
        includeHeaders: this.config.includeHeaders,
        debugLogs: this.config.debugLogs,
      },
    };
  }

  /**
   * Obtener estadísticas detalladas del store
   * 
   * Muestra información sobre buckets activos, memoria usada, etc.
   * Requiere rol ADMIN.
   */
  @Get('stats')
  @RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
  async getStats() {
    let stats = null;

    try {
      if (this.store instanceof MemoryRateLimitStore) {
        stats = this.store.getStats();
      } else if (this.store instanceof RedisRateLimitStore) {
        stats = await this.store.getStats();
      }
    } catch (error) {
      return {
        error: 'Failed to get stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    return {
      storage: this.config.storage,
      stats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Resetear rate limits por patrón
   * 
   * Útil para:
   * - Desbloquear IPs accidentalmente bloqueadas
   * - Mantenimiento del sistema
   * - Testing
   * 
   * @param pattern - Patrón de keys a resetear (ej: 'ip:192.168.1.1:*')
   * 
   * Requiere rol SUPER_ADMIN.
   */
  @Delete('reset')
  @RequireRoles(Role.SUPER_ADMIN)
  async resetRateLimits(@Query('pattern') pattern: string) {
    if (!pattern) {
      return {
        error: 'Pattern is required',
        example: 'ip:192.168.1.1:* or tenant:acme:*',
      };
    }

    try {
      await this.store.resetPattern(pattern);
      
      return {
        success: true,
        message: `Rate limits matching pattern '${pattern}' have been reset`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to reset rate limits',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Resetear un bucket específico
   * 
   * @param key - Key exacta del bucket a resetear
   * 
   * Requiere rol ADMIN.
   */
  @Delete('reset/:key')
  @RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
  async resetBucket(@Query('key') key: string) {
    if (!key) {
      return {
        error: 'Key is required',
      };
    }

    try {
      await this.store.reset(key);
      
      return {
        success: true,
        message: `Bucket '${key}' has been reset`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to reset bucket',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
