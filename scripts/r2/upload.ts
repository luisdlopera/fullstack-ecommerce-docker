#!/usr/bin/env node
/**
 * R2 Asset Upload Script
 * 
 * Uploads local assets to Cloudflare R2 maintaining folder structure.
 * 
 * Usage:
 *   tsx scripts/r2/upload.ts seed      # Upload front/public/seed
 *   tsx scripts/r2/upload.ts readme    # Upload front/public/readme
 *   tsx scripts/r2/upload.ts all       # Upload both
 *   tsx scripts/r2/upload.ts seed --dry-run  # Simulate without uploading
 * 
 * Environment variables required (STORAGE_R2_*):
 *   - STORAGE_R2_ACCOUNT_ID
 *   - STORAGE_R2_BUCKET_NAME
 *   - STORAGE_R2_ACCESS_KEY_ID
 *   - STORAGE_R2_SECRET_ACCESS_KEY
 *   - STORAGE_R2_ENDPOINT (optional, auto-generated if not set)
 */

import { readdir, stat, readFile } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { readFileSync } from 'node:fs';
import { PutObjectCommand } from '@aws-sdk/client-s3';

// Load environment variables from .env file
function loadEnvFile() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        // Only set if not already defined in environment
        if (process.env[key] === undefined) {
          process.env[key] = value.trim();
        }
      }
    }
  } catch {
    // .env file not found or unreadable, continue with existing env vars
  }
}

// Load .env before any other operations
loadEnvFile();

import { log, logHeader, logSection, logDivider, colors } from './lib/logger.js';
import { localPathToR2Key, isValidImageFile, getMimeType } from './lib/path-mapper.js';
import { initializeR2, objectExists } from './lib/r2-client.js';
import { createManifest, addManifestEntry, saveManifest, generatePublicUrl } from './lib/manifest.js';

// Supported source directories
const SOURCE_DIRS = {
  seed: 'front/public/seed',
  readme: 'front/public/readme',
} as const;

type SourceType = keyof typeof SOURCE_DIRS | 'all';

interface UploadOptions {
  dryRun: boolean;
  sourceType: SourceType;
}

interface UploadResult {
  localPath: string;
  r2Key: string;
  success: boolean;
  operation?: 'new' | 'overwrite' | 'skipped' | 'error';
  error?: string;
  size: number;
}

/**
 * Recursively finds all valid image files in a directory
 */
async function findImageFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  async function scan(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && isValidImageFile(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files.sort(); // Sort for consistent ordering
}

/**
 * Uploads a single file to R2
 */
async function uploadFile(
  localPath: string,
  sourceRoot: string,
  bucketName: string,
  publicBaseUrl: string,
  isDryRun: boolean
): Promise<UploadResult> {
  const r2Key = localPathToR2Key(localPath, sourceRoot);
  
  try {
    const fileStats = await stat(localPath);
    const fileContent = await readFile(localPath);
    const contentType = getMimeType(localPath);
    
    if (isDryRun) {
      return {
        localPath,
        r2Key,
        success: true,
        operation: 'new', // Would be determined in real run
        size: fileStats.size,
      };
    }
    
    const { client } = initializeR2();
    
    // Check if object exists
    const exists = await objectExists(client, bucketName, r2Key);
    const operation: UploadResult['operation'] = exists ? 'overwrite' : 'new';
    
    // Upload to R2 (overwrite by default)
    await client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      Body: fileContent,
      ContentType: contentType,
      Metadata: {
        'source-path': relative(process.cwd(), localPath),
        'uploaded-at': new Date().toISOString(),
      },
    }));
    
    return {
      localPath,
      r2Key,
      success: true,
      operation,
      size: fileStats.size,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      localPath,
      r2Key,
      success: false,
      operation: 'error',
      error: errorMessage,
      size: 0,
    };
  }
}

/**
 * Processes upload for a single source directory
 */
async function processSource(
  sourceType: keyof typeof SOURCE_DIRS,
  options: UploadOptions,
  publicBaseUrl: string
): Promise<UploadResult[]> {
  const sourceDir = SOURCE_DIRS[sourceType];
  const absoluteSource = resolve(process.cwd(), sourceDir);
  // Use parent directory (front/public) as root to preserve seed/readme prefix in keys
  const sourceRoot = resolve(process.cwd(), 'front/public');
  
  logSection(`Processing ${sourceType}`);
  log('info', `Source: ${sourceDir}`);
  
  // Find all image files
  const imageFiles = await findImageFiles(absoluteSource);
  
  if (imageFiles.length === 0) {
    log('warning', `No valid image files found in ${sourceDir}`);
    return [];
  }
  
  log('info', `Found ${imageFiles.length} image files`);
  logDivider();
  
  const results: UploadResult[] = [];
  const { config } = options.dryRun ? { config: null } : initializeR2();
  
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const r2Key = localPathToR2Key(file, sourceRoot);
    const displayPath = relative(absoluteSource, file);
    
    const progress = `[${i + 1}/${imageFiles.length}]`;
    
    if (options.dryRun) {
      log('debug', `${progress} Would upload: ${displayPath} → ${r2Key}`);
      results.push({
        localPath: file,
        r2Key,
        success: true,
        operation: 'new',
        size: (await stat(file)).size,
      });
      continue;
    }
    
    const result = await uploadFile(
      file,
      absoluteSource,
      config!.bucketName,
      publicBaseUrl,
      false
    );
    
    const statusIcon = result.success 
      ? (result.operation === 'overwrite' ? '↻' : '↑')
      : '✗';
    const statusColor = result.success 
      ? (result.operation === 'overwrite' ? colors.yellow : colors.green)
      : colors.red;
    
    console.log(
      `${statusColor}  ${statusIcon} ${progress} ${displayPath}${colors.reset}` +
      (result.operation === 'overwrite' ? `${colors.yellow} (overwrite)${colors.reset}` : '') +
      (result.error ? `${colors.red} - ${result.error}${colors.reset}` : '')
    );
    
    results.push(result);
  }
  
  return results;
}

/**
 * Prints final summary of upload results
 */
function printSummary(results: UploadResult[], isDryRun: boolean): void {
  const total = results.length;
  const uploaded = results.filter(r => r.success && r.operation === 'new').length;
  const overwritten = results.filter(r => r.success && r.operation === 'overwrite').length;
  const errors = results.filter(r => !r.success).length;
  const skipped = results.filter(r => r.operation === 'skipped').length;
  
  logDivider();
  logHeader('UPLOAD SUMMARY');
  
  if (isDryRun) {
    log('info', 'DRY RUN - No files were actually uploaded');
    console.log();
  }
  
  log('info', `Total files: ${total}`);
  log('success', `New uploads: ${uploaded}`);
  log('warning', `Overwritten: ${overwritten}`);
  log('error', `Errors: ${errors}`);
  
  if (skipped > 0) {
    log('info', `Skipped: ${skipped}`);
  }
  
  if (errors > 0) {
    console.log();
    log('error', 'Files with errors:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        log('error', `  - ${r.r2Key}: ${r.error}`);
      });
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const sourceArg = args[0] as SourceType;
  const isDryRun = args.includes('--dry-run');
  
  // Validate arguments
  if (!sourceArg || !['seed', 'readme', 'all'].includes(sourceArg)) {
    logHeader('R2 ASSET UPLOAD');
    console.log('Usage:');
    console.log(`  tsx scripts/r2/upload.ts seed [--dry-run]`);
    console.log(`  tsx scripts/r2/upload.ts readme [--dry-run]`);
    console.log(`  tsx scripts/r2/upload.ts all [--dry-run]`);
    console.log();
    console.log('Options:');
    console.log('  --dry-run    Simulate upload without actually uploading files');
    console.log();
    console.log('Environment variables required:');
    console.log('  STORAGE_R2_ACCOUNT_ID');
    console.log('  STORAGE_R2_BUCKET_NAME');
    console.log('  STORAGE_R2_ACCESS_KEY_ID');
    console.log('  STORAGE_R2_SECRET_ACCESS_KEY');
    console.log('  STORAGE_R2_ENDPOINT (optional)');
    console.log('  NEXT_PUBLIC_STORAGE_PUBLIC_URL (for manifest generation)');
    process.exit(1);
  }
  
  logHeader('R2 ASSET UPLOAD');
  
  if (isDryRun) {
    log('warning', 'DRY RUN MODE - No files will be uploaded');
    console.log();
  }
  
  // Get public base URL for manifest
  const publicBaseUrl = process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL || 
    process.env.STORAGE_PUBLIC_URL || 
    'https://unknown.cdn.com';
  
  // Determine which sources to process
  const sourcesToProcess: (keyof typeof SOURCE_DIRS)[] = 
    sourceArg === 'all' 
      ? ['seed', 'readme']
      : [sourceArg as keyof typeof SOURCE_DIRS];
  
  // Collect all results for manifest
  const allResults: UploadResult[] = [];
  
  // Process each source
  for (const source of sourcesToProcess) {
    const results = await processSource(
      source,
      { dryRun: isDryRun, sourceType: sourceArg },
      publicBaseUrl
    );
    allResults.push(...results);
  }
  
  // Print summary
  printSummary(allResults, isDryRun);
  
  // Generate manifest (only in real runs or if explicitly requested)
  if (!isDryRun && allResults.length > 0) {
    const { config } = initializeR2();
    const manifest = createManifest(config.bucketName, 'front/public');
    
    for (const result of allResults) {
      if (result.success) {
        const publicUrl = generatePublicUrl(publicBaseUrl, result.r2Key);
        addManifestEntry(manifest, {
          localPath: result.localPath,
          r2Key: result.r2Key,
          publicUrl,
          contentType: getMimeType(result.localPath),
          size: result.size,
          lastModified: new Date().toISOString(),
          operation: result.operation === 'new' ? 'uploaded' : 
                    result.operation === 'overwrite' ? 'overwritten' : 'skipped',
        });
      } else {
        addManifestEntry(manifest, {
          localPath: result.localPath,
          r2Key: result.r2Key,
          publicUrl: '',
          contentType: getMimeType(result.localPath),
          size: 0,
          lastModified: new Date().toISOString(),
          operation: 'error',
        });
      }
    }
    
    saveManifest(manifest);
    console.log();
    log('success', `Manifest saved to: r2-upload-manifest.json`);
  }
  
  // Exit with error code if there were failures
  const hasErrors = allResults.some(r => !r.success);
  process.exit(hasErrors ? 1 : 0);
}

// Run main function
main().catch(error => {
  log('error', `Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
