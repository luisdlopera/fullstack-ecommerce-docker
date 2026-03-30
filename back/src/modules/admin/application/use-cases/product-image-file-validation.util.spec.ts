import { BadRequestException, PayloadTooLargeException, UnsupportedMediaTypeException } from '@nestjs/common';
import { validateProductImageFile } from './product-image-file-validation.util';
import type { UploadFile } from './upload-file.type';

describe('validateProductImageFile', () => {
  const maxBytes = 1024;

  it('accepts supported mime types with content', () => {
    const file = {
      mimetype: 'image/webp',
      size: 100,
      buffer: Buffer.from('abc'),
    } as UploadFile;

    expect(() => validateProductImageFile(file, maxBytes)).not.toThrow();
  });

  it('rejects unsupported mime types', () => {
    const file = {
      mimetype: 'image/gif',
      size: 100,
      buffer: Buffer.from('abc'),
    } as UploadFile;

    expect(() => validateProductImageFile(file, maxBytes)).toThrow(UnsupportedMediaTypeException);
  });

  it('rejects oversized files', () => {
    const file = {
      mimetype: 'image/png',
      size: 2000,
      buffer: Buffer.from('abc'),
    } as UploadFile;

    expect(() => validateProductImageFile(file, maxBytes)).toThrow(PayloadTooLargeException);
  });

  it('rejects empty buffers', () => {
    const file = {
      mimetype: 'image/png',
      size: 10,
      buffer: Buffer.alloc(0),
    } as UploadFile;

    expect(() => validateProductImageFile(file, maxBytes)).toThrow(BadRequestException);
  });
});
