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

async function bootstrap() {
  const localEnvPath = resolve(process.cwd(), '.env');
  if (existsSync(localEnvPath)) {
    loadEnv({ path: localEnvPath });
  }

  const rootEnvPath = resolve(process.cwd(), '..', '.env');
  if (!existsSync(localEnvPath) && existsSync(rootEnvPath)) {
    loadEnv({ path: rootEnvPath });
  }

  const app = await NestFactory.create(AppModule);

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

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
