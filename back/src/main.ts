import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/infrastructure/filters/http-exception.filter';
import { buildCorsOptions } from './shared/infrastructure/http/cors';

async function bootstrap() {
  console.log('[BOOTSTRAP] Iniciando...');
  
  // Timeout global de 30 segundos
  const bootstrapTimeout = setTimeout(() => {
    console.error('[BOOTSTRAP] ERROR: Timeout después de 30s. El servidor no pudo iniciar.');
    console.error('[BOOTSTRAP] Posibles causas: Redis no accesible, PostgreSQL bloqueado, o algún módulo colgado.');
    process.exit(1);
  }, 30000);
  
  loadEnv({ path: resolve(process.cwd(), '.env') });
  console.log('[BOOTSTRAP] .env cargado');
  loadEnv({ path: resolve(process.cwd(), '..', '.env') });
  console.log('[BOOTSTRAP] ../.env cargado');

  console.log('[BOOTSTRAP] PORT:', process.env.PORT);
  console.log('[BOOTSTRAP] DATABASE_URL:', process.env.DATABASE_URL ? 'definida' : 'NO definida');
  console.log('[BOOTSTRAP] REDIS_URL:', process.env.REDIS_URL ? 'definida' : 'NO definida');

  console.log('[BOOTSTRAP] Creando NestFactory...');
  console.log('[BOOTSTRAP] AppModule creado, inicializando...');
  const app = await NestFactory.create(AppModule);
  console.log('[BOOTSTRAP] NestFactory creada, AppModule inicializado');

  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  const httpInstance = app.getHttpAdapter().getInstance();
  if (typeof httpInstance?.disable === 'function') {
    httpInstance.disable('x-powered-by');
  }
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());

  const corsOptions = buildCorsOptions({
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS,
    legacyOrigin: process.env.CORS_ORIGIN ?? process.env.FRONTEND_ORIGIN,
    allowLocalhost: process.env.APP_ENV !== 'production',
  });

  app.enableCors(corsOptions);
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const url = req.url ?? '';
    if (!url.startsWith('/api')) {
      next();
      return;
    }

    if (url.startsWith('/api/v1') || url.startsWith('/api/docs') || url.startsWith('/api/docs-json')) {
      next();
      return;
    }

    if (url === '/api' || url.startsWith('/api?')) {
      req.url = url.replace('/api', '/api/v1');
      next();
      return;
    }

    if (url.startsWith('/api/')) {
      req.url = url.replace('/api/', '/api/v1/');
    }

    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  if (process.env.ENABLE_SWAGGER === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Nexstore API')
      .setDescription('E-commerce REST API for Nexstore')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = Number(process.env.PORT ?? 5007);
  console.log('[BOOTSTRAP] Puerto:', port);
  console.log('[BOOTSTRAP] Llamando app.listen...');
  await app.listen(port, '0.0.0.0');
  console.log('[BOOTSTRAP] app.listen completado');
  
  // Limpiar timeout ya que el servidor inició correctamente
  clearTimeout(bootstrapTimeout);

  // eslint-disable-next-line no-console
  console.log('');
  // eslint-disable-next-line no-console
  console.log('╔════════════════════════════════════════════════════════════╗');
  // eslint-disable-next-line no-console
  console.log(`║  🚀 BACK running on http://localhost:${port}                     ║`);
  // eslint-disable-next-line no-console
  console.log('╚════════════════════════════════════════════════════════════╝');
  // eslint-disable-next-line no-console
  console.log('');
}

void bootstrap();
