import net from 'node:net';
import { spawn } from 'node:child_process';

const FRONT_DEFAULT_PORT = Number(process.env.FRONT_PORT ?? 3000);
const BACK_DEFAULT_PORT = Number(process.env.BACK_PORT ?? 4000);
const MAX_PORT_SCAN = 50;

function isValidPort(port) {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

function isPortFree(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port);
  });
}

async function findAvailablePort(startPort, maxScan = MAX_PORT_SCAN) {
  for (let i = 0; i <= maxScan; i += 1) {
    const port = startPort + i;
    if (port > 65535) break;
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(port)) {
      return port;
    }
  }

  throw new Error(`No free port found from ${startPort} to ${Math.min(startPort + maxScan, 65535)}`);
}

function spawnWorkspaceCommand(label, command, env) {
  const child = spawn(command, {
    env,
    shell: true,
    stdio: 'pipe',
  });

  const prefix = `[${label}]`;

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`${prefix} ${chunk}`);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(`${prefix} ${chunk}`);
  });

  return child;
}

async function main() {
  if (!isValidPort(FRONT_DEFAULT_PORT) || !isValidPort(BACK_DEFAULT_PORT)) {
    throw new Error('FRONT_PORT/BACK_PORT must be valid TCP ports (1-65535)');
  }

  const frontPort = await findAvailablePort(FRONT_DEFAULT_PORT);
  const backPort = await findAvailablePort(BACK_DEFAULT_PORT);

  const frontMoved = frontPort !== FRONT_DEFAULT_PORT;
  const backMoved = backPort !== BACK_DEFAULT_PORT;

  if (frontMoved || backMoved) {
    console.warn('[dev:apps] Port fallback activated:');
    console.warn(`- front: ${FRONT_DEFAULT_PORT} -> ${frontPort}`);
    console.warn(`- back:  ${BACK_DEFAULT_PORT} -> ${backPort}`);
  } else {
    console.log(`[dev:apps] Using default ports front=${frontPort}, back=${backPort}`);
  }

  const apiBase = `http://localhost:${backPort}/api`;
  const frontOrigin = `http://localhost:${frontPort}`;

  const backEnv = {
    ...process.env,
    PORT: String(backPort),
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? frontOrigin,
  };

  const frontEnv = {
    ...process.env,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? apiBase,
    INTERNAL_API_URL: process.env.INTERNAL_API_URL ?? apiBase,
  };

  const backChild = spawnWorkspaceCommand('back', 'npm run start:dev -w back', backEnv);
  const frontChild = spawnWorkspaceCommand('front', `npm run dev -w front -- --port ${frontPort}`, frontEnv);

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`[dev:apps] Received ${signal}, stopping processes...`);
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
        console.error(`[dev:apps] back exited with code ${code ?? 1}`);
        frontChild.kill('SIGTERM');
      }
      finish(code);
    });

    frontChild.on('exit', (code) => {
      if (!shuttingDown) {
        console.error(`[dev:apps] front exited with code ${code ?? 1}`);
        backChild.kill('SIGTERM');
      }
      finish(code);
    });
  });

  process.exit(exitCode);
}

main().catch((error) => {
  console.error(`[dev:apps] ${error.message}`);
  process.exit(1);
});
