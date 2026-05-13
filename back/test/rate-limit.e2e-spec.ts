import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Tests E2E para Rate Limiting Avanzado
 * 
 * Cubre:
 * - Límite global por IP
 * - Límite de auth endpoints (brute force protection)
 * - Límite de usuario autenticado (más permisivo)
 * - Headers de rate limit en respuestas
 * - Exclusiones (health checks)
 */
describe('Rate Limiting (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    // Configurar variables de test
    process.env.RATE_LIMIT_ENABLED = 'true';
    process.env.RATE_LIMIT_STORAGE = 'memory';
    process.env.RATE_LIMIT_GLOBAL_LIMIT = '5';
    process.env.RATE_LIMIT_GLOBAL_TTL = '60';
    process.env.RATE_LIMIT_AUTH_LIMIT = '3';
    process.env.RATE_LIMIT_AUTH_TTL = '60';
    process.env.RATE_LIMIT_AUTH_USER_LIMIT = '10';
    process.env.RATE_LIMIT_DEBUG_LOGS = 'false';
    process.env.TRUST_PROXY_ENABLED = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Global IP Rate Limit', () => {
    it('should allow requests under the limit', async () => {
      // 5 requests permitidas (límite configurado)
      for (let i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer())
          .get('/api/health')
          .expect(200);
        
        // Health checks están excluidos, no deben tener headers de rate limit
        expect(response.headers['x-ratelimit-limit']).toBeUndefined();
      }
    });

    it('should include rate limit headers for regular endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Debe incluir headers de rate limit
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
      expect(response.headers['x-ratelimit-policy']).toBeDefined();
    });

    it('should block requests over the limit with 429', async () => {
      // Hacer 5 requests para agotar el límite
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      }

      // La 6ª request debe ser bloqueada
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(429);

      expect(response.body.statusCode).toBe(429);
      expect(response.body.error).toBe('Too Many Requests');
      expect(response.body.retryAfter).toBeDefined();
      expect(response.body.policy).toBeDefined();
    });
  });

  describe('Auth Endpoints Rate Limit (Brute Force Protection)', () => {
    it('should limit login attempts', async () => {
      // 3 intentos de login permitidos
      for (let i = 0; i < 3; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: 'test@test.com', password: 'wrong' })
          .expect(401);

        expect(response.headers['x-ratelimit-policy']).toBe('auth');
      }

      // El 4º intento debe ser bloqueado
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrong' })
        .expect(429);

      expect(response.body.statusCode).toBe(429);
      expect(response.body.policy).toContain('auth');
    });

    it('should have stricter limits for auth than global', async () => {
      // Auth limit es 3, global es 5
      // Después de 3 intentos de auth, debe bloquear
      
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({ email: `test${i}@test.com`, password: 'password123' })
          .expect(400); // 400 porque el email ya existe o validación
      }

      // El 4º debe ser rate limited
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'new@test.com', password: 'password123' })
        .expect(429);

      expect(response.status).toBe(429);
    });
  });

  describe('Health Check Exclusions', () => {
    it('should not apply rate limiting to health endpoints', async () => {
      // Hacer muchas requests a health
      for (let i = 0; i < 20; i++) {
        const response = await request(app.getHttpServer())
          .get('/api/health')
          .expect(200);
        
        // No debe tener headers de rate limit
        expect(response.headers['x-ratelimit-limit']).toBeUndefined();
      }
    });
  });

  describe('Rate Limit Response Format', () => {
    it('should return proper 429 error structure', async () => {
      // Agotar el límite primero
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid')
          .expect(401);
      }

      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid')
        .expect(429);

      // Verificar estructura del error
      expect(response.body).toMatchObject({
        statusCode: 429,
        message: expect.any(String),
        error: 'Too Many Requests',
        retryAfter: expect.any(Number),
        limit: expect.any(Number),
        policy: expect.any(String),
      });
    });

    it('should include correct rate limit headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid')
        .expect(401);

      // Verificar headers
      const limit = parseInt(response.headers['x-ratelimit-limit']);
      const remaining = parseInt(response.headers['x-ratelimit-remaining']);
      const reset = parseInt(response.headers['x-ratelimit-reset']);
      const policy = response.headers['x-ratelimit-policy'];

      expect(limit).toBeGreaterThan(0);
      expect(remaining).toBeGreaterThanOrEqual(0);
      expect(reset).toBeGreaterThan(0);
      expect(policy).toBeTruthy();
      expect(remaining).toBeLessThanOrEqual(limit);
    });
  });

  describe('Different Policies for Different Endpoints', () => {
    it('should apply auth policy to login endpoint', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrong' })
        .expect(401);

      expect(response.headers['x-ratelimit-policy']).toContain('auth');
    });

    it('should apply global or user policy to regular endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid')
        .expect(401);

      const policy = response.headers['x-ratelimit-policy'];
      expect(['global', 'user-ip', 'user', 'tenant']).toContain(policy);
    });
  });
});
