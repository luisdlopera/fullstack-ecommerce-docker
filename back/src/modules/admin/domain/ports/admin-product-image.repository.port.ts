export const ADMIN_PRODUCT_IMAGE_REPOSITORY = Symbol('ADMIN_PRODUCT_IMAGE_REPOSITORY');

export type ProductImageRecord = {
  id: number;
  productId: string;
  url: string;
  storageProvider: string | null;
  storageKey: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: Date;
};

export type CreateProductImageInput = {
  productId: string;
  url: string;
  storageProvider: string;
  storageKey: string;
  contentType: string;
  sizeBytes: number;
  isPrimaryPreferred?: boolean;
};

export interface AdminProductImageRepositoryPort {
  existsProductById(productId: string): Promise<boolean>;
  createProductImage(input: CreateProductImageInput): Promise<ProductImageRecord>;
  findProductImageById(imageId: number): Promise<ProductImageRecord | null>;
  listProductImages(productId: string): Promise<ProductImageRecord[]>;
  deleteProductImage(imageId: number): Promise<void>;
  reorderProductImages(productId: string, imageIdsInOrder: number[]): Promise<void>;
  setPrimaryImage(productId: string, imageId: number): Promise<ProductImageRecord>;
}
