#!/usr/bin/env node
/**
 * Sync R2 images to local MinIO for development
 */

import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load env
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        if (process.env[key] === undefined) {
          process.env[key] = value.trim();
        }
      }
    }
  } catch {}
}

loadEnv();

// R2 Client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.STORAGE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.STORAGE_R2_SECRET_ACCESS_KEY || '',
  },
});

// MinIO Client
const minioClient = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://localhost:5010',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
  },
  forcePathStyle: true,
});

const R2_BUCKET = process.env.STORAGE_R2_BUCKET_NAME || 'nexstore';
const MINIO_BUCKET = 'nexstore-products';

async function syncImages() {
  console.log(`Syncing images from R2 (${R2_BUCKET}) to MinIO (${MINIO_BUCKET})...\n`);

  try {
    // List objects in R2
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      MaxKeys: 100,
    });
    const listResponse = await r2Client.send(listCommand);

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log('No images found in R2 bucket');
      return;
    }

    console.log(`Found ${listResponse.Contents.length} objects in R2\n`);

    for (const object of listResponse.Contents) {
      const key = object.Key;
      if (!key) continue;

      // Skip non-image files
      if (!key.match(/\.(webp|png|jpg|jpeg|avif)$/i)) continue;

      console.log(`Syncing: ${key}`);

      try {
        // Get from R2
        const getCommand = new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
        });
        const getResponse = await r2Client.send(getCommand);

        if (!getResponse.Body) {
          console.log(`  ⚠ No body for ${key}`);
          continue;
        }

        // Convert stream to buffer
        const chunks = [];
        for await (const chunk of getResponse.Body) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Put to MinIO
        const putCommand = new PutObjectCommand({
          Bucket: MINIO_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: getResponse.ContentType || 'image/webp',
        });
        await minioClient.send(putCommand);

        console.log(`  ✓ Synced (${(buffer.length / 1024).toFixed(1)} KB)`);
      } catch (err) {
        console.log(`  ✗ Failed: ${err.message}`);
      }
    }

    console.log('\n✓ Sync complete!');
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

syncImages();
