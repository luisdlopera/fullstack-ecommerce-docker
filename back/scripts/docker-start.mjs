import { spawn } from 'node:child_process';

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: true });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`));
    });
  });

const boot = async () => {
  await run('npx', ['prisma', 'generate']);
  await run('npx', ['prisma', 'migrate', 'deploy']);
  await run('npx', ['prisma', 'db', 'seed']);
  await run('node', ['dist/main.js']);
};

boot().catch((error) => {
  console.error(error);
  process.exit(1);
});
