/**
 * Manifest generation utilities for R2 uploads
 * Creates a JSON manifest mapping local files to R2 URLs
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Entry for a single uploaded file in the manifest
 */
export interface ManifestEntry {
  localPath: string;
  r2Key: string;
  publicUrl: string;
  contentType: string;
  size: number;
  lastModified: string;
  operation: 'uploaded' | 'overwritten' | 'skipped' | 'error';
}

/**
 * Complete manifest structure
 */
export interface UploadManifest {
  generatedAt: string;
  bucket: string;
  sourceRoot: string;
  summary: {
    total: number;
    uploaded: number;
    overwritten: number;
    skipped: number;
    errors: number;
  };
  files: ManifestEntry[];
}

/**
 * Creates a new empty manifest
 * 
 * @param bucket - R2 bucket name
 * @param sourceRoot - Local source directory root
 * @returns Empty manifest object
 */
export function createManifest(bucket: string, sourceRoot: string): UploadManifest {
  return {
    generatedAt: new Date().toISOString(),
    bucket,
    sourceRoot,
    summary: {
      total: 0,
      uploaded: 0,
      overwritten: 0,
      skipped: 0,
      errors: 0,
    },
    files: [],
  };
}

/**
 * Adds a file entry to the manifest
 * 
 * @param manifest - Manifest to add entry to
 * @param entry - File entry to add
 */
export function addManifestEntry(manifest: UploadManifest, entry: ManifestEntry): void {
  manifest.files.push(entry);
  manifest.summary.total++;
  
  switch (entry.operation) {
    case 'uploaded':
      manifest.summary.uploaded++;
      break;
    case 'overwritten':
      manifest.summary.overwritten++;
      break;
    case 'skipped':
      manifest.summary.skipped++;
      break;
    case 'error':
      manifest.summary.errors++;
      break;
  }
}

/**
 * Generates a public URL for an R2 object
 * 
 * @param baseUrl - Public base URL (e.g., from NEXT_PUBLIC_STORAGE_PUBLIC_URL)
 * @param key - R2 object key
 * @returns Full public URL
 */
export function generatePublicUrl(baseUrl: string, key: string): string {
  // Remove trailing slash from base URL if present
  const normalizedBase = baseUrl.replace(/\/$/, '');
  return `${normalizedBase}/${key}`;
}

/**
 * Saves the manifest to a JSON file
 * 
 * @param manifest - Manifest to save
 * @param outputPath - Path to save the manifest (default: ./r2-upload-manifest.json)
 */
export function saveManifest(manifest: UploadManifest, outputPath?: string): void {
  const defaultPath = resolve(process.cwd(), 'r2-upload-manifest.json');
  const targetPath = outputPath || defaultPath;
  
  const content = JSON.stringify(manifest, null, 2);
  writeFileSync(targetPath, content, 'utf-8');
}

/**
 * Gets a summary string of the manifest
 * 
 * @param manifest - Manifest to summarize
 * @returns Formatted summary string
 */
export function getManifestSummary(manifest: UploadManifest): string {
  const { summary } = manifest;
  return [
    `Total: ${summary.total}`,
    `Uploaded: ${summary.uploaded}`,
    `Overwritten: ${summary.overwritten}`,
    `Skipped: ${summary.skipped}`,
    `Errors: ${summary.errors}`,
  ].join(', ');
}
