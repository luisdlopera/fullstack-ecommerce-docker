import { Global, Module } from '@nestjs/common';
import { STORAGE_PORT } from './domain/ports/storage.port';
import { AUDIT_REPOSITORY } from './domain/ports/audit-repository.port';
import { S3CompatibleStorageAdapter } from './infrastructure/storage/s3-compatible-storage.adapter';
import { StorageConfig } from './infrastructure/storage/storage.config';
import { EmailService } from './infrastructure/email/email.service';
import { PrismaService } from './infrastructure/prisma/prisma.service';
// import { QueueModule } from './infrastructure/queues/queue.module';
import { PrismaAuditRepository } from './infrastructure/persistence/prisma-audit.repository';

@Global()
@Module({
  // QueueModule desactivado temporalmente
  // imports: [QueueModule],
  providers: [
    PrismaService,
    EmailService,
    StorageConfig,
    {
      provide: STORAGE_PORT,
      inject: [StorageConfig],
      useFactory: (storageConfig: StorageConfig) => new S3CompatibleStorageAdapter(storageConfig),
    },
    {
      provide: AUDIT_REPOSITORY,
      useClass: PrismaAuditRepository,
    },
  ],
  exports: [
    PrismaService,
    EmailService,
    StorageConfig,
    STORAGE_PORT,
    AUDIT_REPOSITORY,
    // QueueModule,
  ],
})
export class SharedModule {}
