import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_PRODUCT_REPOSITORY, type AdminProductRepositoryPort } from '../../domain/ports/admin-product.repository.port';
import { UpsertProductDto } from '../../infrastructure/http/dto/upsert-product.dto';
import { NotFoundError, ConflictError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(ADMIN_PRODUCT_REPOSITORY) private readonly productRepository: AdminProductRepositoryPort,
  ) {}

  async execute(productId: string, dto: UpsertProductDto) {
    const existing = await this.productRepository.findById(productId);
    if (!existing) throw new NotFoundError('Product not found');
    const existingData = existing as { slug?: string | null; sku?: string | null };

    if (dto.slug !== existingData.slug) {
      const slugTaken = await this.productRepository.findBySlug(dto.slug);
      if (slugTaken && slugTaken.id !== productId) throw new ConflictError('Slug is already in use');
    }

    if (dto.sku && dto.sku !== existingData.sku) {
      const skuTaken = await this.productRepository.findBySku(dto.sku);
      if (skuTaken && skuTaken.id !== productId) throw new ConflictError('SKU is already in use');
    }

    return this.productRepository.update(
      productId,
      {
        title: dto.title,
        description: dto.description,
        sku: dto.sku,
        inStock: dto.inStock,
        price: dto.price,
        comparePrice: dto.comparePrice,
        sizes: dto.sizes,
        slug: dto.slug,
        tags: dto.tags,
        gender: dto.gender,
        categoryId: dto.categoryId,
        featured: dto.featured,
        isActive: dto.isActive,
      },
      dto.images,
    );
  }
}
