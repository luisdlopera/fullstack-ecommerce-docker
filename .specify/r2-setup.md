# Cloudflare R2 Asset Upload Setup

Complete guide for configuring and using the R2 asset upload system for Nexstore.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Cloudflare R2 Setup](#cloudflare-r2-setup)
5. [Usage](#usage)
6. [Manifest File](#manifest-file)
7. [Future Frontend Integration](#future-frontend-integration)
8. [Troubleshooting](#troubleshooting)

## Overview

This system uploads local assets from `front/public/seed` and `front/public/readme` to Cloudflare R2 object storage, maintaining the exact folder structure for seamless migration.

**Key Features:**
- Preserves directory structure (`seed/home/slider/...` → `seed/home/slider/...`)
- Supports `.webp`, `.png`, `.jpg`, `.jpeg`, `.avif`
- Overwrites existing files by default (with clear logging)
- Generates JSON manifest for debugging and integration
- Dry-run mode for testing

## Prerequisites

- Node.js 22+ (matching project `.nvmrc`)
- Cloudflare account with R2 access
- AWS SDK credentials from Cloudflare R2

## Environment Variables

### Root `.env` (Private Credentials)

Add these to your root `.env` file (never commit this file):

```bash
# Cloudflare R2 Configuration (STORAGE_* prefix for consistency)
STORAGE_R2_ACCOUNT_ID=your-cloudflare-account-id
STORAGE_R2_BUCKET_NAME=nexstore-assets
STORAGE_R2_ACCESS_KEY_ID=your-r2-access-key-id
STORAGE_R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
STORAGE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```

### Frontend `.env` (Public URL)

Add to `front/.env.local`:

```bash
# Public URL for serving assets (R2 or CDN)
NEXT_PUBLIC_STORAGE_PUBLIC_URL=https://assets.yourdomain.com
```

For local development without R2, leave empty to use local assets:
```bash
NEXT_PUBLIC_STORAGE_PUBLIC_URL=
```

## Cloudflare R2 Setup

### 1. Create R2 Bucket

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** in the sidebar
3. Click **Create bucket**
4. Name it: `nexstore-assets` (or your preferred name)
5. Choose a location close to your users
6. Click **Create bucket**

### 2. Configure Public Access (Optional but Recommended)

To serve assets publicly:

1. In your R2 bucket settings, go to **Settings**
2. Enable **R2.dev subdomain** for quick testing:
   - Toggle "R2.dev subdomain"
   - Note the URL: `https://pub-xxx.r2.dev`
3. For production, configure a **Custom Domain**:
   - Go to **Custom domains**
   - Add your domain (e.g., `assets.yourdomain.com`)
   - Follow DNS configuration steps

### 3. Create API Tokens

1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API token**
3. Configure:
   - **Token name**: `nexstore-upload`
   - **Permissions**: **Object Read & Write**
   - **Bucket**: Select your bucket (`nexstore-assets`)
4. Click **Create API Token**
5. **Copy immediately**:
   - **Access Key ID** → `STORAGE_R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `STORAGE_R2_SECRET_ACCESS_KEY`

### 4. Get Account ID

Your Cloudflare Account ID is in the right sidebar of any dashboard page. Copy it to `STORAGE_R2_ACCOUNT_ID`.

## Usage

### Available Commands

```bash
# Upload only seed assets
npm run r2:upload:seed

# Upload only readme assets
npm run r2:upload:readme

# Upload both seed and readme
npm run r2:upload:all

# Dry run (simulate without uploading)
npm run r2:upload:seed -- --dry-run
npm run r2:upload:readme -- --dry-run
npm run r2:upload:all -- --dry-run
```

### Direct Script Execution

```bash
# Using tsx (requires tsx installed)
npx tsx scripts/r2/upload.ts seed
npx tsx scripts/r2/upload.ts readme
npx tsx scripts/r2/upload.ts all
npx tsx scripts/r2/upload.ts seed --dry-run
```

### Expected Output

```
╔════════════════════════════════════════════════════════════╗
║               R2 ASSET UPLOAD                              ║
╚════════════════════════════════════════════════════════════╝

⚠ DRY RUN MODE - No files will be uploaded

📋 Processing seed...
  ℹ Source: front/public/seed
  ℹ Found 63 image files
  ────────────────────────────────────────────────────────────
  › [1/63] home/slider/home-slider-01.webp → seed/home/slider/home-slider-01.webp
  › [2/63] products/kids/product-01-cover.webp → seed/products/kids/product-01-cover.webp
  ...
  ↑ [63/63] products/women/product-15-model.webp → seed/products/women/product-15-model.webp

  ────────────────────────────────────────────────────────────
╔════════════════════════════════════════════════════════════╗
║               UPLOAD SUMMARY                               ║
╚════════════════════════════════════════════════════════════╝

DRY RUN - No files were actually uploaded

ℹ Total files: 63
✓ New uploads: 0
⚠ Overwritten: 0
✗ Errors: 0
```

## Manifest File

After a successful upload, a `r2-upload-manifest.json` file is generated in the project root:

```json
{
  "generatedAt": "2026-01-15T10:30:00.000Z",
  "bucket": "nexstore-assets",
  "sourceRoot": "front/public",
  "summary": {
    "total": 63,
    "uploaded": 45,
    "overwritten": 18,
    "skipped": 0,
    "errors": 0
  },
  "files": [
    {
      "localPath": "/project/front/public/seed/home/slider/home-slider-01.webp",
      "r2Key": "seed/home/slider/home-slider-01.webp",
      "publicUrl": "https://assets.yourdomain.com/seed/home/slider/home-slider-01.webp",
      "contentType": "image/webp",
      "size": 45234,
      "lastModified": "2026-01-15T10:30:05.123Z",
      "operation": "uploaded"
    }
  ]
}
```

This manifest is useful for:
- Debugging upload issues
- Verifying which files were processed
- Bulk URL generation for database imports
- CI/CD pipeline validation

## Future Frontend Integration

### Asset URL Helper

A helper is available at `front/src/lib/assets.ts`:

```typescript
import { getAssetUrl } from '@/lib/assets';

// Usage
const imageUrl = getAssetUrl('seed/products/men/shoe-01-cover.webp');
// With NEXT_PUBLIC_STORAGE_PUBLIC_URL=https://assets.yourdomain.com:
// → "https://assets.yourdomain.com/seed/products/men/shoe-01-cover.webp"
// Without (local dev):
// → "/seed/products/men/shoe-01-cover.webp"
```

### Migration Strategy

**Phase 1: Dual Mode (Current)**
```typescript
// Components can work with both local and remote
<img src={getAssetUrl('seed/home/slider/home-slider-01.webp')} />
```

**Phase 2: Full Migration**
When ready to fully migrate:
1. Set `NEXT_PUBLIC_STORAGE_PUBLIC_URL` in production
2. All assets automatically point to R2
3. Local files remain for development fallback

### Database Integration

When storing product images in the database:

```typescript
// Store only the R2 key, not full URL
const productImage = {
  imageKey: 'seed/products/men/shoe-01-cover.webp',
  // Not: 'https://assets.yourdomain.com/seed/products/men/shoe-01-cover.webp'
};

// Build URL at runtime
const imageUrl = getAssetUrl(productImage.imageKey);
```

This approach allows:
- Changing CDN/domain without database migrations
- Local development with `NEXT_PUBLIC_STORAGE_PUBLIC_URL=`
- Easy environment-specific configurations

## Troubleshooting

### Missing Environment Variables

**Error**: `Missing required environment variables: STORAGE_R2_ACCOUNT_ID, ...`

**Solution**: Ensure all required variables are in your `.env` file:
- Check `.env.example` for the full list
- Copy from `.env.example` to `.env` and fill in real values
- Never commit `.env` with real credentials

### Authentication Failed

**Error**: `InvalidAccessKeyId` or `SignatureDoesNotMatch`

**Solution**:
1. Verify your Access Key ID and Secret Access Key are correct
2. Ensure the API token has "Object Read & Write" permissions
3. Check that the token is associated with the correct bucket
4. Try regenerating the API token in Cloudflare dashboard

### Bucket Not Found

**Error**: `NoSuchBucket`

**Solution**:
1. Verify `STORAGE_R2_BUCKET_NAME` matches your actual bucket name
2. Check that the bucket exists in your Cloudflare R2 dashboard
3. Ensure the bucket is in the correct account

### Files Not Uploading

**Symptom**: Dry run works but real upload fails

**Solution**:
1. Check that `STORAGE_R2_ENDPOINT` is correct:
   - Format: `https://<account-id>.r2.cloudflarestorage.com`
   - Account ID should be from Cloudflare dashboard sidebar
2. Verify network connectivity to R2 endpoint
3. Check Cloudflare R2 status page for outages

### CORS Issues (Frontend)

**Symptom**: Images don't load in browser due to CORS

**Solution**:
1. In Cloudflare R2 bucket settings, configure CORS:
   - Go to **Settings** → **CORS policy**
   - Add your frontend domain to allowed origins
   - Example: `https://yourdomain.com`, `http://localhost:3000`
2. For R2.dev subdomain, CORS is typically permissive

### Manifest Not Generated

**Symptom**: No `r2-upload-manifest.json` after upload

**Solution**:
- Manifest is only generated for successful uploads (not dry runs)
- Check that the script has write permissions to project root
- Look for any error messages in the console output

### Path Mapping Issues

**Symptom**: Files uploaded to wrong location in R2

**Solution**:
- Verify local structure matches expected: `front/public/seed/...`
- Check that `SOURCE_DIRS` in `scripts/r2/upload.ts` matches your structure
- Review `localPathToR2Key()` function for correct path stripping

## Security Best Practices

1. **Never commit credentials**: `.env` files are in `.gitignore`
2. **Use R2 API Tokens** (not global API keys) for granular permissions
3. **Rotate tokens regularly**: Delete and recreate API tokens periodically
4. **Restrict token permissions**: Use "Object Read & Write" only, not admin access
5. **Monitor bucket access**: Enable access logs in Cloudflare dashboard

## Additional Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html)
- [R2 API Reference](https://developers.cloudflare.com/r2/api/)
