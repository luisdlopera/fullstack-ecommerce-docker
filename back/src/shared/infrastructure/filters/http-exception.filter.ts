import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DomainError } from '../../domain/errors/domain-error';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as { requestId?: string })?.requestId;

    const status =
      exception instanceof DomainError
        ? exception.status
        : exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = exception instanceof HttpException ? exception.getResponse() : undefined;

    let message: string | string[] = 'Internal server error';
    if (exception instanceof DomainError) {
      message = exception.message;
    }
    if (typeof body === 'string') {
      message = body;
    } else if (body && typeof body === 'object' && 'message' in body) {
      message = (body as { message: string | string[] }).message;
    }

    let errorName = 'Internal Server Error';
    if (exception instanceof DomainError) {
      errorName = exception.code;
    } else if (exception instanceof HttpException) {
      errorName =
        typeof body === 'object' && body !== null && 'error' in body
          ? String((body as { error: string }).error)
          : exception.name;
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: errorName,
      requestId,
    });
  }
}
