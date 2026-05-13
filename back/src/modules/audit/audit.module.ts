import { Module } from '@nestjs/common';

import { SharedModule } from '../../shared/shared.module';
import { AuditController } from '../../shared/infrastructure/http/audit.controller';

/**
 * Módulo de Auditoría
 * 
 * Expone endpoints para consultar logs de actividad del sistema.
 * Requiere permisos de administrador para acceder.
 */
@Module({
  imports: [SharedModule],
  controllers: [AuditController],
})
export class AuditModule {}
