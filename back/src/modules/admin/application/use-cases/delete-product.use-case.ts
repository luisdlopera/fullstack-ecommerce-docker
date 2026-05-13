import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_PRODUCT_REPOSITORY, type AdminProductRepositoryPort } from '../../domain/ports/admin-product.repository.port';
import { ADMIN_AUDIT_REPOSITORY, type AdminAuditRepositoryPort } from '../../domain/ports/admin-audit.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class DeleteProductUseCase {
  constructor(
    @Inject(ADMIN_PRODUCT_REPOSITORY) private readonly productRepository: AdminProductRepositoryPort,
    @Inject(ADMIN_AUDIT_REPOSITORY) private readonly auditRepository: AdminAuditRepositoryPort,
  ) {}

  async execute(productId: string, actorId: string) {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new NotFoundError('Product not found');
    const productTitle = (product as { title?: string }).title ?? '';

    await this.productRepository.softDelete(productId);

    await this.auditRepository.create({
      actorId,
      action: 'product.deleted',
      entityType: 'product',
      entityId: productId,
      metadata: { title: productTitle },
    });

    return { ok: true };
  }
}
