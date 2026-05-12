// Domain
export * from './domain/errors';
export * from './domain/utils';

// Infrastructure - Auth
export * from './infrastructure/auth';

// Infrastructure - Filters & Interceptors
export { HttpExceptionFilter } from './infrastructure/filters/http-exception.filter';
export { AuditInterceptor } from './infrastructure/audit/audit.interceptor';
export { Audit } from './infrastructure/audit/audit.decorator';

// Infrastructure - Prisma
export { PrismaService } from './infrastructure/prisma/prisma.service';

// Types
export type { AuditResult, AuditArgs, AuditError } from './infrastructure/types/express';
