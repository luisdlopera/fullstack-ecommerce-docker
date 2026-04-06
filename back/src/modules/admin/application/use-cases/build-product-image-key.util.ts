import { randomUUID } from 'node:crypto';

function sanitizePathSegment(segment: string): string {
  return segment
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-');
}

export function buildProductImageKey(productId: string, extension: string): string {
  const date = new Date();
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const safeProductId = sanitizePathSegment(productId);
  const safeExt = extension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const id = randomUUID();

  return `products/${safeProductId}/${year}/${month}/${id}.${safeExt}`;
}
