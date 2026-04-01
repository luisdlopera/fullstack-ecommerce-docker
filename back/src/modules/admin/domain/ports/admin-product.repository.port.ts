export const ADMIN_PRODUCT_REPOSITORY = Symbol('ADMIN_PRODUCT_REPOSITORY');

export type AdminProductListFilters = {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  inStock?: boolean;
};

export interface AdminProductRepositoryPort {
  list(filters: AdminProductListFilters): Promise<{ data: unknown[]; total: number }>;
  findById(productId: string): Promise<unknown | null>;
  findBySlug(slug: string): Promise<{ id: string } | null>;
  findBySku(sku: string): Promise<{ id: string } | null>;
  create(input: Record<string, unknown>, images?: string[]): Promise<unknown>;
  update(productId: string, input: Record<string, unknown>, images?: string[]): Promise<unknown>;
  softDelete(productId: string): Promise<{ id: string; title: string } | null>;
  updateStatus(productId: string, isActive: boolean): Promise<{ id: string; title: string; isActive: boolean }>;
  incrementStock(productId: string, quantity: number): Promise<void>;
  addImage(productId: string, imageUrl: string): Promise<unknown>;
  deleteImage(productId: string, imageId: number): Promise<boolean>;
}
