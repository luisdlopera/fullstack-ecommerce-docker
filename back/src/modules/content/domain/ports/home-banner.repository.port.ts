export const HOME_BANNER_REPOSITORY = Symbol('HOME_BANNER_REPOSITORY');

export type HomeBannerRecord = {
  id: number;
  title: string;
  subtitle: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  secondaryText: string | null;
  secondaryLink: string | null;
  imageUrl: string;
  storageKey: string | null;
  storageProvider: string | null;
  altText: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateHomeBannerInput = {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryText?: string;
  secondaryLink?: string;
  imageUrl: string;
  storageKey?: string;
  storageProvider?: string;
  altText?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateHomeBannerInput = Partial<CreateHomeBannerInput>;

export interface HomeBannerRepositoryPort {
  findAllActive(): Promise<HomeBannerRecord[]>;
  findAll(): Promise<HomeBannerRecord[]>;
  findById(id: number): Promise<HomeBannerRecord | null>;
  create(input: CreateHomeBannerInput): Promise<HomeBannerRecord>;
  update(id: number, input: UpdateHomeBannerInput): Promise<HomeBannerRecord>;
  delete(id: number): Promise<void>;
  updateSortOrder(ids: number[]): Promise<void>;
}
