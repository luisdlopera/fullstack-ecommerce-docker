export const ADMIN_AUDIT_REPOSITORY = Symbol('ADMIN_AUDIT_REPOSITORY');

export interface AdminAuditRepositoryPort {
  create(input: { actorId: string; action: string; entityType: string; entityId: string; metadata?: Record<string, unknown> }): Promise<void>;
}
