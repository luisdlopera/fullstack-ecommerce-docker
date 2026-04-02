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

export function buildCorsOptions(config: CorsEnvConfig): CorsOptions {
  const origins = new Set<string>();

  parseOrigins(config.allowedOrigins).forEach((origin) => origins.add(origin));
  parseOrigins(config.legacyOrigin).forEach((origin) => origins.add(origin));

  if (origins.size === 0) {
    origins.add('http://localhost:5000');
  }

  if (origins.size === 0) {
    origins.add('http://localhost:5000');
    origins.add('http://localhost:5001');
  }

  return {
    origin(origin, callback) {
      // Allow requests without Origin header (curl, server-to-server, same-origin).
      if (!origin) {
        callback(null, true);
        return;
      }

      if (origins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'), false);
    },
    credentials: true,
  };
}
