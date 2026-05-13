import { SetMetadata } from '@nestjs/common';
import { AuditEntityType } from '../../domain/ports/audit-repository.port';

export const AUDIT_METADATA_KEY = 'audit:metadata';

export interface AuditMetadata {
  /** Tipo de entidad afectada */
  entityType: AuditEntityType | string;

  /** Nombre de la acción (ej: 'PRODUCT_CREATED') */
  action: string;

  /** Función para extraer el ID de la entidad del resultado o argumentos */
   
  entityIdExtractor?: (result: unknown, args: unknown[]) => string | undefined;

  /** Función para extraer metadata adicional del resultado o argumentos */
   
  metadataExtractor?: (result: unknown, args: unknown[]) => Record<string, unknown>;

  /** Si true, loggear también en caso de error */
  logOnError?: boolean;

  /** Mensaje de error personalizado para el log */
  errorMessage?: string;
}

/**
 * Decorador para marcar un método para auditoría automática
 * 
 * @example
 * ```typescript
 * @Audit({
 *   entityType: AuditEntityType.PRODUCT,
 *   action: 'PRODUCT_CREATED',
 *   entityIdExtractor: (result) => result.id,
 *   metadataExtractor: (result) => ({ name: result.name, price: result.price }),
 * })
 * async createProduct(dto: CreateProductDto) {
 *   // ...
 * }
 * ```
 */
export const Audit = (metadata: AuditMetadata) => SetMetadata(AUDIT_METADATA_KEY, metadata);

/**
 * Obtener metadata de auditoría de un handler
 */
export const getAuditMetadata = (
   
  target: object,
  propertyKey: string,
): AuditMetadata | undefined => {
  return Reflect.getMetadata(AUDIT_METADATA_KEY, target, propertyKey);
};
