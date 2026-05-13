import { SetMetadata } from '@nestjs/common';
import { RateLimitRule } from '../../domain/rate-limit.config';

export const RATE_LIMIT_METADATA_KEY = 'rate-limit:metadata';

export type RateLimitType = 'ip' | 'user' | 'route' | 'custom';

export interface RateLimitMetadata extends Partial<RateLimitRule> {
  /** Tipo de rate limit */
  type?: RateLimitType;
  
  /** Key personalizada (si no se quiere autogenerar) */
  key?: string;
  
  /** Costo de esta request (default: 1) */
  cost?: number;
  
  /** Nombre de la política para headers/logs */
  policy?: string;
  
  /** Mensaje de error personalizado */
  message?: string;
  
  /** Si es más estricto que el límite por defecto */
  strict?: boolean;
  
  /** Si se debe saltar el rate limit para este endpoint */
  skip?: boolean;
}

/**
 * Decorador para aplicar rate limiting personalizado a un endpoint
 * 
 * @example
 * ```typescript
 * // Límite simple basado en IP
 * @RateLimit({ limit: 10, ttl: 60 })
 * @Get('sensitive')
 * sensitiveData() { }
 * 
 * // Límite por usuario (más alto para usuarios autenticados)
 * @RateLimit({ type: 'user', limit: 100, ttl: 60 })
 * @Get('user-data')
 * userData() { }
 * 
 * // Límite estricto para operaciones costosas
 * @RateLimit({ 
 *   type: 'ip', 
 *   limit: 5, 
 *   ttl: 300, 
 *   policy: 'expensive',
 *   message: 'Too many attempts. Please wait 5 minutes.' 
 * })
 * @Post('generate-report')
 * generateReport() { }
 * 
 * // Saltar rate limit para endpoints específicos
 * @RateLimit({ skip: true })
 * @Get('webhook')
 * webhook() { }
 * ```
 */
export const RateLimit = (metadata: RateLimitMetadata = {}) => 
  SetMetadata(RATE_LIMIT_METADATA_KEY, metadata);

/**
 * Decorador para saltar rate limiting en un endpoint específico
 * 
 * @example
 * ```typescript
 * @SkipRateLimit()
 * @Get('health')
 * healthCheck() { }
 * ```
 */
export const SkipRateLimit = () => 
  SetMetadata(RATE_LIMIT_METADATA_KEY, { skip: true });

/**
 * Decorador para aplicar límite estricto (bajo TTL y limit)
 * 
 * @example
 * ```typescript
 * @StrictRateLimit()
 * @Post('login')
 * login() { }
 * ```
 */
export const StrictRateLimit = (options: Omit<RateLimitMetadata, 'strict' | 'skip'> = {}) => 
  SetMetadata(RATE_LIMIT_METADATA_KEY, { 
    ...options, 
    strict: true,
    policy: options.policy || 'strict',
  });

/**
 * Obtener metadata de rate limiting
 */
export function getRateLimitMetadata(
   
  target: object,
  propertyKey?: string,
): RateLimitMetadata | undefined {
  if (propertyKey) {
    return Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, target, propertyKey);
  }
  return Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, target);
}
