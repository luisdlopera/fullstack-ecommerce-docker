import type { Request } from 'express';

/**
 * Extrae la IP real del cliente considerando proxies y headers
 * 
 * Orden de prioridad:
 * 1. x-forwarded-for (primera IP si hay múltiples)
 * 2. x-real-ip
 * 3. cf-connecting-ip (Cloudflare)
 * 4. true-client-ip
 * 5. request.ip (último recurso)
 * 
 * @param request - Request de Express
 * @param trustProxy - Si se debe confiar en headers de proxy
 * @returns IP del cliente o 'unknown' si no se puede determinar
 */
export function extractClientIp(request: Request, trustProxy: boolean = false): string {
  if (trustProxy) {
    // x-forwarded-for puede contener múltiples IPs: "client, proxy1, proxy2"
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      // Tomar la primera IP (la del cliente original)
      const firstIp = forwarded.split(',')[0]?.trim();
      if (firstIp && isValidIp(firstIp)) {
        return sanitizeIp(firstIp);
      }
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      const firstIp = forwarded[0];
      if (isValidIp(firstIp)) {
        return sanitizeIp(firstIp);
      }
    }

    // Cloudflare
    const cfConnectingIp = request.headers['cf-connecting-ip'];
    if (typeof cfConnectingIp === 'string' && isValidIp(cfConnectingIp)) {
      return sanitizeIp(cfConnectingIp);
    }

    // x-real-ip (usado por Nginx y otros)
    const realIp = request.headers['x-real-ip'];
    if (typeof realIp === 'string' && isValidIp(realIp)) {
      return sanitizeIp(realIp);
    }

    // True-Client-IP (Cloudflare Enterprise)
    const trueClientIp = request.headers['true-client-ip'];
    if (typeof trueClientIp === 'string' && isValidIp(trueClientIp)) {
      return sanitizeIp(trueClientIp);
    }
  }

  // IP directa del request
  const directIp = request.ip || request.socket?.remoteAddress;
  if (directIp && isValidIp(directIp)) {
    return sanitizeIp(directIp);
  }

  // Último recurso
  return 'unknown';
}

/**
 * Valida si una string es una IP válida (IPv4 o IPv6)
 */
function isValidIp(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  
  // Eliminar prefijo IPv6 si existe
  const cleanIp = ip.replace(/^::ffff:/, '');
  
  // IPv4 básica
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(cleanIp)) {
    const parts = cleanIp.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  // IPv6 simplificada
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  if (ipv6Regex.test(cleanIp)) return true;
  
  // IPv6 comprimida (::)
  const ipv6CompressedRegex = /^([0-9a-fA-F]{1,4}:){0,7}:[0-9a-fA-F]{1,4}$/;
  if (ipv6CompressedRegex.test(cleanIp)) return true;
  
  return false;
}

/**
 * Sanitiza una IP para usar en keys
 * - Elimina prefijos IPv6
 * - Reemplaza caracteres especiales
 */
function sanitizeIp(ip: string): string {
  // Eliminar prefijo IPv6-mapped IPv4
  let clean = ip.replace(/^::ffff:/, '');
  
  // Eliminar puerto si viene incluido
  clean = clean.replace(/:\d+$/, '');
  
  // Reemplazar caracteres no alfanuméricos (excepto . y : para IPs)
  return clean.replace(/[^a-zA-Z0-9.:]/g, '');
}

/**
 * Extrae información del User Agent de forma segura
 */
export function extractUserAgent(request: Request): string | undefined {
  const ua = request.headers['user-agent'];
  if (typeof ua === 'string' && ua.length > 0) {
    // Limitar longitud para evitar abuso
    return ua.substring(0, 512);
  }
  return undefined;
}

/**
 * Detecta si una IP es privada/reservada
 * Útil para logging y debugging
 */
export function isPrivateIp(ip: string): boolean {
  const cleanIp = ip.replace(/^::ffff:/, '');
  
  // IPv4 privadas
  const privateRanges = [
    /^10\./,                              // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,    // 172.16.0.0/12
    /^192\.168\./,                       // 192.168.0.0/16
    /^127\./,                            // Loopback
    /^0\./,                              // Invalid
    /^169\.254\./,                       // Link-local
  ];
  
  return privateRanges.some(range => range.test(cleanIp));
}
