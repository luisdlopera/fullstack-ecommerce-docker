import { Module, Global, Provider } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { RATE_LIMIT_STORE } from './domain/ports/rate-limit-store.port';
import {
  loadRateLimitConfig,
  RateLimitStorageType,
} from './domain/rate-limit.config';
import { MemoryRateLimitStore } from './infrastructure/persistence/memory-rate-limit.store';
import { RedisRateLimitStore } from './infrastructure/persistence/redis-rate-limit.store';
import { AdvancedThrottlerGuard } from './infrastructure/guards/advanced-throttler.guard';

/**
 * Factory para crear el store apropiado basado en configuración
 */
function createRateLimitStoreProvider(): Provider {
  return {
    provide: RATE_LIMIT_STORE,
    useFactory: () => {
      const config = loadRateLimitConfig();
      
      if (!config.enabled) {
        console.log('[RateLimit] Rate limiting is disabled, using memory store (no-op)');
        return new MemoryRateLimitStore();
      }
      
      switch (config.storage) {
        case RateLimitStorageType.REDIS:
          if (!config.redisUrl) {
            console.warn('[RateLimit] Redis storage selected but no URL provided. Falling back to memory.');
            return new MemoryRateLimitStore();
          }
          console.log('[RateLimit] Using Redis storage for rate limiting');
          return new RedisRateLimitStore(config.redisUrl);
          
        case RateLimitStorageType.MEMORY:
        default:
          console.log('[RateLimit] Using memory storage for rate limiting (single-instance only)');
          return new MemoryRateLimitStore();
      }
    },
  };
}

/**
 * Módulo de Rate Limiting Avanzado
 * 
 * Provee:
 * - RateLimitStorePort (Redis o Memoria)
 * - AdvancedThrottlerGuard (global)
 * - Decoradores @RateLimit, @SkipRateLimit, @StrictRateLimit
 * 
 * Uso:
 * ```typescript
 * // En AppModule
 * imports: [RateLimitModule, ...]
 * 
 * // En controller
 * @RateLimit({ limit: 10, ttl: 60 })
 * @Get('endpoint')
 * endpoint() { }
 * ```
 */
@Global()
@Module({
  providers: [
    createRateLimitStoreProvider(),
    // Guard global (último en cadena, después de JWT y RBAC)
    {
      provide: APP_GUARD,
      useClass: AdvancedThrottlerGuard,
    },
  ],
  exports: [RATE_LIMIT_STORE],
})
export class RateLimitModule {}
