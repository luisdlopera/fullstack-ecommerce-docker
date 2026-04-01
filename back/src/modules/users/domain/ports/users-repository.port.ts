export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export type UserProfileRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  image: string | null;
};

export type UserPasswordRecord = {
  id: string;
  password: string;
};

export type CountryRecord = {
  id: string;
  name: string;
  isoCode: string | null;
  currency: string;
  isActive: boolean;
  allowsShipping: boolean;
  allowsPurchase: boolean;
};

export type UserAddressRecord = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  address: string;
  address2: string | null;
  postalCode: string;
  city: string;
  phone: string | null;
  countryId: string;
  country: CountryRecord;
};

export type FavoriteProductRow = {
  id: string;
  slug: string;
  title: string;
  price: number;
  ProductImage: { url: string }[];
};

export type UserFavoriteRow = {
  product: FavoriteProductRow;
};

export type AddressInput = {
  firstName: string;
  lastName: string;
  address: string;
  address2?: string | null;
  postalCode: string;
  city: string;
  phone?: string | null;
  countryId: string;
};

export interface UsersRepositoryPort {
  findUserProfile(userId: string): Promise<UserProfileRecord | null>;
  updateUserProfile(userId: string, data: Partial<UserProfileRecord>): Promise<UserProfileRecord>;
  findUserPassword(userId: string): Promise<UserPasswordRecord | null>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;

  findCountryById(countryId: string): Promise<CountryRecord | null>;

  findLatestAddress(userId: string): Promise<UserAddressRecord | null>;
  countAddresses(userId: string): Promise<number>;
  listAddresses(userId: string, skip: number, take: number): Promise<UserAddressRecord[]>;
  createAddress(userId: string, input: AddressInput): Promise<UserAddressRecord>;
  findAddressById(userId: string, addressId: string): Promise<{ id: string } | null>;
  updateAddress(addressId: string, input: AddressInput): Promise<UserAddressRecord>;
  deleteAddressById(userId: string, addressId: string): Promise<number>;
  deleteAddress(addressId: string): Promise<void>;

  listFavorites(userId: string): Promise<UserFavoriteRow[]>;
  countFavorites(userId: string): Promise<number>;
  listFavoritesPaginated(userId: string, skip: number, take: number): Promise<UserFavoriteRow[]>;
  findActiveProductById(productId: string): Promise<{ id: string } | null>;
  upsertFavorite(userId: string, productId: string): Promise<void>;
  deleteFavorite(userId: string, productId: string): Promise<void>;
}
