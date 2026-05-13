import { Injectable, Logger } from '@nestjs/common';
import {
  RateLimitStorePort,
  RateLimitBucket,
  RateLimitCheckResult,
  RateLimitOptions,
} from '../../domain/ports/rate-limit-store.port';

/**
 * Implementación en memoria del store de rate limiting
 * 
 * ⚠️ ADVERTENCIA: Esta implementación es para desarrollo o
 * deployments single-instance. En producción con múltiples
 * replicas, usar RedisRateLimitStore.
 * 
 * Características:
 * - Limpieza automática de buckets expirados
 * - Thread-safe para operaciones básicas
 * - Baja latencia (no hay network I/O)
 */
@Injectable()
export class MemoryRateLimitStore implements RateLimitStorePort {
  private readonly logger = new Logger(MemoryRateLimitStore.name);
  private readonly buckets = new Map<string, RateLimitBucket>();
  private cleanupInterval?: NodeJS.Timeout;
  
  /** Intervalo de limpieza en ms (5 minutos) */
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000;
  
  constructor() {
    this.logger.log('MemoryRateLimitStore initialized (single-instance only)');
    this.startCleanupInterval();
  }
  
  /**
   * Algoritmo de sliding window para rate limiting
   * 
   * En lugar de resetear el contador en cada ventana de tiempo,
   * calculamos los tokens disponibles basándonos en cuánto tiempo
   * ha pasado desde el último request.
   */
  async checkAndUpdate(options: RateLimitOptions): Promise<RateLimitCheckResult> {
    const { key, ttl, limit, cost = 1 } = options;
    const now = Date.now();
    const windowMs = ttl * 1000;
    
    // Obtener o crear bucket
    let bucket = this.buckets.get(key);
    
    if (!bucket) {
      // Nuevo bucket
      bucket = {
        tokens: limit - cost,
        lastUpdate: now,
        ttl,
      };
      this.buckets.set(key, bucket);
      
      return {
        allowed: true,
        remaining: bucket.tokens,
        resetTime: ttl,
        resetTimestamp: now + windowMs,
        limit,
        key,
      };
    }
    
    // Calcular tokens recuperados por tiempo transcurrido
    const timePassed = now - bucket.lastUpdate;
    const tokensToAdd = (timePassed / windowMs) * limit;
    
    // Actualizar tokens (no exceder el límite)
    bucket.tokens = Math.min(limit, bucket.tokens + tokensToAdd);
    bucket.lastUpdate = now;
    
    // Verificar si hay suficientes tokens
    if (bucket.tokens < cost) {
      // No hay tokens suficientes, calcular tiempo hasta reset
      const tokensNeeded = cost - bucket.tokens;
      const timeToReset = Math.ceil((tokensNeeded / limit) * ttl);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: timeToReset,
        resetTimestamp: now + (timeToReset * 1000),
        limit,
        key,
      };
    }
    
    // Consumir tokens
    bucket.tokens -= cost;
    
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      resetTime: ttl,
      resetTimestamp: now + windowMs,
      limit,
      key,
    };
  }
  
  async getBucket(key: string): Promise<RateLimitBucket | null> {
    const bucket = this.buckets.get(key);
    
    if (!bucket) return null;
    
    // Verificar si expiró
    const now = Date.now();
    const windowMs = bucket.ttl * 1000;
    
    if (now - bucket.lastUpdate > windowMs) {
      this.buckets.delete(key);
      return null;
    }
    
    return bucket;
  }
  
  async reset(key: string): Promise<void> {
    this.buckets.delete(key);
    this.logger.debug(`Bucket reset: ${key}`);
  }
  
  async resetPattern(pattern: string): Promise<void> {
    // Convertir patrón simple a regex
    // * → .*
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    
    let count = 0;
    for (const [key] of this.buckets) {
      if (regex.test(key)) {
        this.buckets.delete(key);
        count++;
      }
    }
    
    this.logger.log(`Reset ${count} buckets matching pattern: ${pattern}`);
  }
  
  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.buckets.clear();
    this.logger.log('MemoryRateLimitStore closed');
  }
  
  /**
   * Limpieza periódica de buckets expirados
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredBuckets();
    }, this.CLEANUP_INTERVAL);
  }
  
  private cleanupExpiredBuckets(): void {
    const now = Date.now();
    let expired = 0;
    
    for (const [key, bucket] of this.buckets) {
      const windowMs = bucket.ttl * 1000;
      if (now - bucket.lastUpdate > windowMs) {
        this.buckets.delete(key);
        expired++;
      }
    }
    
    if (expired > 0) {
      this.logger.debug(`Cleaned up ${expired} expired buckets. Total: ${this.buckets.size}`);
    }
  }
  
  /**
   * Stats para debugging
   */
  getStats(): { totalBuckets: number; memoryEstimate: string } {
    const totalBuckets = this.buckets.size;
    // Estimación aproximada: cada bucket ~200 bytes
    const memoryBytes = totalBuckets * 200;
    
    return {
      totalBuckets,
      memoryEstimate: this.formatBytes(memoryBytes),
    };
  }
  
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
