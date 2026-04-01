export const ADMIN_CATEGORY_REPOSITORY = Symbol('ADMIN_CATEGORY_REPOSITORY');

export interface AdminCategoryRepositoryPort {
  list(): Promise<unknown[]>;
  findById(categoryId: string): Promise<unknown | null>;
  findBySlug(slug: string): Promise<{ id: string } | null>;
  countProducts(categoryId: string): Promise<number>;
  countChildren(categoryId: string): Promise<number>;
  create(input: Record<string, unknown>): Promise<unknown>;
  update(categoryId: string, input: Record<string, unknown>): Promise<unknown>;
  softDelete(categoryId: string): Promise<void>;
}
