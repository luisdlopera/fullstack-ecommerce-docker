#!/usr/bin/env node

/**
 * Clean All Script - Safe cache/build artifact cleanup
 * This script safely removes build artifacts and caches without touching source code
 */

import { existsSync, statSync, rmSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import { createInterface } from 'readline';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color] || colors.reset}${message}${colors.reset}`);
}

const SAFE_TO_DELETE = [
  // Build artifacts
  '.next',
  'dist',
  'build',
  'out',
  
  // Test artifacts
  'coverage',
  '.nyc_output',
  
  // Cache directories
  '.turbo',
  '.cache',
  'node_modules/.cache',
  '.parcel-cache',
  '.webpack',
  
  // Lock files (optional, handled separately)
  // Logs
  'logs',
  '*.log',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',
];

const DESTRUCTIVE_DIRS = [
  'node_modules',
];

const PRISMA_MIGRATIONS = 'prisma/migrations';

const PROJECT_ROOT = resolve(process.cwd());

// Helper: Check if dir exists and get size
function getDirInfo(dirPath) {
  if (!existsSync(dirPath)) return null;
  try {
    const stats = statSync(dirPath);
    return {
      path: dirPath,
      size: stats.size,
      isDirectory: stats.isDirectory(),
    };
  } catch {
    return null;
  }
}

// Helper: Calculate directory size (approximate)
function getDirSize(dirPath) {
  let size = 0;
  try {
    const files = readdirSync(dirPath, { withFileTypes: true });
    for (const file of files) {
      const filePath = join(dirPath, file.name);
      if (file.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        try {
          size += statSync(filePath).size;
        } catch {}
      }
    }
  } catch {}
  return size;
}

function formatSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// Helper: Ask user for confirmation
function askQuestion(query) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// Helper: Delete directory
function deleteDir(dirPath, description) {
  try {
    if (existsSync(dirPath)) {
      const size = getDirSize(dirPath);
      rmSync(dirPath, { recursive: true, force: true });
      log(`  ✓ Deleted ${description} (${formatSize(size)})`, 'green');
      return size;
    }
  } catch (err) {
    log(`  ✗ Failed to delete ${description}: ${err.message}`, 'red');
  }
  return 0;
}

async function main() {
  log('');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║           NEXSTORE CLEANUP SCRIPT                          ║', 'cyan');
  log('║     Safe removal of build artifacts and caches             ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');
  const includeNodeModules = args.includes('--node-modules') || args.includes('-n');
  const includeMigrations = args.includes('--migrations') || args.includes('-m');

  // Find all directories to clean
  const frontPath = join(PROJECT_ROOT, 'front');
  const backPath = join(PROJECT_ROOT, 'back');
  const packagesPath = join(PROJECT_ROOT, 'packages');

  const locations = [
    { path: PROJECT_ROOT, name: 'root' },
    { path: frontPath, name: 'front' },
    { path: backPath, name: 'back' },
  ];

  if (existsSync(packagesPath)) {
    locations.push({ path: packagesPath, name: 'packages' });
  }

  // Collect items to delete
  const toDelete = [];
  let totalSize = 0;

  log('📁 Scanning for build artifacts and caches...', 'blue');
  log('');

  for (const { path: basePath, name } of locations) {
    for (const dir of SAFE_TO_DELETE) {
      const fullPath = join(basePath, dir);
      const info = getDirInfo(fullPath);
      if (info) {
        const size = getDirSize(fullPath);
        toDelete.push({
          path: fullPath,
          description: `${name}/${dir}`,
          size,
        });
        totalSize += size;
        log(`  Found: ${name}/${dir} (${formatSize(size)})`, 'yellow');
      }
    }
  }

  // Node modules (optional, destructive)
  const nodeModulesToDelete = [];
  if (includeNodeModules) {
    for (const { path: basePath, name } of locations) {
      const nmPath = join(basePath, 'node_modules');
      const info = getDirInfo(nmPath);
      if (info) {
        const size = getDirSize(nmPath);
        nodeModulesToDelete.push({
          path: nmPath,
          description: `${name}/node_modules`,
          size,
        });
        totalSize += size;
        log(`  Found: ${name}/node_modules (${formatSize(size)}) [DESTRUCTIVE]`, 'red');
      }
    }
  }

  // Prisma migrations (optional, development only)
  let migrationsToDelete = null;
  if (includeMigrations) {
    const migrationsPath = join(backPath, PRISMA_MIGRATIONS);
    const info = getDirInfo(migrationsPath);
    if (info) {
      const size = getDirSize(migrationsPath);
      migrationsToDelete = {
        path: migrationsPath,
        description: `back/${PRISMA_MIGRATIONS}`,
        size,
      };
      totalSize += size;
      log(`  Found: back/${PRISMA_MIGRATIONS} (${formatSize(size)}) [DEVELOPMENT ONLY]`, 'red');
    }
  }

  log('');

  if (toDelete.length === 0 && nodeModulesToDelete.length === 0 && !migrationsToDelete) {
    log('✓ Nothing to clean. All directories are already clean!', 'green');
    log('');
    process.exit(0);
  }

  log(`📊 Total space to free: ${formatSize(totalSize)}`, 'cyan');
  log('');

  // Confirmation
  if (!force) {
    const answer = await askQuestion(
      `${colors.yellow}⚠️  Delete these items? (yes/no): ${colors.reset}`
    );
    if (answer !== 'yes' && answer !== 'y') {
      log('');
      log('❌ Cleanup cancelled by user', 'yellow');
      process.exit(0);
    }
  }

  log('');
  log('🧹 Cleaning...', 'blue');
  log('');

  // Delete safe directories
  let freedSpace = 0;
  for (const item of toDelete) {
    freedSpace += deleteDir(item.path, item.description);
  }

  // Delete node_modules if approved
  for (const item of nodeModulesToDelete) {
    freedSpace += deleteDir(item.path, item.description);
  }

  // Delete migrations if approved
  if (migrationsToDelete) {
    freedSpace += deleteDir(migrationsToDelete.path, migrationsToDelete.description);
  }

  log('');
  log(`✅ Cleanup complete! Freed ${formatSize(freedSpace)}`, 'green');
  log('');

  // Recommendations
  if (nodeModulesToDelete.length > 0) {
    log('💡 Remember to run: npm install', 'cyan');
  }
  if (migrationsToDelete) {
    log('💡 Remember to run: npm run db:sync to regenerate migrations', 'cyan');
  }
  log('');
}

main().catch((err) => {
  console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
  process.exit(1);
});
