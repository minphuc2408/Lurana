import { existsSync, realpathSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = realpathSync(fileURLToPath(new URL('../', import.meta.url)));
const wranglerDirectory = path.join(root, '.wrangler');
const stateDirectory = path.join(wranglerDirectory, 'state');

// Refuse junctions/symlinks that redirect a reset outside this repo's state.
if (existsSync(wranglerDirectory) && realpathSync(wranglerDirectory) !== wranglerDirectory) {
  throw new Error('D1 reset refused: .wrangler resolves to another location.');
}
if (existsSync(stateDirectory)) {
  const resolvedState = realpathSync(stateDirectory);
  if (resolvedState !== stateDirectory) {
    throw new Error('D1 reset refused: .wrangler/state resolves to another location.');
  }
  rmSync(resolvedState, { recursive: true, force: true });
}

console.log('Removed local Wrangler state. Remote databases were not accessed.');
