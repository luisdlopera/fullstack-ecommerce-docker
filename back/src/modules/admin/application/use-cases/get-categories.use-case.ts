import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_CATEGORY_REPOSITORY, type AdminCategoryRepositoryPort } from '../../domain/ports/admin-category.repository.port';

@Injectable()
export class GetCategoriesUseCase {
  constructor(
    @Inject(ADMIN_CATEGORY_REPOSITORY) private readonly categoryRepository: AdminCategoryRepositoryPort,
  ) {}

  execute() {
    return this.categoryRepository.list();
  }
}
