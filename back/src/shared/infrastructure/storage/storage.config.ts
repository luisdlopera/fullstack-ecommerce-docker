import { Injectable } from '@nestjs/common';

type StorageProvider = 'minio' | 'r2';

const DEFAULT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

@Injectable()
export class StorageConfig {
  readonly provider: StorageProvider;
  readonly bucket: string;
  readonly region: string;
  readonly endpoint: string | undefined;
  readonly accessKey: string;
  readonly secretKey: string;
  readonly publicUrl: string;
  readonly forcePathStyle: boolean;
  readonly maxFileSizeBytes: number;

  constructor() {
    const providerRaw = (process.env.STORAGE_PROVIDER ?? 'r2').trim().toLowerCase();
    this.provider = providerRaw === 'minio' ? 'minio' : 'r2';

    this.bucket = (process.env.STORAGE_BUCKET ?? 'nexstore-products').trim();
    this.region = (process.env.STORAGE_REGION ?? (this.provider === 'r2' ? 'auto' : 'us-east-1')).trim();
    this.endpoint = process.env.STORAGE_ENDPOINT?.trim() || undefined;

    this.accessKey = (process.env.STORAGE_ACCESS_KEY ?? 'minioadmin').trim();
    this.secretKey = (process.env.STORAGE_SECRET_KEY ?? 'minioadmin').trim();

    const rawPublicUrl =
      process.env.STORAGE_PUBLIC_URL?.trim() ||
      (this.endpoint ? `${trimTrailingSlash(this.endpoint)}/${this.bucket}` : `/${this.bucket}`);
    this.publicUrl = trimTrailingSlash(rawPublicUrl);

    this.forcePathStyle = parseBoolean(process.env.STORAGE_FORCE_PATH_STYLE, this.provider === 'minio');

    const parsedSize = Number(process.env.STORAGE_MAX_FILE_SIZE_BYTES ?? DEFAULT_MAX_FILE_SIZE_BYTES);
    this.maxFileSizeBytes = Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : DEFAULT_MAX_FILE_SIZE_BYTES;

    if (!this.bucket) {
      throw new Error('STORAGE_BUCKET is required');
    }
    if (!this.accessKey || !this.secretKey) {
      throw new Error('STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY are required');
    }
    if (!this.endpoint && this.provider === 'r2') {
      throw new Error('STORAGE_ENDPOINT is required when STORAGE_PROVIDER=r2');
    }
  }
}
