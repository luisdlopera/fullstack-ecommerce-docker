import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_PRODUCT_REPOSITORY, type AdminProductRepositoryPort } from '../../domain/ports/admin-product.repository.port';

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject(ADMIN_PRODUCT_REPOSITORY) private readonly productRepository: AdminProductRepositoryPort,
  ) {}

  async execute(
    page: number = 1,
    limit: number = 20,
    search?: string,
    categoryId?: string,
    isActive?: boolean,
    inStock?: boolean,
  ) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const { data, total } = await this.productRepository.list({
      page: safePage,
      limit: safeLimit,
      search,
      categoryId,
      isActive,
      inStock,
    });

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
      },
    };
  }
}
