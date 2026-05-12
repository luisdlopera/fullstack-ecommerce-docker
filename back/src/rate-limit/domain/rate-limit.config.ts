/**
 * Configuración centralizada de Rate Limiting
 * 
 * Todas las variables se cargan desde process.env con valores por defecto seguros.
 * Esta configuración permite ajuste fino sin modificar código.
 */

export enum RateLimitStorageType {
  MEMORY = 'memory',
  REDIS = 'redis',
}

export interface RateLimitRule {
  /** TTL en segundos */
  ttl: number;
  /** Número máximo de requests permitidos */
  limit: number;
}

export interface RateLimitConfig {
  /** Habilitar/deshabilitar rate limiting globalmente */
  enabled: boolean;
  
  /** Tipo de almacenamiento: 'memory' | 'redis' */
  storage: RateLimitStorageType;
  
  /** URL de Redis (requerido si storage === 'redis') */
  redisUrl?: string;
  
  /** Confian en proxies para obtener IP real (x-forwarded-for) */
  trustProxy: boolean;
  
  /** Límite global base (por IP) */
  global: RateLimitRule;
  
  /** Límite para endpoints de autenticación (login, register, etc) */
  auth: RateLimitRule;
  
  /** Límite para refresh token */
  refresh: RateLimitRule;
  
  /** Límite para endpoints públicos sensibles (webhooks, etc) */
  public: RateLimitRule;
  
  /** Límite para endpoints administrativos */
  admin: RateLimitRule;
  
  /** Límite por usuario autenticado (más permisivo) */
  authenticated: RateLimitRule;
  
  /** TTL de grace period para transición entre límites (segundos) */
  gracePeriodTtl: number;
  
  /** Excluir health checks de rate limiting */
  excludeHealthChecks: boolean;
  
  /** Excluir métricas internas */
  excludeMetrics: boolean;
  
  /** Headers personalizados para incluir en respuestas de rate limit */
  includeHeaders: boolean;
  
  /** Mensaje de error personalizado */
  errorMessage: string;
  
  /** Habilitar logs de rate limiting (útil para debugging) */
  debugLogs: boolean;
}

/**
 * Carga configuración desde variables de entorno
 */
export function loadRateLimitConfig(): RateLimitConfig {
  const parseIntEnv = (key: string, defaultValue: number): number => {
    const value = process.env[key];
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  const parseBoolEnv = (key: string, defaultValue: boolean): boolean => {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
  };

  const storage = (process.env.RATE_LIMIT_STORAGE as RateLimitStorageType) || RateLimitStorageType.MEMORY;
  
  return {
    enabled: parseBoolEnv('RATE_LIMIT_ENABLED', true),
    storage,
    redisUrl: process.env.REDIS_URL || process.env.RATE_LIMIT_REDIS_URL,
    trustProxy: parseBoolEnv('TRUST_PROXY_ENABLED', false), // Must be explicitly enabled
    
    global: {
      ttl: parseIntEnv('RATE_LIMIT_GLOBAL_TTL', 60), // 60 segundos
      limit: parseIntEnv('RATE_LIMIT_GLOBAL_LIMIT', 100), // 100 requests
    },
    
    auth: {
      ttl: parseIntEnv('RATE_LIMIT_AUTH_TTL', 300), // 5 minutos
      limit: parseIntEnv('RATE_LIMIT_AUTH_LIMIT', 5), // 5 intentos
    },
    
    refresh: {
      ttl: parseIntEnv('RATE_LIMIT_REFRESH_TTL', 60), // 1 minuto
      limit: parseIntEnv('RATE_LIMIT_REFRESH_LIMIT', 10), // 10 refresh
    },
    
    public: {
      ttl: parseIntEnv('RATE_LIMIT_PUBLIC_TTL', 60), // 1 minuto
      limit: parseIntEnv('RATE_LIMIT_PUBLIC_LIMIT', 60), // 60 requests
    },
    
    admin: {
      ttl: parseIntEnv('RATE_LIMIT_ADMIN_TTL', 60), // 1 minuto
      limit: parseIntEnv('RATE_LIMIT_ADMIN_LIMIT', 200), // 200 requests (más permisivo para admins)
    },
    
    authenticated: {
      ttl: parseIntEnv('RATE_LIMIT_AUTH_USER_TTL', 60), // 1 minuto
      limit: parseIntEnv('RATE_LIMIT_AUTH_USER_LIMIT', 200), // 200 requests
    },
    
    gracePeriodTtl: parseIntEnv('RATE_LIMIT_GRACE_PERIOD', 5),
    excludeHealthChecks: parseBoolEnv('RATE_LIMIT_EXCLUDE_HEALTH', true),
    excludeMetrics: parseBoolEnv('RATE_LIMIT_EXCLUDE_METRICS', true),
    includeHeaders: parseBoolEnv('RATE_LIMIT_INCLUDE_HEADERS', true),
    errorMessage: process.env.RATE_LIMIT_ERROR_MESSAGE || 'Too many requests, please try again later.',
    debugLogs: parseBoolEnv('RATE_LIMIT_DEBUG_LOGS', false),
  };
}

/**
 * Configuración por defecto para desarrollo
 */
export const defaultRateLimitConfig: RateLimitConfig = {
  enabled: true,
  storage: RateLimitStorageType.MEMORY,
  trustProxy: false,
  global: { ttl: 60, limit: 1000 }, // Más permisivo en dev
  auth: { ttl: 300, limit: 10 },
  refresh: { ttl: 60, limit: 20 },
  public: { ttl: 60, limit: 100 },
  admin: { ttl: 60, limit: 300 },
  authenticated: { ttl: 60, limit: 500 },
  gracePeriodTtl: 5,
  excludeHealthChecks: true,
  excludeMetrics: true,
  includeHeaders: true,
  errorMessage: 'Too many requests, please try again later.',
  debugLogs: true,
};

/**
 * Validar configuración cargada
 */
export function validateRateLimitConfig(config: RateLimitConfig): void {
  if (config.storage === RateLimitStorageType.REDIS && !config.redisUrl) {
    throw new Error(
      'RATE_LIMIT_ERROR: Redis storage selected but no REDIS_URL provided. ' +
      'Please set REDIS_URL or RATE_LIMIT_REDIS_URL environment variable.'
    );
  }

  if (config.global.limit < 1 || config.global.ttl < 1) {
    throw new Error('RATE_LIMIT_ERROR: Global rate limit must have positive ttl and limit');
  }

  if (config.auth.limit < 1 || config.auth.ttl < 1) {
    throw new Error('RATE_LIMIT_ERROR: Auth rate limit must have positive ttl and limit');
  }
}
