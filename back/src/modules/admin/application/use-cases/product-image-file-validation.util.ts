import { BadRequestError, ValidationError } from '../../../../shared/domain/errors/domain-error';
import type { UploadFile } from './upload-file.type';

export const ALLOWED_PRODUCT_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

export const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function normalizeMimeType(rawMimeType: string | undefined): string {
  return (rawMimeType ?? '').trim().toLowerCase();
}

export function validateProductImageFile(
  file: UploadFile | undefined,
  maxFileSizeBytes: number,
): asserts file is UploadFile {
  if (!file) {
    throw new BadRequestError('File is required');
  }

  const mimeType = normalizeMimeType(file.mimetype);
  if (!ALLOWED_PRODUCT_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new ValidationError('Unsupported file type. Allowed: jpg, jpeg, png, webp');
  }

  if (file.size > maxFileSizeBytes) {
    throw new ValidationError(`File exceeds max size of ${maxFileSizeBytes} bytes`);
  }

  if (!file.buffer || file.buffer.length === 0) {
    throw new BadRequestError('Empty file is not allowed');
  }
}
