import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_CATEGORY_REPOSITORY, type AdminCategoryRepositoryPort } from '../../domain/ports/admin-category.repository.port';
import { UpsertCategoryDto } from '../../infrastructure/http/dto/upsert-category.dto';
import { ConflictError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(ADMIN_CATEGORY_REPOSITORY) private readonly categoryRepository: AdminCategoryRepositoryPort,
  ) {}

  async execute(dto: UpsertCategoryDto) {
    const existingSlug = await this.categoryRepository.findBySlug(dto.slug);
    if (existingSlug) throw new ConflictError('Category slug is already in use');

    return this.categoryRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      image: dto.image,
      parentId: dto.parentId,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });
  }
}
