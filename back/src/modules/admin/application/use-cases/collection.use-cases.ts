import { Inject, Injectable } from '@nestjs/common';
import { Gender } from '@prisma/client';
import {
  ADMIN_PRODUCT_REPOSITORY,
  type AdminProductRepositoryPort,
} from '../../domain/ports/admin-product.repository.port';

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  gender: Gender;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCollectionDto {
  name: string;
  slug: string;
  description?: string;
  gender: Gender;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
}

const genderMetadata: Record<Gender, { name: string; slug: string; description: string }> = {
  men: { name: 'Hombres', slug: 'men', description: 'Colección para hombres' },
  women: { name: 'Mujeres', slug: 'women', description: 'Colección para mujeres' },
  kid: { name: 'Niños', slug: 'kids', description: 'Colección para niños' },
  unisex: { name: 'Unisex', slug: 'unisex', description: 'Colección unisex' },
};

@Injectable()
export class GetCollectionsUseCase {
  constructor(@Inject(ADMIN_PRODUCT_REPOSITORY) private readonly productRepository: AdminProductRepositoryPort) {}

  async execute(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      gender?: Gender;
    } = {},
  ) {
    const { page = 1, limit = 20, search, gender } = params;

    // Get all products to count by gender
    const { data: products } = await this.productRepository.list({
      page: 1,
      limit: 10000,
    });

    const genderStats = (products as Array<{ gender: string }>).reduce<Record<string, number>>((acc, p) => {
      acc[p.gender] = (acc[p.gender] || 0) + 1;
      return acc;
    }, {});

    let collections: Collection[] = (['men', 'women', 'kid', 'unisex'] as Gender[]).map((g: Gender, index: number) => ({
      id: g,
      name: genderMetadata[g].name,
      slug: genderMetadata[g].slug,
      description: genderMetadata[g].description,
      gender: g,
      image: null,
      isActive: true,
      sortOrder: index,
      productCount: genderStats[g] || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Apply filters
    if (gender) {
      collections = collections.filter((c) => c.gender === gender);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      collections = collections.filter(
        (c) => c.name.toLowerCase().includes(searchLower) || c.slug.toLowerCase().includes(searchLower),
      );
    }

    const total = collections.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedCollections = collections.slice(start, start + limit);

    return {
      data: paginatedCollections,
      meta: { page, limit, total, totalPages },
    };
  }
}

@Injectable()
export class GetCollectionByIdUseCase {
  execute(id: string) {
    const gender = id as Gender;
    if (!genderMetadata[gender]) {
      throw new Error('Collection not found');
    }

    return {
      id: gender,
      name: genderMetadata[gender].name,
      slug: genderMetadata[gender].slug,
      description: genderMetadata[gender].description,
      gender,
      image: null,
      isActive: true,
      sortOrder: 0,
      productCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

@Injectable()
export class CreateCollectionUseCase {
  execute(dto: CreateCollectionDto) {
    return {
      id: dto.gender,
      name: dto.name,
      slug: dto.slug,
      description: dto.description || null,
      gender: dto.gender,
      image: dto.image || null,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
      productCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

@Injectable()
export class UpdateCollectionUseCase {
  execute(id: string, dto: Partial<CreateCollectionDto>) {
    return {
      id,
      name: dto.name || 'Updated',
      slug: dto.slug || id,
      description: dto.description || null,
      gender: dto.gender || (id as Gender),
      image: dto.image || null,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
      productCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

@Injectable()
export class DeleteCollectionUseCase {
  execute(id: string) {
    return { id, deleted: true };
  }
}
