export const AUDIT_REPOSITORY = Symbol('AUDIT_REPOSITORY');

export enum AuditEntityType {
  USER = 'user',
  PRODUCT = 'product',
  ORDER = 'order',
  INVENTORY = 'inventory',
  PAYMENT = 'payment',
  CATEGORY = 'category',
  AUTH = 'auth',
}

export interface AuditRecordInput {
  userId?: string;
  action: string;
  entityType: AuditEntityType | string;
  entityId?: string;
  previousToken?: string; // Para tracear cambios
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

export interface AuditRepositoryPort {
  record(input: AuditRecordInput): Promise<void>;
}
