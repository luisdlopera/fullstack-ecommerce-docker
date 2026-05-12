import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, tap, catchError, throwError } from 'rxjs';

import { AuditService } from '../../application/audit.service';
import { AUDIT_METADATA_KEY, AuditMetadata } from './audit.decorator';
import type { JwtPayload } from '../auth/jwt-payload';
import type { AuditResult, AuditArgs, AuditError } from '../types/express';

/**
 * Interceptor que automáticamente registra auditoría para métodos decorados con @Audit()
 * 
 * Uso: Aplicar globalmente en AppModule o por controlador:
 * ```typescript
 * @UseInterceptors(AuditInterceptor)
 * @Controller('products')
 * export class ProductsController {}
 * ```
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<AuditResult> {
    // Obtener metadata de auditoría del handler
    const auditMetadata = this.reflector.getAllAndOverride<AuditMetadata>(AUDIT_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay metadata de auditoría, continuar sin interceptar
    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    const args = context.getArgs() as AuditArgs;

    return next.handle().pipe(
      tap(async (result) => {
        try {
          await this.logSuccess(auditMetadata, user, result, args, request);
        } catch (error) {
          this.logger.error('Failed to record audit log', error);
        }
      }),
      catchError((error) => {
        if (auditMetadata.logOnError) {
          this.logError(auditMetadata, user, error, args, request).catch((e) => {
            this.logger.error('Failed to record error audit log', e);
          });
        }
        return throwError(() => error);
      }),
    );
  }

  private async logSuccess(
    metadata: AuditMetadata,
    user: JwtPayload | undefined,
    result: AuditResult,
    args: AuditArgs,
    request: Request,
  ): Promise<void> {
    const entityId = metadata.entityIdExtractor?.(result, args);
    const extraMetadata = metadata.metadataExtractor?.(result, args) || {};

    await this.auditService.record({
      userId: user?.sub,
      action: metadata.action,
      entityType: metadata.entityType,
      entityId,
      metadata: {
        ...extraMetadata,
        _context: {
          handler: `${request.method} ${request.path}`,
          success: true,
        },
      },
      ip: request.ip || (request.headers['x-forwarded-for'] as string),
      userAgent: request.headers['user-agent'],
    });

    this.logger.debug(`Audit recorded: ${metadata.action}`);
  }

  private async logError(
    metadata: AuditMetadata,
    user: JwtPayload | undefined,
    error: AuditError,
    args: AuditArgs,
    request: Request,
  ): Promise<void> {
    const extraMetadata = metadata.metadataExtractor?.(undefined, args) || {};

    await this.auditService.record({
      userId: user?.sub,
      action: `${metadata.action}_FAILED`,
      entityType: metadata.entityType,
      metadata: {
        ...extraMetadata,
        error: {
          message: error.message,
          name: error.name,
          statusCode: error.status,
        },
        _context: {
          handler: `${request.method} ${request.path}`,
          success: false,
        },
      },
      ip: request.ip || (request.headers['x-forwarded-for'] as string),
      userAgent: request.headers['user-agent'],
    });
  }
}
