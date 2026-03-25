export type ProductImage = {
  id: number;
  url: string;
};

export type Category = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  inStock: number;
  price: number;
  sizes: string[];
  slug: string;
  tags: string[];
  gender: string;
  categoryId: string;
  ProductImage: ProductImage[];
  category: Category;
};

export type FeaturedProduct = {
  id: string;
  title: string;
  price: number;
  slug: string;
  images: string[];
};

export type ProductListResponse = {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ProductFilters = {
  page?: number;
  limit?: number;
  query?: string;
  category?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
};

export type Country = {
  id: string;
  name: string;
};

const getBaseApiUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
  }

  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
};

export function getClientApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
}

export async function getFeaturedProducts(limit = 8): Promise<FeaturedProduct[]> {
  const baseUrl = getBaseApiUrl();
  const response = await fetch(`${baseUrl}/products/featured?limit=${limit}`, {
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  return response.json() as Promise<FeaturedProduct[]>;
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const baseUrl = getBaseApiUrl();
  const response = await fetch(`${baseUrl}/products/${slug}`, {
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.status}`);
  }

  return response.json() as Promise<Product>;
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductListResponse> {
  const baseUrl = getBaseApiUrl();
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.query) params.set('query', filters.query);
  if (filters.category) params.set('category', filters.category);
  if (filters.gender) params.set('gender', filters.gender);
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
  if (filters.inStock !== undefined) params.set('inStock', String(filters.inStock));

  const qs = params.toString();
  const response = await fetch(`${baseUrl}/products${qs ? `?${qs}` : ''}`, {
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  return response.json() as Promise<ProductListResponse>;
}

export async function getCategories(): Promise<Category[]> {
  const baseUrl = getBaseApiUrl();
  const response = await fetch(`${baseUrl}/categories`, {
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }

  return response.json() as Promise<Category[]>;
}

export async function getCountries(): Promise<Country[]> {
  const baseUrl = getBaseApiUrl();
  const response = await fetch(`${baseUrl}/countries`, {
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch countries: ${response.status}`);
  }

  return response.json() as Promise<Country[]>;
}
