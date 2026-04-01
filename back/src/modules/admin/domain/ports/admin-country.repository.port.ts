export const ADMIN_COUNTRY_REPOSITORY = Symbol('ADMIN_COUNTRY_REPOSITORY');

export interface AdminCountryRepositoryPort {
  list(): Promise<unknown[]>;
  findById(countryId: string): Promise<unknown | null>;
  create(input: Record<string, unknown>): Promise<unknown>;
  update(countryId: string, input: Record<string, unknown>): Promise<unknown>;
  delete(countryId: string): Promise<void>;
  countUserAddresses(countryId: string): Promise<number>;
  countOrderAddresses(countryId: string): Promise<number>;
}
