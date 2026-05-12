import { createHash } from 'node:crypto';

/**
 * Normalizes an email address for consistent comparison
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Creates a SHA-256 hash of a value
 */
export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Gets the base URL for the frontend from environment variables
 */
export function getFrontendBaseUrl(): string {
  const raw =
    process.env.FRONTEND_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    buildFallbackFrontendUrl();
  return raw.replace(/\/$/, '');
}

/**
 * Builds a fallback frontend URL from environment variables
 */
function buildFallbackFrontendUrl(): string {
  const port = process.env.FRONTEND_PORT || process.env.FRONT_PORT || '5006';
  const host = process.env.FRONTEND_HOST || 'localhost';
  return `http://${host}:${port}`;
}

/**
 * Gets the TTL for password reset tokens in milliseconds
 */
export function getPasswordResetTtlMs(): number {
  const minutes = Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? 30);
  if (!Number.isFinite(minutes) || minutes <= 0) return 30 * 60 * 1000;
  return Math.floor(minutes * 60 * 1000);
}

/**
 * Gets the TTL for email verification tokens in milliseconds
 */
export function getEmailVerificationTtlMs(): number {
  const minutes = Number(process.env.EMAIL_VERIFICATION_TTL_MINUTES ?? 60 * 24);
  if (!Number.isFinite(minutes) || minutes <= 0) return 24 * 60 * 60 * 1000;
  return Math.floor(minutes * 60 * 1000);
}

/**
 * Gets the set of disposable email domains to block
 */
export function getDisposableDomains(): Set<string> {
  const configured = (process.env.DISPOSABLE_EMAIL_DOMAINS ?? '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
  const defaults = [
    'mailinator.com',
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'yopmail.com',
  ];
  return new Set([...defaults, ...configured]);
}
