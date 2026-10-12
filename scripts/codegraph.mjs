import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Always use this repository's pinned CLI and index, even from a subdirectory.
const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
let shim;
try {
  shim = path.join(path.dirname(require.resolve('@colbymchenry/codegraph/package.json')), 'npm-shim.js');
} catch {
  console.error('CodeGraph is missing. Run npm ci from the repository root first.');
  process.exit(1);
}

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: node scripts/codegraph.mjs <init|sync|status|explore|serve> [arguments]');
  process.exit(1);
}
const child = spawn(process.execPath, [shim, ...args], {
  cwd: root,
  stdio: 'inherit',
  windowsHide: true,
  env: {
    ...process.env,
    CODEGRAPH_TELEMETRY: '0',
    DO_NOT_TRACK: '1',
    CODEGRAPH_NO_DOWNLOAD: '1',
  },
});
child.on('error', error => {
  console.error(`CodeGraph failed to start: ${error.message}`);
  process.exitCode = 1;
});
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
