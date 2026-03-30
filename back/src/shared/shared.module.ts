import { Global, Module } from '@nestjs/common';
import { STORAGE_PORT } from './domain/ports/storage.port';
import { S3CompatibleStorageAdapter } from './infrastructure/storage/s3-compatible-storage.adapter';
import { StorageConfig } from './infrastructure/storage/storage.config';
import { EmailService } from './infrastructure/email/email.service';
import { PrismaService } from './infrastructure/prisma/prisma.service';

@Global()
@Module({
  providers: [
    PrismaService,
    EmailService,
    StorageConfig,
    {
      provide: STORAGE_PORT,
      inject: [StorageConfig],
      useFactory: (storageConfig: StorageConfig) => new S3CompatibleStorageAdapter(storageConfig),
    },
  ],
  exports: [PrismaService, EmailService, StorageConfig, STORAGE_PORT],
})
export class SharedModule {}
