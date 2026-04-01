import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const requestId = (req as { requestId?: string }).requestId;
      const durationMs = Date.now() - start;
      const payload = {
        method: req.method,
        path: req.originalUrl ?? req.url,
        statusCode: res.statusCode,
        durationMs,
        requestId,
      };

      this.logger.log(JSON.stringify(payload));
    });

    next();
  }
}
