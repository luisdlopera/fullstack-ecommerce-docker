export type FeaturedProduct = {
  id: string;
  title: string;
  price: number;
  slug: string;
  images: string[];
};

const getBaseApiUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
  }

  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
};

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
