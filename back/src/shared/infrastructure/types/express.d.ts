import { JwtPayload } from '../auth/jwt-payload';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: JwtPayload;
    }
  }
}

export type AuditResult = Record<string, unknown> | Array<unknown>;
export type AuditArgs = unknown[];
export type AuditError = Error & { status?: number; code?: string };
