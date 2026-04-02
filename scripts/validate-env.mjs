#!/usr/bin/env node
/**
 * Environment Validation Script
 * Validates consistency between .env files and docker-compose configuration
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(level, message) {
  const color = colors[level] || colors.reset;
  console.log(`${color}${message}${colors.reset}`);
}

function parseEnvFile(content) {
  const vars = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) {
      vars[match[1]] = match[2].trim();
    }
  }
  return vars;
}

function loadEnvFile(path) {
  try {
    const content = readFileSync(path, 'utf-8');
    return parseEnvFile(content);
  } catch (err) {
    return null;
  }
}

const STANDARD_PORTS = {
  FRONTEND_PORT: '5000',
  BACKEND_PORT: '5001',
  POSTGRES_PORT: '5002',
  REDIS_PORT: '5003',
  MINIO_PORT: '5004',
  MINIO_CONSOLE_PORT: '5005',
};

const LEGACY_ALIASES = {
  FRONT_PORT: 'FRONTEND_PORT',
  BACK_PORT: 'BACKEND_PORT',
};

function validatePortConsistency(envVars, source) {
  const issues = [];

  for (const [key, expectedValue] of Object.entries(STANDARD_PORTS)) {
    if (envVars[key] && envVars[key] !== expectedValue) {
      issues.push(`${source}: ${key}=${envVars[key]} (expected ${expectedValue})`);
    }
  }

  for (const [legacy, standard] of Object.entries(LEGACY_ALIASES)) {
    if (envVars[legacy] && envVars[standard] && envVars[legacy] !== envVars[standard]) {
      issues.push(`${source}: ${legacy} (${envVars[legacy]}) != ${standard} (${envVars[standard]})`);
    }
  }

  return issues;
}

function validateEnvFile(path, requiredVars = []) {
  const vars = loadEnvFile(path);
  if (!vars) {
    return { exists: false, issues: [`File not found: ${path}`] };
  }

  const issues = [];
  for (const varName of requiredVars) {
    if (!vars[varName]) {
      issues.push(`Missing required variable: ${varName}`);
    }
  }

  issues.push(...validatePortConsistency(vars, path));
  return { exists: true, vars, issues };
}

function checkDockerComposePorts() {
  const issues = [];
  const dockerComposePath = resolve(process.cwd(), 'docker-compose.yml');

  try {
    const content = readFileSync(dockerComposePath, 'utf-8');

    // Check for hardcoded ports in the format "port:port" or port mappings
    const hardcodedPattern = /-\s*['"]?\d{4,5}:\d{4,5}['"]?/g;
    const matches = content.match(hardcodedPattern) || [];

    const allowedHardcoded = ['5001:5001', '5000:5000'];

    for (const match of matches) {
      const clean = match.replace(/['"]/g, '').trim();
      const portOnly = clean.replace(/^-\s*/, '');
      if (!allowedHardcoded.some(allowed => portOnly.includes(allowed))) {
        // Check if it uses env var pattern
        const usesEnvVar = content.includes('${') && content.includes('PORT');
        if (!usesEnvVar) {
          issues.push(`Potential hardcoded port in docker-compose.yml: ${match}`);
        }
      }
    }
  } catch (err) {
    issues.push(`Cannot read docker-compose.yml: ${err.message}`);
  }

  return issues;
}

function checkHardcodedLocalhost() {
  const issues = [];
  const filesToCheck = [
    'front/src/lib/api.ts',
    'front/src/lib/internal-api-base.ts',
    'front/next.config.ts',
    'back/src/shared/infrastructure/http/cors.ts',
    'back/src/shared/infrastructure/queues/queue.service.ts',
  ];

  for (const file of filesToCheck) {
    const filePath = resolve(process.cwd(), file);
    try {
      const content = readFileSync(filePath, 'utf-8');

      // Check for hardcoded localhost with ports that should use env vars
      const patterns = [
        /localhost:\d{4,5}/g,
        /127\.0\.0\.1:\d{4,5}/g,
      ];

      for (const pattern of patterns) {
        const matches = content.match(pattern) || [];
        for (const match of matches) {
          // Skip if it's using process.env to construct the URL
          const lines = content.split('\n');
          for (const line of lines) {
            if (line.includes(match) && !line.includes('process.env') && !line.includes('//')) {
              // Check if it's in a comment
              if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
                issues.push(`${file}: Hardcoded ${match} (line: ${lines.indexOf(line) + 1})`);
                break;
              }
            }
          }
        }
      }
    } catch (err) {
      // File might not exist, skip
    }
  }

  return issues;
}

function main() {
  const workspaceRoot = '/Users/luisdlopera/Documents/projects/cv/fullstack-ecommerce-docker';
  process.chdir(workspaceRoot);
  log('blue', '\n╔════════════════════════════════════════════════════════════╗');
  log('blue', '║     NEXSTORE ENVIRONMENT VALIDATION SCRIPT                 ║');
  log('blue', '╚════════════════════════════════════════════════════════════╝\n');

  let totalIssues = 0;

  // Validate root .env.example
  log('cyan', '\n📋 Checking root .env.example...');
  const rootEnv = validateEnvFile(resolve(process.cwd(), '.env.example'), [
    'FRONTEND_PORT',
    'BACKEND_PORT',
    'POSTGRES_PORT',
    'REDIS_PORT',
    'MINIO_PORT',
    'DATABASE_URL',
    'REDIS_URL',
  ]);

  if (rootEnv.issues.length === 0) {
    log('green', '  ✓ Root .env.example is valid');
  } else {
    for (const issue of rootEnv.issues) {
      log('yellow', `  ⚠ ${issue}`);
      totalIssues++;
    }
  }

  // Validate back/.env.example
  log('cyan', '\n📋 Checking back/.env.example...');
  const backEnv = validateEnvFile(resolve(process.cwd(), 'back/.env.example'), [
    'PORT',
    'DATABASE_URL',
    'REDIS_URL',
  ]);

  if (backEnv.issues.length === 0) {
    log('green', '  ✓ back/.env.example is valid');
  } else {
    for (const issue of backEnv.issues) {
      log('yellow', `  ⚠ ${issue}`);
      totalIssues++;
    }
  }

  // Validate front/.env.example
  log('cyan', '\n📋 Checking front/.env.example...');
  const frontEnv = validateEnvFile(resolve(process.cwd(), 'front/.env.example'), [
    'NEXT_PUBLIC_API_URL',
    'FRONTEND_PORT',
    'BACKEND_PORT',
  ]);

  if (frontEnv.issues.length === 0) {
    log('green', '  ✓ front/.env.example is valid');
  } else {
    for (const issue of frontEnv.issues) {
      log('yellow', `  ⚠ ${issue}`);
      totalIssues++;
    }
  }

  // Check docker-compose ports
  log('cyan', '\n🐳 Checking docker-compose.yml ports...');
  const dockerIssues = checkDockerComposePorts();
  if (dockerIssues.length === 0) {
    log('green', '  ✓ Docker compose port configuration looks good');
  } else {
    for (const issue of dockerIssues) {
      log('yellow', `  ⚠ ${issue}`);
      totalIssues++;
    }
  }

  // Check hardcoded localhost values
  log('cyan', '\n🔍 Checking for hardcoded localhost values...');
  const localhostIssues = checkHardcodedLocalhost();
  if (localhostIssues.length === 0) {
    log('green', '  ✓ No hardcoded localhost values found');
  } else {
    for (const issue of localhostIssues) {
      log('red', `  ✗ ${issue}`);
      totalIssues++;
    }
  }

  // Summary
  log('blue', '\n╔════════════════════════════════════════════════════════════╗');
  if (totalIssues === 0) {
    log('green', '║  ✅ ALL CHECKS PASSED - Environment is consistent!          ║');
  } else {
    log('yellow', `║  ⚠️  FOUND ${totalIssues} ISSUE(S) - Review recommended              ║`);
  }
  log('blue', '╚════════════════════════════════════════════════════════════╝\n');

  process.exit(totalIssues > 0 ? 1 : 0);
}

main();
