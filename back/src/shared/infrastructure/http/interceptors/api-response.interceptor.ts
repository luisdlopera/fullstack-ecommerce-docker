import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Response } from 'express';
import { apiResponse, isApiResponseBody } from '../api-response';
import { Messages } from '../messages.enum';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        if (isApiResponseBody(data)) {
          return data;
        }

        const status = response?.statusCode ?? HttpStatus.OK;

        if (status === HttpStatus.NO_CONTENT) {
          return apiResponse({
            ok: true,
            status,
            message: Messages.SUCCESSFUL,
            data: null,
          });
        }

        return apiResponse({
          ok: status < HttpStatus.BAD_REQUEST,
          status,
          message: Messages.SUCCESSFUL,
          data: data ?? null,
        });
      }),
    );
  }
}
