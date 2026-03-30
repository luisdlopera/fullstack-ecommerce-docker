import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import type { StoragePort, StorageUploadInput } from '../../domain/ports/storage.port';
import { StorageConfig } from './storage.config';

@Injectable()
export class S3CompatibleStorageAdapter implements StoragePort {
  private readonly client: S3Client;

  constructor(private readonly storageConfig: StorageConfig) {
    this.client = new S3Client({
      region: this.storageConfig.region,
      endpoint: this.storageConfig.endpoint,
      forcePathStyle: this.storageConfig.forcePathStyle,
      credentials: {
        accessKeyId: this.storageConfig.accessKey,
        secretAccessKey: this.storageConfig.secretKey,
      },
    });
  }

  async upload(input: StorageUploadInput): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.storageConfig.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        CacheControl: input.cacheControl,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.storageConfig.bucket,
        Key: key,
      }),
    );
  }

  getPublicUrl(key: string): string {
    const normalizedKey = key.replace(/^\/+/, '');
    return `${this.storageConfig.publicUrl}/${normalizedKey}`;
  }
}
