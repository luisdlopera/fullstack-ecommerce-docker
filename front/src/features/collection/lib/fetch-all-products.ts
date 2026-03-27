import { fetchProductsClient, type Product, type ProductFilters } from '@/lib/api';

/** Recorre todas las páginas (limit 100) hasta agotar el catálogo en API. */
export async function fetchAllProductsPages(filters: ProductFilters): Promise<Product[]> {
	const all: Product[] = [];
	let page = 1;
	while (true) {
		const res = await fetchProductsClient({ ...filters, page, limit: 100 });
		all.push(...res.data);
		if (res.data.length === 0 || page >= res.meta.totalPages) break;
		page += 1;
	}
	return all;
}
