import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const configPath = path.join(root, 'wrangler.jsonc');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const staging = config.env?.staging;
const databaseId = 'ed391b18-0bcf-41b3-8315-389807ace7f2';

function validateTarget(target) {
  assert.equal(target?.name, 'lunara-staging', 'Refusing unexpected staging Worker.');
  assert.equal(target.d1_databases?.length, 1, 'Staging must have exactly one D1 binding.');
  const database = target.d1_databases[0];
  assert.equal(database.binding, 'DB');
  assert.equal(database.database_name, 'lunara-staging-db');
  assert.equal(database.database_id, databaseId, 'Refusing unexpected staging database ID.');
  assert.ok(!config.d1_databases.some(item => item.database_id === databaseId), 'Staging cannot share production D1.');
}

const [action, ...extra] = process.argv.slice(2);
assert.ok(['check', 'build', 'dry-run', 'deploy', 'migrate', 'seed'].includes(action) && extra.length === 0,
  'Usage: node scripts/staging.mjs check|build|dry-run|deploy|migrate|seed (no extra arguments).');
validateTarget(staging);
console.log(`STAGING ONLY: ${staging.name} / lunara-staging-db / ${databaseId}`);

function run(binary, args, build = false) {
  const result = spawnSync(process.execPath, [path.join(root, binary), ...args], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, CLOUDFLARE_ENV: build ? 'staging' : '' },
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

const wrangler = 'node_modules/wrangler/bin/wrangler.js';
if (['build', 'dry-run', 'deploy'].includes(action)) {
  run('node_modules/vite/bin/vite.js', ['build', '--mode', 'staging'], true);
  // Vite uses the top-level Worker name for its output directory in every environment.
  const outputConfig = path.join(root, 'dist/lunara/wrangler.json');
  validateTarget(JSON.parse(readFileSync(outputConfig, 'utf8')));
  if (action !== 'build') {
    run(wrangler, ['deploy', '--config', outputConfig, ...(action === 'dry-run' ? ['--dry-run'] : [])]);
  }
}
if (action === 'migrate') {
  run(wrangler, ['d1', 'migrations', 'apply', 'lunara-staging-db', '--remote', '--env', 'staging', '--config', configPath]);
}
if (action === 'seed') {
  run(wrangler, ['d1', 'execute', 'lunara-staging-db', '--remote', '--env', 'staging', '--config', configPath,
    '--file', path.join(root, 'docs/sql/MVP_SEED_DEV.sql')]);
}
