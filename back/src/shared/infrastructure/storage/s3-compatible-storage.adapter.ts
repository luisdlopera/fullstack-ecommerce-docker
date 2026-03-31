import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { StoragePort, StorageUploadInput } from '../../domain/ports/storage.port';
import { StorageConfig } from './storage.config';

@Injectable()
export class S3CompatibleStorageAdapter implements StoragePort {
  private readonly logger = new Logger(S3CompatibleStorageAdapter.name);
  private readonly client: S3Client;

  constructor(@Inject(StorageConfig) private readonly storageConfig: StorageConfig) {
    this.client = new S3Client({
      region: this.storageConfig.region,
      endpoint: this.storageConfig.endpoint,
      forcePathStyle: this.storageConfig.forcePathStyle,
      credentials: {
        accessKeyId: this.storageConfig.accessKey,
        secretAccessKey: this.storageConfig.secretKey,
      },
    });
    this.logger.debug(`Initialized with endpoint: ${this.storageConfig.endpoint}, bucket: ${this.storageConfig.bucket}`);
  }

  async upload(input: StorageUploadInput): Promise<void> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.storageConfig.bucket,
          Key: input.key,
          Body: input.body,
          ContentType: input.contentType,
          CacheControl: input.cacheControl,
        }),
      );
    } catch (error) {
      this.logger.error(`S3 Upload failed for key ${input.key}. Error:`, error);
      throw error;
    }
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
