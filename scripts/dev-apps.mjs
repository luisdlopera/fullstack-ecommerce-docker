import net from 'node:net';
import { spawn } from 'node:child_process';

// =============================================================================
// STRICT PORT CONFIGURATION - NO FALLBACK, NO DYNAMIC PORTS
// =============================================================================
// Frontend: 5006
// Backend: 5007
// If ports are occupied, the script FAILS (use npm run dev:clean first)
// =============================================================================

const FRONTEND_PORT = 5006;
const BACKEND_PORT = 5007;

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(label, message, color = 'reset') {
  const colorCode = colors[color] || colors.reset;
  console.log(`${colorCode}[${label}]${colors.reset} ${message}`);
}

function isPortFree(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

async function assertPortFree(port, name) {
  const free = await isPortFree(port);
  if (!free) {
    log('ERROR', `${colors.bold}${colors.red}Port ${port} is already in use!${colors.reset}`, 'red');
    log('ERROR', `Cannot start ${name} on port ${port}`, 'red');
    log('ERROR', '', 'red');
    log('ERROR', `Run ${colors.cyan}npm run dev:clean${colors.reset} first to kill processes on ports ${FRONTEND_PORT} and ${BACKEND_PORT}`, 'red');
    log('ERROR', '', 'red');
    log('ERROR', `Or manually kill the process: ${colors.yellow}npx kill-port ${port}${colors.reset}`, 'red');
    process.exit(1);
  }
}

function spawnWorkspaceCommand(label, command, env, color) {
  const child = spawn(command, {
    env,
    shell: true,
    stdio: 'pipe',
  });

  const prefix = `${colors[color]}[${label}]${colors.reset}`;

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`${prefix} ${chunk}`);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(`${prefix} ${chunk}`);
  });

  return child;
}

async function main() {
  log('dev:apps', `${colors.bold}Starting Nexstore development servers${colors.reset}`, 'cyan');
  log('dev:apps', '', 'cyan');
  log('dev:apps', `${colors.yellow}FRONTEND${colors.reset} will run on ${colors.green}http://localhost:${FRONTEND_PORT}${colors.reset}`, 'cyan');
  log('dev:apps', `${colors.yellow}BACKEND${colors.reset}  will run on ${colors.green}http://localhost:${BACKEND_PORT}${colors.reset}`, 'cyan');
  log('dev:apps', '', 'cyan');

  // Verify ports are free (strict - no fallback)
  await assertPortFree(FRONTEND_PORT, 'FRONTEND');
  await assertPortFree(BACKEND_PORT, 'BACKEND');

  log('dev:apps', `${colors.green}✓ Ports ${FRONTEND_PORT} and ${BACKEND_PORT} are available${colors.reset}`, 'green');
  log('dev:apps', '', 'cyan');

  const apiBase = `http://localhost:${BACKEND_PORT}/api`;
  const frontOrigin = `http://localhost:${FRONTEND_PORT}`;

  const backEnv = {
    ...process.env,
    PORT: String(BACKEND_PORT),
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? frontOrigin,
  };

  const frontEnv = {
    ...process.env,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? apiBase,
    INTERNAL_API_URL: process.env.INTERNAL_API_URL ?? apiBase,
  };

  const backChild = spawnWorkspaceCommand('BACK', 'npm run start:dev -w back', backEnv, 'blue');
  const frontChild = spawnWorkspaceCommand('FRONT', 'npm run dev -w front', frontEnv, 'yellow');

  // Wait a moment for processes to start
  await new Promise((resolve) => setTimeout(resolve, 3000));

  log('dev:apps', `${colors.bold}${colors.green}╔════════════════════════════════════════════════════════════╗${colors.reset}`, 'green');
  log('dev:apps', `${colors.bold}${colors.green}║  🚀 FRONT running on http://localhost:${FRONTEND_PORT}                    ║${colors.reset}`, 'green');
  log('dev:apps', `${colors.bold}${colors.green}║  🚀 BACK  running on http://localhost:${BACKEND_PORT}                     ║${colors.reset}`, 'green');
  log('dev:apps', `${colors.bold}${colors.green}╚════════════════════════════════════════════════════════════╝${colors.reset}`, 'green');

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;

    log('dev:apps', `Received ${signal}, stopping processes...`, 'yellow');
    backChild.kill(signal);
    frontChild.kill(signal);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  const exitCode = await new Promise((resolve) => {
    let exited = false;

    const finish = (code) => {
      if (exited) return;
      exited = true;
      resolve(typeof code === 'number' ? code : 1);
    };

    backChild.on('exit', (code) => {
      if (!shuttingDown) {
        log('dev:apps', `${colors.red}BACK exited with code ${code ?? 1}${colors.reset}`, 'red');
        frontChild.kill('SIGTERM');
      }
      finish(code);
    });

    frontChild.on('exit', (code) => {
      if (!shuttingDown) {
        log('dev:apps', `${colors.red}FRONT exited with code ${code ?? 1}${colors.reset}`, 'red');
        backChild.kill('SIGTERM');
      }
      finish(code);
    });
  });

  process.exit(exitCode);
}

main().catch((error) => {
  log('ERROR', error.message, 'red');
  process.exit(1);
});
