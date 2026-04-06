import { NotFoundError } from '../../../../shared/domain/errors/domain-error';
import { UploadProductImageUseCase } from './upload-product-image.use-case';
import type { StoragePort } from '../../../../shared/domain/ports/storage.port';
import type { AdminProductImageRepositoryPort } from '../../domain/ports/admin-product-image.repository.port';
import { StorageConfig } from '../../../../shared/infrastructure/storage/storage.config';
import type { UploadFile } from './upload-file.type';

describe('UploadProductImageUseCase', () => {
  const storage: jest.Mocked<StoragePort> = {
    upload: jest.fn(),
    delete: jest.fn(),
    getPublicUrl: jest.fn(),
  };

  const repository: jest.Mocked<AdminProductImageRepositoryPort> = {
    existsProductById: jest.fn(),
    createProductImage: jest.fn(),
    findProductImageById: jest.fn(),
    listProductImages: jest.fn(),
    deleteProductImage: jest.fn(),
    reorderProductImages: jest.fn(),
    setPrimaryImage: jest.fn(),
  };

  const storageConfig = {
    provider: 'r2',
    maxFileSizeBytes: 1024 * 1024,
  } as StorageConfig;

  const useCase = new UploadProductImageUseCase(storage, repository, storageConfig);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads image and persists metadata through repository', async () => {
    repository.existsProductById.mockResolvedValue(true);
    storage.getPublicUrl.mockReturnValue(
      'https://pub-e14c4ed4e514428faeb13ca8f02c15a7.r2.dev/products/p1/a.jpg',
    );
    repository.createProductImage.mockResolvedValue({
      id: 10,
      productId: 'p1',
      url: 'https://pub-e14c4ed4e514428faeb13ca8f02c15a7.r2.dev/products/p1/a.jpg',
      storageProvider: 'r2',
      storageKey: 'products/p1/a.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 123,
      sortOrder: 0,
      isPrimary: true,
      createdAt: new Date(),
    });

    const file = {
      mimetype: 'image/jpeg',
      size: 123,
      buffer: Buffer.from('abc'),
    } as UploadFile;

    const result = await useCase.execute({ productId: 'p1', file, makePrimary: true });

    expect(repository.existsProductById).toHaveBeenCalledWith('p1');
    expect(storage.upload).toHaveBeenCalledTimes(1);
    expect(repository.createProductImage).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'p1',
        storageProvider: 'r2',
        contentType: 'image/jpeg',
        sizeBytes: 123,
        isPrimaryPreferred: true,
      }),
    );
    expect(result.id).toBe(10);
  });

  it('throws when product does not exist', async () => {
    repository.existsProductById.mockResolvedValue(false);

    const file = {
      mimetype: 'image/png',
      size: 123,
      buffer: Buffer.from('abc'),
    } as UploadFile;

    await expect(useCase.execute({ productId: 'missing', file })).rejects.toThrow(NotFoundError);
    expect(storage.upload).not.toHaveBeenCalled();
  });
});
