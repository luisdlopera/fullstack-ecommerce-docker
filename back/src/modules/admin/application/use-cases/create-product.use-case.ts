import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_PRODUCT_REPOSITORY, type AdminProductRepositoryPort } from '../../domain/ports/admin-product.repository.port';
import { ADMIN_CATEGORY_REPOSITORY, type AdminCategoryRepositoryPort } from '../../domain/ports/admin-category.repository.port';
import { UpsertProductDto } from '../../infrastructure/http/dto/upsert-product.dto';
import { NotFoundError, ConflictError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(ADMIN_PRODUCT_REPOSITORY) private readonly productRepository: AdminProductRepositoryPort,
    @Inject(ADMIN_CATEGORY_REPOSITORY) private readonly categoryRepository: AdminCategoryRepositoryPort,
  ) {}

  async execute(dto: UpsertProductDto) {
    const category = await this.categoryRepository.findById(dto.categoryId);
    if (!category) throw new NotFoundError('Category not found');

    const existingSlug = await this.productRepository.findBySlug(dto.slug);
    if (existingSlug) throw new ConflictError('Slug is already in use');

    if (dto.sku) {
      const existingSku = await this.productRepository.findBySku(dto.sku);
      if (existingSku) throw new ConflictError('SKU is already in use');
    }

    return this.productRepository.create(
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
        featured: dto.featured ?? false,
        isActive: dto.isActive ?? true,
      },
      dto.images,
    );
  }
}
