/**
 * Asset URL helper for serving images from R2 or local storage
 *
 * This utility provides a single point of configuration for asset URLs,
 * allowing seamless switching between local development and production R2/CDN.
 *
 * Usage:
 *   import { getAssetUrl, getProductImageUrl } from '@/lib/assets';
 *
 *   // With NEXT_PUBLIC_STORAGE_BASE_URL set:
 *   getAssetUrl('home/slider/slider-1.webp')
 *   // → "https://pub-e14c4ed4e514428faeb13ca8f02c15a7.r2.dev/home/slider/slider-1.webp"
 *
 *   // For product images (handles both storageKey and full URL):
 *   getProductImageUrl(productImage)
 *   // → "https://pub-e14c4ed4e514428faeb13ca8f02c15a7.r2.dev/products/men/..."
 */

/**
 * Construye una URL completa para un asset dado su path relativo.
 * Usa NEXT_PUBLIC_STORAGE_BASE_URL del entorno.
 */
export function getAssetUrl(path: string): string {
	const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || '';
	const normalizedPath = path.replace(/^\/+/g, '');

	if (baseUrl) {
		const normalizedBase = baseUrl.replace(/\/$/g, '');
		return `${normalizedBase}/${normalizedPath}`;
	}

	return `/${normalizedPath}`;
}

/**
 * Interface para imágenes de producto según el schema Prisma
 */
export interface ProductImageData {
	url: string;
	storageKey?: string | null;
	storageProvider?: string | null;
}

/**
 * Construye la URL de una imagen de producto.
 * Prioriza storageKey si está disponible y el provider es r2/local.
 * Si no, usa la URL completa guardada en la base de datos.
 */
export function getProductImageUrl(image: ProductImageData | null | undefined): string {
	if (!image) {
		return '/img/placeholder-product.png';
	}

	const { url, storageKey, storageProvider } = image;

	// Si tenemos storageKey y es un provider válido, construimos URL dinámica
	if (storageKey && (storageProvider === 'r2' || storageProvider === 'local' || !storageProvider)) {
		return getAssetUrl(storageKey);
	}

	// Fallback: usar la URL guardada en la base de datos
	if (url) {
		// Si la URL ya es absoluta (comienza con http), usarla directamente
		if (url.startsWith('http')) {
			return url;
		}

		// Si es una ruta relativa, construir URL completa
		return getAssetUrl(url);
	}

	return '/img/placeholder-product.png';
}

/**
 * Construye URLs para múltiples imágenes de producto.
 * Útil para galerías y carruseles.
 */
export function getProductImageUrls(images: ProductImageData[] | null | undefined): string[] {
	if (!images || images.length === 0) return [];
	return images.map(getProductImageUrl);
}

export function getSeedAssetUrl(relativePath: string): string {
	return getAssetUrl(`seed/${relativePath}`);
}

export function getReadmeAssetUrl(relativePath: string): string {
	return getAssetUrl(`readme/${relativePath}`);
}

export function buildR2Key(publicPath: string): string {
	return publicPath.replace(/^\/+/g, '');
}
