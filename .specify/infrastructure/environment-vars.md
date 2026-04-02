# Environment Variables

## Overview

Complete reference for all environment variables used in the Nexstore application.

## Core Application

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | — | Public API URL for browser requests (include `/api`) |
| `INTERNAL_API_URL` | No | — | Internal API URL for server-side requests in Docker |

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 5001 | Server port |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `REDIS_URL` | Yes | `redis://localhost:5003` | Redis connection string |

## Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `POSTGRES_USER` | Yes | `nexstore` | Database username |
| `POSTGRES_PASSWORD` | Yes | `nexstore` | Database password |
| `POSTGRES_DB` | Yes | `nexstore` | Database name |
| `POSTGRES_PORT` | No | 5432 (mapped to 5002) | Database port |

## Authentication

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | — | JWT signing secret (generate with `openssl rand -hex 64`) |
| `JWT_ACCESS_TTL` | No | `15m` | Access token lifetime |
| `JWT_REFRESH_TTL` | No | `7d` | Refresh token lifetime |
| `EMAIL_VERIFICATION_TTL_MINUTES` | No | `1440` | Email verification token expiry (24 hours) |
| `EMAIL_MX_REQUIRED` | No | `true` | Require MX record for email domains |
| `DISPOSABLE_EMAIL_DOMAINS` | No | `mailinator.com,...` | Blacklisted email domains |
| `ENABLE_SWAGGER` | No | `false` | Enable Swagger UI in production |

## Storage (MinIO/R2)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STORAGE_PROVIDER` | No | `minio` | Storage provider: `minio`, `r2`, `s3` |
| `STORAGE_BUCKET` | No | `nexstore-products` | Bucket name |
| `STORAGE_REGION` | No | `us-east-1` | Region (use `auto` for R2) |
| `STORAGE_ENDPOINT` | Yes | — | S3-compatible endpoint URL |
| `STORAGE_ACCESS_KEY` | Yes | — | Access key / Account ID |
| `STORAGE_SECRET_KEY` | Yes | — | Secret key |
| `STORAGE_PUBLIC_URL` | Yes | — | Public URL for accessing files |
| `STORAGE_FORCE_PATH_STYLE` | No | `true` | Use path-style URLs (required for MinIO) |
| `STORAGE_MAX_FILE_SIZE_BYTES` | No | `5242880` | Max upload size (5MB) |
| `MINIO_PORT` | No | 9000 (mapped to 5004) | MinIO API port |
| `MINIO_CONSOLE_PORT` | No | 9001 (mapped to 5005) | MinIO console port |

## Payment (MercadoPago)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MP_ACCESS_TOKEN` | Yes (prod) | — | MercadoPago access token |

## Checkout

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TAX_RATE` | No | `0.15` | Tax rate (15% for Colombia IVA) |

## URLs and CORS

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FRONTEND_URL` | Yes | — | Frontend URL for CORS and email redirects |
| `NEXT_PUBLIC_APP_URL` | No | — | Alternative frontend URL (fallback for FRONTEND_URL) |
| `FRONTEND_ORIGIN` | Yes | — | Frontend origin for CORS (Docker/legacy) |
| `CORS_ORIGIN` | No | — | Legacy CORS origin variable |
| `CORS_ALLOWED_ORIGINS` | No | — | Additional CORS origins (comma-separated) |

## Development Ports

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FRONT_PORT` | No | `5000` | Frontend dev server port |
| `BACK_PORT` | No | `5001` | Backend API port |
| `POSTGRES_PORT` | No | `5002` | PostgreSQL mapped port |
| `REDIS_PORT` | No | `5003` | Redis mapped port |
| `MINIO_PORT` | No | `5004` | MinIO API mapped port |
| `MINIO_CONSOLE_PORT` | No | `5005` | MinIO console mapped port |

## Test Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PLAYWRIGHT_BASE_URL` | No | `http://localhost:5000` | E2E test base URL |
| `E2E_AUTH_REAL` | No | — | Use real auth in E2E tests |

## Security Best Practices

1. **Never commit `.env` files**
   - Add `.env` to `.gitignore`
   - Only commit `.env.example` as template
   - Run gitleaks to catch accidental commits: `gitleaks detect --source .`

2. **Generate strong JWT secrets**
   ```bash
   openssl rand -hex 64
   ```

3. **Use different secrets per environment**
   - Development: Simple/random placeholders
   - Staging: Generated
   - Production: Strong, rotated periodically

4. **Store production secrets securely**
   - Use secret management (AWS Secrets Manager, Azure Key Vault)
   - Never log secrets
   - Restrict production .env access

5. **Variables marked as placeholders in .env.example**
   - `JWT_SECRET=change-me-generate-with-openssl-rand-hex-64`
   - `SMTP_PASS=your-resend-api-key`
   - `MP_ACCESS_TOKEN=your-mercadopago-access-token`
   - Always replace these with real values in your local `.env`

## References

- [Docker Services](./docker-services.md)
- [Ports Configuration](./ports.md)
- [MinIO Storage](./minio-storage.md)
