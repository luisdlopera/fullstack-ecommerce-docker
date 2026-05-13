import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_CATEGORY_REPOSITORY, type AdminCategoryRepositoryPort } from '../../domain/ports/admin-category.repository.port';
import { BadRequestError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(ADMIN_CATEGORY_REPOSITORY) private readonly categoryRepository: AdminCategoryRepositoryPort,
  ) {}

  async execute(categoryId: string) {
    const count = await this.categoryRepository.countProducts(categoryId);
    if (count > 0) {
      throw new BadRequestError('Cannot delete category with associated products');
    }

    const children = await this.categoryRepository.countChildren(categoryId);
    if (children > 0) {
      throw new BadRequestError('Cannot delete category with subcategories');
    }

    await this.categoryRepository.softDelete(categoryId);
    return { ok: true };
  }
}
