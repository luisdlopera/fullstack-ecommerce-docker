/**
 * R2 Client configuration and validation
 * Uses AWS SDK v3 with S3-compatible API for Cloudflare R2
 */

import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { log, colors } from './logger.js';

/**
 * Required environment variables for R2 connection
 */
const REQUIRED_ENV_VARS = [
  'STORAGE_R2_ACCOUNT_ID',
  'STORAGE_R2_BUCKET_NAME',
  'STORAGE_R2_ACCESS_KEY_ID',
  'STORAGE_R2_SECRET_ACCESS_KEY',
] as const;

/**
 * R2 configuration interface
 */
export interface R2Config {
  accountId: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  region: string;
}

/**
 * Validates and loads R2 configuration from environment variables
 * 
 * @returns R2Config object with all required values
 * @throws Error if any required environment variable is missing
 */
export function loadR2Config(): R2Config {
  const missing: string[] = [];
  
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    log('error', 'Missing required environment variables:');
    for (const varName of missing) {
      log('error', `  - ${varName}`);
    }
    log('info', 'Please check your .env file and ensure all STORAGE_R2_* variables are set');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  const accountId = process.env.STORAGE_R2_ACCOUNT_ID!;
  const bucketName = process.env.STORAGE_R2_BUCKET_NAME!;
  const accessKeyId = process.env.STORAGE_R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.STORAGE_R2_SECRET_ACCESS_KEY!;
  
  // R2 uses a fixed region (auto) but S3 client requires a region value
  const region = 'auto';
  
  // Construct endpoint if not provided, or use custom endpoint
  const endpoint = process.env.STORAGE_R2_ENDPOINT || 
    `https://${accountId}.r2.cloudflarestorage.com`;
  
  return {
    accountId,
    bucketName,
    accessKeyId,
    secretAccessKey,
    endpoint,
    region,
  };
}

/**
 * Creates and returns a configured S3 client for R2
 * 
 * @param config - R2 configuration object
 * @returns Configured S3Client instance
 */
export function createR2Client(config: R2Config): S3Client {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // Required for R2 compatibility
    forcePathStyle: true,
  });
}

/**
 * Checks if an object already exists in the R2 bucket
 * 
 * @param client - S3Client instance
 * @param bucketName - Bucket name
 * @param key - Object key to check
 * @returns True if the object exists, false otherwise
 */
export async function objectExists(
  client: S3Client,
  bucketName: string,
  key: string
): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Initializes and validates R2 client configuration
 * Logs configuration details (without secrets)
 * 
 * @returns Object containing config and client
 */
export function initializeR2(): { config: R2Config; client: S3Client } {
  log('info', 'Loading R2 configuration...');
  
  const config = loadR2Config();
  
  log('success', 'R2 configuration loaded');
  log('debug', `  Account ID: ${config.accountId}`);
  log('debug', `  Bucket: ${config.bucketName}`);
  log('debug', `  Endpoint: ${config.endpoint}`);
  log('debug', `  Region: ${config.region}`);
  
  const client = createR2Client(config);
  
  return { config, client };
}
