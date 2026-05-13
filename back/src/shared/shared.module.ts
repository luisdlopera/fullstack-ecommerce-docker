import { Global, Module } from '@nestjs/common';
import { STORAGE_PORT } from './domain/ports/storage.port';
import { AUDIT_REPOSITORY } from './domain/ports/audit-repository.port';
import { PERMISSION_REPOSITORY } from './domain/ports/permission-repository.port';
import { S3CompatibleStorageAdapter } from './infrastructure/storage/s3-compatible-storage.adapter';
import { StorageConfig } from './infrastructure/storage/storage.config';
import { EmailService } from './infrastructure/email/email.service';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { PermissionSeedService } from './application/permission-seed.service';
import { AuditService } from './application/audit.service';
import { QueueModule } from './infrastructure/queues/queue.module';
import { PrismaAuditRepository } from './infrastructure/persistence/prisma-audit.repository';
import { PrismaPermissionRepository } from './infrastructure/persistence/prisma-permission.repository';

@Global()
@Module({
  // QueueModule activado con lazy initialization
  imports: [QueueModule],
  providers: [
    PrismaService,
    EmailService,
    StorageConfig,
    PermissionSeedService,
    AuditService,
    {
      provide: STORAGE_PORT,
      inject: [StorageConfig],
      useFactory: (storageConfig: StorageConfig) => new S3CompatibleStorageAdapter(storageConfig),
    },
    {
      provide: AUDIT_REPOSITORY,
      useClass: PrismaAuditRepository,
    },
    {
      provide: PERMISSION_REPOSITORY,
      useClass: PrismaPermissionRepository,
    },
  ],
  exports: [
    QueueModule,
    PrismaService,
    EmailService,
    StorageConfig,
    STORAGE_PORT,
    AUDIT_REPOSITORY,
    PERMISSION_REPOSITORY,
    AuditService,
    // QueueModule,
  ],
})
export class SharedModule {}
