import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

type ResponseEnvelope<T> = {
  success: boolean;
  message?: string | string[];
  data: T;
  meta?: Record<string, unknown>;
};

@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ requestId?: string }>();
    const requestId = request?.requestId;

    return next.handle().pipe(
      map((value) => {
        if (value && typeof value === 'object' && 'success' in (value as object)) {
          return value;
        }

        const envelope: ResponseEnvelope<unknown> = {
          success: true,
          data: value,
          meta: requestId ? { requestId } : undefined,
        };

        return envelope;
      }),
    );
  }
}
