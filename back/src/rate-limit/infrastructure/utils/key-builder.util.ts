/**
 * Utilidad para construir keys de rate limiting
 * 
 * Soporta múltiples estrategias de key composition:
 * - IP sola
 * - IP + Tenant
 * - IP + Tenant + User
 * - IP + Tenant + Route
 * - User + Tenant (para usuarios autenticados)
 */

export interface KeyBuilderOptions {
  /** IP del cliente */
  ip: string;
  
  /** ID o slug del tenant (opcional) */
  tenantId?: string;
  
  /** ID del usuario autenticado (opcional) */
  userId?: string;
  
  /** Ruta/endpoint (opcional) */
  route?: string;
  
  /** Método HTTP (opcional) */
  method?: string;
  
  /** Prefijo personalizado para el namespace */
  prefix?: string;
}

/**
 * Construye una key de rate limit basada en IP
 * Formato: rl:{prefix}:ip:{ip}
 */
export function buildIpKey(options: KeyBuilderOptions): string {
  const { ip, prefix = 'global' } = options;
  return `rl:${prefix}:ip:${sanitize(ip)}`;
}

/**
 * Construye una key de rate limit basada en IP + Tenant
 * Formato: rl:{prefix}:tenant:{tenantId}:ip:{ip}
 */
export function buildTenantIpKey(options: KeyBuilderOptions): string {
  const { ip, tenantId = 'default', prefix = 'global' } = options;
  return `rl:${prefix}:tenant:${sanitize(tenantId)}:ip:${sanitize(ip)}`;
}

/**
 * Construye una key de rate limit para usuarios autenticados
 * Formato: rl:{prefix}:user:{userId}:tenant:{tenantId}
 * 
 * Usa userId como identificador principal, IP secundario para
 * detectar comportamiento sospechoso de múltiples IPs
 */
export function buildUserKey(options: KeyBuilderOptions): string {
  const { userId, tenantId = 'default', prefix = 'user' } = options;
  return `rl:${prefix}:user:${sanitize(userId!)}:tenant:${sanitize(tenantId)}`;
}

/**
 * Construye una key de rate limit basada en ruta específica
 * Formato: rl:{prefix}:route:{method}:{route}:ip:{ip}
 */
export function buildRouteKey(options: KeyBuilderOptions): string {
  const { ip, route = 'default', method = '*', prefix = 'route' } = options;
  const routeKey = sanitize(`${method}:${route}`);
  return `rl:${prefix}:route:${routeKey}:ip:${sanitize(ip)}`;
}

/**
 * Construye key para endpoints de auth (más estricto)
 * Formato: rl:auth:{action}:ip:{ip}
 * 
 * @param action - Tipo de acción: 'login', 'register', 'refresh', etc
 */
export function buildAuthKey(ip: string, action: string): string {
  return `rl:auth:${sanitize(action)}:ip:${sanitize(ip)}`;
}

/**
 * Construye key para tenant-aware auth
 * Formato: rl:auth:{action}:tenant:{tenantId}:ip:{ip}
 */
export function buildTenantAuthKey(ip: string, action: string, tenantId?: string): string {
  return `rl:auth:${sanitize(action)}:tenant:${sanitize(tenantId || 'default')}:ip:${sanitize(ip)}`;
}

/**
 * Construye key para usuarios autenticados en endpoints sensibles
 * Formato: rl:sensitive:{route}:user:{userId}
 */
export function buildSensitiveKey(userId: string, route: string): string {
  return `rl:sensitive:route:${sanitize(route)}:user:${sanitize(userId)}`;
}

/**
 * Sanitiza un string para usar en keys de Redis/memoria
 * Elimina caracteres especiales que podrían causar problemas
 */
function sanitize(value: string): string {
  if (!value) return 'none';
  
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._:-]/g, '')
    .substring(0, 100); // Limitar longitud
}

/**
 * Extrae información de ruta de una URL
 * Útil para crear keys específicas por endpoint
 */
export function extractRouteKey(url: string): string {
  // Eliminar query params
  const path = url.split('?')[0];
  
  // Eliminar /api/ prefix si existe
  const cleanPath = path.replace(/^\/api\//, '');
  
  // Reemplazar IDs dinámicos con placeholders
  // Ej: /users/123 → /users/:id
  // Ej: /orders/abc-123/items/456 → /orders/:id/items/:itemId
  return cleanPath
    .replace(/\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi, '/:uuid')
    .replace(/\/\d+/g, '/:num');
}

/**
 * Detecta si una ruta es de autenticación
 */
export function isAuthRoute(route: string): boolean {
  const authPatterns = [
    /\/auth\/login/i,
    /\/auth\/register/i,
    /\/auth\/refresh/i,
    /\/auth\/forgot-password/i,
    /\/auth\/reset-password/i,
    /\/auth\/verify-email/i,
    /\/auth\/resend-verification/i,
  ];
  
  return authPatterns.some(pattern => pattern.test(route));
}

/**
 * Detecta si una ruta es de administración
 */
export function isAdminRoute(route: string): boolean {
  return /^\/admin/i.test(route);
}

/**
 * Detecta si una ruta es de webhook
 */
export function isWebhookRoute(route: string): boolean {
  return /\/webhook/i.test(route);
}

/**
 * Detecta si una ruta es health check
 */
export function isHealthRoute(route: string): boolean {
  return /\/health/i.test(route) || /\/ping/i.test(route) || /\/status/i.test(route);
}

/**
 * Detecta si una ruta es de métricas
 */
export function isMetricsRoute(route: string): boolean {
  return /\/metrics/i.test(route) || /\/prometheus/i.test(route);
}
