import { PrismaProductRepository } from './prisma-product.repository';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

describe('PrismaProductRepository', () => {
  const findMany = jest.fn().mockResolvedValue([]);
  const findFirst = jest.fn().mockResolvedValue(null);
  const $transaction = jest.fn();

  const prisma = {
    product: {
      findMany,
      findFirst,
    },
    $transaction,
  } as unknown as PrismaService;

  let repository: PrismaProductRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    findMany.mockResolvedValue([]);
    findFirst.mockResolvedValue(null);
    repository = new PrismaProductRepository(prisma);
  });

  it('findFeatured only includes featured, active, non-deleted products', async () => {
    await repository.findFeatured(8);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          featured: true,
          isActive: true,
          deletedAt: null,
        },
        take: 8,
      }),
    );
  });

  it('findBySlug only resolves active, non-deleted products', async () => {
    await repository.findBySlug('some-slug');

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'some-slug', deletedAt: null, isActive: true },
      }),
    );
  });

  it('findStockBySlug only resolves active, non-deleted products', async () => {
    await repository.findStockBySlug('some-slug');

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'some-slug', deletedAt: null, isActive: true },
      }),
    );
  });
});
