import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

type CorsEnvConfig = {
  allowedOrigins?: string;
  legacyOrigin?: string;
  allowLocalhost?: boolean;
};

function parseOrigins(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Build CORS origins from environment variables.
 * Uses FRONTEND_URL, FRONTEND_ORIGIN, CORS_ORIGIN, CORS_ALLOWED_ORIGINS env vars.
 * Falls back to localhost with FRONTEND_PORT (default 5006) if no origins configured.
 */
function buildDefaultOrigins(): string[] {
  const origins = new Set<string>();

  // Read from environment variables (standard names)
  const envOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_ORIGIN,
    process.env.CORS_ORIGIN,
    process.env.CORS_ALLOWED_ORIGINS,
  ].filter(Boolean);

  envOrigins.forEach((value) => {
    if (value) {
      parseOrigins(value).forEach((origin: string) => origins.add(origin));
    }
  });

  // If no origins configured, build from port variables
  if (origins.size === 0) {
    const frontendPort = process.env.FRONTEND_PORT || process.env.FRONT_PORT || '5006';
    const backendPort = process.env.BACKEND_PORT || process.env.BACK_PORT || '5007';

    origins.add(`http://localhost:${frontendPort}`);
    origins.add(`http://127.0.0.1:${frontendPort}`);
    origins.add(`http://localhost:${backendPort}`);
    origins.add(`http://127.0.0.1:${backendPort}`);

    // Also add common frontend dev URLs
    origins.add(`http://[::1]:${frontendPort}`);
  }

  return Array.from(origins);
}

export function buildCorsOptions(config: CorsEnvConfig): CorsOptions {
  const origins = new Set<string>();

  // Add configured origins from env vars
  const defaultOrigins = buildDefaultOrigins();
  defaultOrigins.forEach((origin) => origins.add(origin));

  // Add any explicit config origins (for backwards compatibility)
  parseOrigins(config.allowedOrigins).forEach((origin) => origins.add(origin));
  parseOrigins(config.legacyOrigin).forEach((origin) => origins.add(origin));

  // If still empty, add defaults
  if (origins.size === 0) {
    const defaultOrigins2 = buildDefaultOrigins();
    defaultOrigins2.forEach((origin) => origins.add(origin));
  }

  const originArray = Array.from(origins);

  return {
    origin(origin, callback) {
      // Allow requests without Origin header (curl, server-to-server, same-origin).
      if (!origin) {
        callback(null, true);
        return;
      }

      if (originArray.includes(origin)) {
        callback(null, true);
        return;
      }

      // Log rejected origins in development for debugging
      if (process.env.APP_ENV === 'development' || process.env.NODE_ENV === 'development') {
         
        console.warn(`[CORS] Rejected origin: ${origin}`);
         
        console.warn(`[CORS] Allowed origins: ${originArray.join(', ')}`);
      }

      callback(new Error('CORS origin not allowed'), false);
    },
    credentials: true,
  };
}
