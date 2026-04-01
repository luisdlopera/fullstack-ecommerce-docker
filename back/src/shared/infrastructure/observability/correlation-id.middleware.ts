import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const headerValue = req.headers['x-request-id'];
    const correlationId = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const requestId = correlationId && correlationId.trim() ? correlationId : randomUUID();

    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);

    next();
  }
}
