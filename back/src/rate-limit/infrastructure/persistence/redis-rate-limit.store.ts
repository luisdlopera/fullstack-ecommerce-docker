import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import {
  RateLimitStorePort,
  RateLimitBucket,
  RateLimitCheckResult,
  RateLimitOptions,
} from '../../domain/ports/rate-limit-store.port';

/**
 * Implementación Redis del store de rate limiting
 * 
 * ✅ RECOMENDADO PARA PRODUCCIÓN
 * 
 * Características:
 * - Distribuido: funciona con múltiples instancias de la API
 * - Persistente: sobrevive reinicios de la aplicación
 * - Escalable: no consume memoria del proceso Node
 * - Lua scripts atómicos: race-condition safe
 * 
 * Requiere:
 * - REDIS_URL configurado en variables de entorno
 * - Redis 5.0+ (para soporte de streams si se usa)
 */
@Injectable()
export class RedisRateLimitStore implements RateLimitStorePort, OnModuleDestroy {
  private readonly logger = new Logger(RedisRateLimitStore.name);
  private redis: Redis | null = null;
  private connected = false;
  
  constructor(private readonly redisUrl: string) {
    this.logger.log('RedisRateLimitStore initializing...');
    this.connect();
  }
  
  private connect(): void {
    try {
      this.redis = new Redis(this.redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          this.logger.warn(`Redis connection retry in ${delay}ms (attempt ${times})`);
          return delay;
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
      
      this.redis.on('connect', () => {
        this.connected = true;
        this.logger.log('Redis connected for rate limiting');
      });
      
      this.redis.on('error', (err) => {
        this.logger.error('Redis error:', err.message);
        this.connected = false;
      });
      
      this.redis.on('close', () => {
        this.logger.warn('Redis connection closed');
        this.connected = false;
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
      throw error;
    }
  }
  
  /**
   * Algoritmo de rate limiting con Redis usando sliding window
   * 
   * Usa sorted sets (ZSET) para trackear timestamps de requests.
   * Esto permite una ventana deslizante precisa en lugar de contadores fijos.
   * 
   * Lua script para operación atómica:
   * 1. Limpiar entradas más antiguas que el TTL
   * 2. Contar entradas restantes
   * 3. Si hay espacio, agregar timestamp actual
   * 4. Setear TTL del key
   */
  async checkAndUpdate(options: RateLimitOptions): Promise<RateLimitCheckResult> {
    if (!this.redis || !this.connected) {
      throw new Error('Redis not connected');
    }
    
    const { key, ttl, limit, cost = 1 } = options;
    const now = Date.now();
    const windowStart = now - (ttl * 1000);
    
    // Lua script para operación atómica
    // KEYS[1] = key del bucket
    // ARGV[1] = windowStart (timestamp de inicio de ventana)
    // ARGV[2] = now (timestamp actual)
    // ARGV[3] = ttl en segundos
    // ARGV[4] = limit
    // ARGV[5] = cost
    const luaScript = `
      local key = KEYS[1]
      local windowStart = tonumber(ARGV[1])
      local now = tonumber(ARGV[2])
      local ttl = tonumber(ARGV[3])
      local limit = tonumber(ARGV[4])
      local cost = tonumber(ARGV[5])
      
      -- Limpiar entradas antiguas (fuera de la ventana)
      redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
      
      -- Contar requests actuales en la ventana
      local current = redis.call('ZCARD', key)
      
      -- Verificar si caben nuevos requests
      local allowed = (current + cost) <= limit
      
      if allowed then
        -- Agregar timestamps para cada request (score = timestamp)
        for i = 1, cost do
          redis.call('ZADD', key, now + i * 0.001, now + i * 0.001)
        end
        -- Setear TTL del key
        redis.call('EXPIRE', key, ttl)
      end
      
      -- Calcular tiempo hasta que haya espacio
      local resetTime = ttl
      if not allowed then
        -- Obtener el timestamp más antiguo que necesitamos esperar
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        if #oldest > 0 then
          resetTime = math.ceil((tonumber(oldest[2]) - windowStart) / 1000)
        end
      end
      
      return {allowed and 1 or 0, limit - current - (allowed and cost or 0), resetTime}
    `;
    
    try {
      const result = await this.redis.eval(
        luaScript,
        1, // número de keys
        key,
        windowStart,
        now,
        ttl,
        limit,
        cost
      ) as [number, number, number];
      
      const [allowed, remaining, resetTime] = result;
      
      return {
        allowed: allowed === 1,
        remaining: Math.max(0, remaining),
        resetTime,
        resetTimestamp: now + (resetTime * 1000),
        limit,
        key,
      };
      
    } catch (error) {
      this.logger.error(`Redis rate limit error for key ${key}:`, error);
      // Fallback: permitir request en caso de error de Redis
      // Esto evita bloquear la API si Redis falla
      return {
        allowed: true,
        remaining: 0,
        resetTime: ttl,
        resetTimestamp: now + (ttl * 1000),
        limit,
        key,
      };
    }
  }
  
  async getBucket(key: string): Promise<RateLimitBucket | null> {
    if (!this.redis || !this.connected) {
      return null;
    }
    
    try {
      const ttl = await this.redis.ttl(key);
      const count = await this.redis.zcard(key);
      
      if (ttl <= 0 || count === 0) {
        return null;
      }
      
      // Obtener timestamps para calcular tokens aproximados
      const timestamps = await this.redis.zrange(key, 0, -1, 'WITHSCORES');
      const lastUpdate = parseFloat(timestamps[timestamps.length - 1] || '0');
      
      return {
        tokens: Math.max(0, count),
        lastUpdate: Math.floor(lastUpdate),
        ttl,
      };
      
    } catch (error) {
      this.logger.error(`Error getting bucket ${key}:`, error);
      return null;
    }
  }
  
  async reset(key: string): Promise<void> {
    if (!this.redis || !this.connected) {
      return;
    }
    
    try {
      await this.redis.del(key);
      this.logger.debug(`Redis bucket reset: ${key}`);
    } catch (error) {
      this.logger.error(`Error resetting bucket ${key}:`, error);
    }
  }
  
  async resetPattern(pattern: string): Promise<void> {
    if (!this.redis || !this.connected) {
      return;
    }
    
    try {
      // Convertir patrón de keys de Redis
      const redisPattern = pattern.replace(/\*/g, '*');
      
      // Usar SCAN para evitar bloquear Redis
      let cursor = '0';
      let deleted = 0;
      
      do {
        const result = await this.redis.scan(cursor, 'MATCH', redisPattern, 'COUNT', 100);
        cursor = result[0];
        const keys = result[1];
        
        if (keys.length > 0) {
          await this.redis.del(...keys);
          deleted += keys.length;
        }
        
      } while (cursor !== '0');
      
      this.logger.log(`Reset ${deleted} Redis keys matching pattern: ${pattern}`);
      
    } catch (error) {
      this.logger.error(`Error resetting pattern ${pattern}:`, error);
    }
  }
  
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis connection closed for rate limiting');
    }
  }
  
  onModuleDestroy(): void {
    this.close();
  }
  
  /**
   * Verificar estado de conexión
   */
  isConnected(): boolean {
    return this.connected && this.redis?.status === 'ready';
  }
  
  /**
   * Stats de Redis para monitoreo
   */
  async getStats(): Promise<{ connected: boolean; keysCount: number }> {
    if (!this.redis || !this.connected) {
      return { connected: false, keysCount: 0 };
    }
    
    try {
      // Contar keys que empiezan con rl:
      let count = 0;
      let cursor = '0';
      
      do {
        const result = await this.redis.scan(cursor, 'MATCH', 'rl:*', 'COUNT', 1000);
        cursor = result[0];
        count += result[1].length;
      } while (cursor !== '0');
      
      return {
        connected: true,
        keysCount: count,
      };
      
    } catch (error) {
      this.logger.error('Error getting Redis stats:', error);
      return { connected: false, keysCount: 0 };
    }
  }
}
