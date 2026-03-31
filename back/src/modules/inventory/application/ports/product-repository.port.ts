export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepositoryPort {
  existsById(productId: string): Promise<boolean>;
}
