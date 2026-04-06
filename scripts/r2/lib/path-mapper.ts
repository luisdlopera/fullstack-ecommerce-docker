/**
 * Path mapping utilities for R2 uploads
 * Converts local filesystem paths to R2 object keys
 */

import { resolve, relative, normalize, sep, posix } from 'node:path';

/**
 * Valid image extensions supported for upload
 */
export const VALID_IMAGE_EXTENSIONS = new Set([
  '.webp',
  '.png',
  '.jpg',
  '.jpeg',
  '.avif',
]);

/**
 * Maps a local file path to an R2 object key
 * 
 * Rules:
 * - Removes the `front/public/` prefix
 * - Normalizes to forward slashes
 * - Preserves the original file name (kebab-case)
 * - Maintains directory structure relative to source root
 * 
 * @example
 * localPathToR2Key('front/public/seed/home/slider/home-slider-01.webp')
 * // => 'seed/home/slider/home-slider-01.webp'
 * 
 * @param localPath - The local file system path
 * @param sourceRoot - The root directory to strip (e.g., 'front/public')
 * @returns The R2 object key
 */
export function localPathToR2Key(localPath: string, sourceRoot: string): string {
  // Resolve to absolute paths for reliable comparison
  const absoluteLocal = resolve(localPath);
  const absoluteSource = resolve(sourceRoot);
  
  // Get path relative to source root
  let relativePath = relative(absoluteSource, absoluteLocal);
  
  // Normalize to forward slashes (R2 uses POSIX-style paths)
  relativePath = relativePath.split(sep).join(posix.sep);
  
  // Remove any leading ./ or /
  relativePath = relativePath.replace(/^(\.\/|\/)/, '');
  
  return relativePath;
}

/**
 * Checks if a file has a valid image extension
 * 
 * @param filePath - Path to check
 * @returns True if the file has a valid image extension
 */
export function isValidImageFile(filePath: string): boolean {
  const lowerPath = filePath.toLowerCase();
  return Array.from(VALID_IMAGE_EXTENSIONS).some(ext => lowerPath.endsWith(ext));
}

/**
 * Gets the file extension from a path
 * 
 * @param filePath - Path to extract extension from
 * @returns The file extension including the dot, lowercase
 */
export function getFileExtension(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.');
  return lastDot > 0 ? filePath.slice(lastDot).toLowerCase() : '';
}

/**
 * Maps file extensions to MIME types for Content-Type headers
 */
const EXTENSION_TO_MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.avif': 'image/avif',
};

/**
 * Gets the appropriate MIME type for a file based on its extension
 * 
 * @param filePath - Path to determine MIME type for
 * @returns The MIME type string, or 'application/octet-stream' if unknown
 */
export function getMimeType(filePath: string): string {
  const ext = getFileExtension(filePath);
  return EXTENSION_TO_MIME[ext] || 'application/octet-stream';
}
