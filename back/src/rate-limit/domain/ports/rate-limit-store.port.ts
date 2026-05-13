/**
 * Port para almacenamiento de rate limiting
 * 
 * Abstracción que permite cambiar entre memoria local y Redis
 * sin afectar la lógica de negocio.
 */

export const RATE_LIMIT_STORE = Symbol('RATE_LIMIT_STORE');

/**
 * Información de un bucket de rate limit
 */
export interface RateLimitBucket {
  /** Número de tokens/request disponibles */
  tokens: number;
  
  /** Timestamp de última actualización (ms) */
  lastUpdate: number;
  
  /** TTL en segundos */
  ttl: number;
}

/**
 * Resultado de verificar/actualizar un bucket
 */
export interface RateLimitCheckResult {
  /** Si la request está permitida */
  allowed: boolean;
  
  /** Tokens restantes */
  remaining: number;
  
  /** Tiempo de reset en segundos */
  resetTime: number;
  
  /** Timestamp de cuándo se resetea */
  resetTimestamp: number;
  
  /** Total de requests permitidos en el window */
  limit: number;
  
  /** Key del bucket (para debugging) */
  key: string;
}

/**
 * Opciones para incrementar/verificar rate limit
 */
export interface RateLimitOptions {
  /** Key única del bucket (ej: 'ip:192.168.1.1:auth') */
  key: string;
  
  /** TTL en segundos */
  ttl: number;
  
  /** Límite de requests */
  limit: number;
  
  /** Costo de esta request (default: 1) */
  cost?: number;
}

/**
 * Interfaz del puerto de almacenamiento de rate limiting
 */
export interface RateLimitStorePort {
  /**
   * Verificar si una request está permitida y actualizar el contador
   * 
   * @param options - Opciones de rate limiting
   * @returns Resultado del chequeo con información del bucket
   */
  checkAndUpdate(options: RateLimitOptions): Promise<RateLimitCheckResult>;
  
  /**
   * Obtener estado actual de un bucket sin modificarlo
   * 
   * @param key - Key del bucket
   * @returns Estado del bucket o null si no existe
   */
  getBucket(key: string): Promise<RateLimitBucket | null>;
  
  /**
   * Resetear un bucket específico
   * 
   * @param key - Key del bucket a resetear
   */
  reset(key: string): Promise<void>;
  
  /**
   * Resetear todos los buckets que coincidan con un patrón
   * Útil para operaciones de mantenimiento o baneos
   * 
   * @param pattern - Patrón de keys (ej: 'ip:192.168.1.1:*')
   */
  resetPattern(pattern: string): Promise<void>;
  
  /**
   * Cerrar conexiones y liberar recursos
   */
  close(): Promise<void>;
}
