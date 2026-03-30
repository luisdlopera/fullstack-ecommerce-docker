import { Global, Module } from '@nestjs/common';
import { STORAGE_PORT } from './domain/ports/storage.port';
import { S3CompatibleStorageAdapter } from './infrastructure/storage/s3-compatible-storage.adapter';
import { StorageConfig } from './infrastructure/storage/storage.config';
import { PrismaService } from './infrastructure/prisma/prisma.service';

@Global()
@Module({
  providers: [
    PrismaService,
    StorageConfig,
    {
      provide: STORAGE_PORT,
      useClass: S3CompatibleStorageAdapter,
    },
  ],
  exports: [PrismaService, StorageConfig, STORAGE_PORT],
})
export class SharedModule {}
