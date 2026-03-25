import { Product } from '../../domain/product';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepositoryPort {
  findFeatured(limit?: number): Promise<Product[]>;
}
