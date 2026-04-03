import { Logger } from '@nestjs/common';

const logger = new Logger('AuthDebug');

export function authDebugEnabled(): boolean {
  return process.env.AUTH_DEBUG_LOGS === 'true';
}

export function authDebugLog(event: string, payload: Record<string, unknown> = {}): void {
  if (!authDebugEnabled()) return;
  logger.log(JSON.stringify({ event, ...payload }));
}

export function authDebugError(event: string, payload: Record<string, unknown> = {}): void {
  if (!authDebugEnabled()) return;
  logger.error(JSON.stringify({ event, ...payload }));
}