# Seed Assets

This folder contains placeholder and static visual assets used for the frontend UI.
Currently these are stored locally for development and demonstration purposes.

## Future R2 Migration
In the future, these assets will be migrated to Cloudflare R2 (or similar object storage).
- **Why?** To keep the repository lightweight and reduce the build size.
- **How?** The assets inside this folder will be uploaded to an R2 bucket maintaining the exact same path structure (`/seed/home/...`, `/seed/products/...`). Then, we'll configure a custom domain or a CDN URL in our environment variables (e.g., `NEXT_PUBLIC_CDN_URL`) and prefix our image paths rather than reading them from `/`.

## Naming Convention
- Files and folders use `kebab-case`.
- Product images strictly follow: `01-cover.webp`, `02-front.webp`, `03-back.webp`, `04-detail.webp`, `05-model.webp`.
