/**
 * Asset URL helper for serving images from R2 or local storage
 * 
 * This utility provides a single point of configuration for asset URLs,
 * allowing seamless switching between local development and production R2/CDN.
 * 
 * Usage:
 *   import { getAssetUrl } from '@/lib/assets';
 *   
 *   // With NEXT_PUBLIC_STORAGE_BASE_URL set:
 *   getAssetUrl('home/slider/slider-1.webp')
 *   // → "https://pub-e14c4ed4e514428faeb13ca8f02c15a7.r2.dev/home/slider/slider-1.webp"
 *   
 *   // Without (local development):
 *   getAssetUrl('home/slider/slider-1.webp')
 *   // → "/home/slider/slider-1.webp"
 */

export function getAssetUrl(path: string): string {
	const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || '';
	const normalizedPath = path.replace(/^\/+/, '');

	if (baseUrl) {
		const normalizedBase = baseUrl.replace(/\/$/, '');
		return `${normalizedBase}/${normalizedPath}`;
	}

	return `/${normalizedPath}`;
}

export function getSeedAssetUrl(relativePath: string): string {
	return getAssetUrl(`seed/${relativePath}`);
}

export function getReadmeAssetUrl(relativePath: string): string {
	return getAssetUrl(`readme/${relativePath}`);
}

export function buildR2Key(publicPath: string): string {
	return publicPath.replace(/^\/+/, '');
}
