import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/infrastructure/filters/http-exception.filter';
import { buildCorsOptions } from './shared/infrastructure/http/cors';
import { PrismaService } from './shared/infrastructure/prisma/prisma.service';

async function bootstrap() {
  try {
    const localEnvPath = resolve(process.cwd(), '.env');
    if (existsSync(localEnvPath)) {
      loadEnv({ path: localEnvPath });
      console.log('[BOOTSTRAP] .env cargado');
    }

    const rootEnvPath = resolve(process.cwd(), '..', '.env');
    if (existsSync(rootEnvPath)) {
      loadEnv({ path: rootEnvPath });
      console.log('[BOOTSTRAP] ../.env cargado');
    }

    console.log('[BOOTSTRAP] Iniciando...');
    console.log('[BOOTSTRAP] PORT:', process.env.PORT);
    console.log('[BOOTSTRAP] DATABASE_URL:', process.env.DATABASE_URL ? 'definida' : 'NO definida');
    console.log('[BOOTSTRAP] REDIS_URL:', process.env.REDIS_URL ? 'definida' : 'NO definida');

    console.log('[BOOTSTRAP] Creando NestFactory...');
    console.log('[BOOTSTRAP] AppModule creado, inicializando...');
    const app = await NestFactory.create(AppModule);
    console.log('[BOOTSTRAP] NestFactory creada, AppModule inicializado');
    app.enableShutdownHooks();
    await app.get(PrismaService).enableShutdownHooks(app);

    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('api');
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

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log(`║  🚀 BACK running on http://localhost:${port}                     ║`);
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
  } catch (error) {
    console.error('[BOOTSTRAP] ERROR fatal:', error);
    console.error('[BOOTSTRAP] Stack:', error instanceof Error ? error.stack : 'No stack');
    process.exit(1);
  }
}

process.on('uncaughtException', (err) => {
  console.error('[PROCESS] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[PROCESS] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

void bootstrap();
