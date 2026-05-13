import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_CATEGORY_REPOSITORY, type AdminCategoryRepositoryPort } from '../../domain/ports/admin-category.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class GetCategoryByIdUseCase {
  constructor(
    @Inject(ADMIN_CATEGORY_REPOSITORY) private readonly categoryRepository: AdminCategoryRepositoryPort,
  ) {}

  async execute(categoryId: string) {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }
}
