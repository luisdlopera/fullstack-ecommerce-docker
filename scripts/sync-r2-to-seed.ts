import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { config } from 'dotenv';

// Cargar variables de entorno principales y de back (por si acaso)
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), 'back/.env') });

const {
  STORAGE_R2_ACCOUNT_ID: R2_ACCOUNT_ID,
  STORAGE_R2_ACCESS_KEY_ID: R2_ACCESS_KEY_ID,
  STORAGE_R2_SECRET_ACCESS_KEY: R2_SECRET_ACCESS_KEY,
  STORAGE_R2_BUCKET_NAME: R2_BUCKET_NAME,
  STORAGE_R2_PUBLIC_URL: STORAGE_PUBLIC_URL 
} = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error('[ERROR] Faltan variables de entorno R2 en tu archivo .env');
  process.exit(1);
}

const PUBLIC_URL = STORAGE_PUBLIC_URL || 'https://pub-e14c4ed4e514428faeb13ca8f02c15a7.r2.dev';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function getR2Images(): Promise<Record<string, string[]>> {
  const imageMap: Record<string, string[]> = {};
  let isTruncated = true;
  let continuationToken: string | undefined = undefined;
  let totalFiles = 0;

  console.log(`[R2] Buscando imágenes en el bucket: ${R2_BUCKET_NAME} bajo el prefijo "products/"...`);

  while (isTruncated) {
    const params = {
      Bucket: R2_BUCKET_NAME,
      Prefix: 'products/',
      ContinuationToken: continuationToken,
    };
    
    // cast to any to avoid typescript mismatch between multiple @aws-sdk packages 
    const command = new ListObjectsV2Command(params as any) as any;

    try {
      const response = (await s3.send(command)) as any;
      const contents = response.Contents || [];

      for (const item of contents) {
        if (!item.Key) continue;
        
        // Ignorar directorios
        if (item.Key.endsWith('/')) continue;
        // Solo procesar archivos de imagen conocidos
        if (!item.Key.match(/\.(webp|jpg|jpeg|png)$/i)) continue;

        totalFiles++;

        // La llave es de formato: products/kids/kids-01-hoodie-blue/img.webp
        const parts = item.Key.split('/');
        if (parts.length >= 3) {
          // El nombre del producto es el último directorio antes del nombre del archivo
          const productFolder = parts[parts.length - 2];
          
          if (!imageMap[productFolder]) {
            imageMap[productFolder] = [];
          }

          const publicUrl = `${PUBLIC_URL}/${item.Key}`;
          imageMap[productFolder].push(publicUrl);
        }
      }

      isTruncated = response.IsTruncated ?? false;
      continuationToken = response.NextContinuationToken;
    } catch (error) {
      console.error('[ERROR] Falló la petición a R2:', error);
      process.exit(1);
    }
  }

  console.log(`[R2] Found ${totalFiles} files`);
  console.log(`[R2] Grouped into ${Object.keys(imageMap).length} products`);
  return imageMap;
}

async function updateSeedCatalog(imageMap: Record<string, string[]>) {
  const seedCatalogPath = resolve(process.cwd(), 'back/prisma/seed-catalog.ts');
  
  let content = readFileSync(seedCatalogPath, 'utf-8');

  const startMarker = '// --- INICIO IMAGENES R2 ---';
  const endMarker = '// --- FIN IMAGENES R2 ---';

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.error(`[ERROR] No se encontraron los marcadores de R2 en seed-catalog.ts`);
    process.exit(1);
  }

  // Comprobar directorios vacíos
  Object.entries(imageMap).forEach(([folder, images]) => {
    if (images.length === 0) {
      console.warn(`[WARNING] La carpeta R2 ${folder} no tiene imágenes válidas.`);
    }
  });

  const mapJson = JSON.stringify(imageMap, null, 2);
  const mapCode = `// Generado automáticamente por sync-r2-to-seed.ts\nconst R2_IMAGE_MAP: Record<string, string[]> = ${mapJson};`;
  
  const newContent = 
    content.substring(0, startIndex + startMarker.length) + 
    '\n' + mapCode + '\n' + 
    content.substring(endIndex);

  writeFileSync(seedCatalogPath, newContent, 'utf-8');
  console.log(`[SEED] Updated seed-catalog.ts exitosamente.`);
}

async function main() {
  const map = await getR2Images();
  await updateSeedCatalog(map);
}

main().catch((err) => {
  console.error('[ERROR] Ocurrió un error inesperado:', err);
  process.exit(1);
});
