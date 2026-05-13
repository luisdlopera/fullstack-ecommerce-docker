import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_CATEGORY_REPOSITORY, type AdminCategoryRepositoryPort } from '../../domain/ports/admin-category.repository.port';
import { UpsertCategoryDto } from '../../infrastructure/http/dto/upsert-category.dto';
import { NotFoundError, ConflictError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(ADMIN_CATEGORY_REPOSITORY) private readonly categoryRepository: AdminCategoryRepositoryPort,
  ) {}

  async execute(categoryId: string, dto: UpsertCategoryDto) {
    const existing = await this.categoryRepository.findById(categoryId);
    if (!existing) throw new NotFoundError('Category not found');
    const existingData = existing as { slug?: string | null };

    if (dto.slug !== existingData.slug) {
      const slugTaken = await this.categoryRepository.findBySlug(dto.slug);
      if (slugTaken && slugTaken.id !== categoryId) throw new ConflictError('Category slug is already in use');
    }

    return this.categoryRepository.update(categoryId, {
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      image: dto.image,
      parentId: dto.parentId,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
    });
  }
}
