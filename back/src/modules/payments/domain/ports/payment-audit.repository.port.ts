export const PAYMENT_AUDIT_REPOSITORY = Symbol('PAYMENT_AUDIT_REPOSITORY');

export interface PaymentAuditRepositoryPort {
  create(input: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}
