import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const wrapper = path.join(root, 'scripts', 'codegraph.mjs');
const configDir = path.join(root, '.codex');
const configPath = path.join(configDir, 'config.toml');
const begin = '# BEGIN LUNARA ASSISTANT MCP';
const end = '# END LUNARA ASSISTANT MCP';
const existing = existsSync(configPath) ? readFileSync(configPath, 'utf8') : '';
const start = existing.indexOf(begin);
const finish = existing.indexOf(end);
if ((start < 0) !== (finish < 0) || (start >= 0 && finish < start)) {
  throw new Error('The existing managed MCP block is incomplete; inspect .codex/config.toml before retrying.');
}
const outside = start < 0 ? existing : existing.slice(0, start) + existing.slice(finish + end.length);
if (/^\s*\[mcp_servers\.(?:codegraph|openaiDeveloperDocs)(?:\]|\.)/m.test(outside)) {
  throw new Error('Existing MCP tables use the same names. Reconcile them before running assistant:setup; nothing was overwritten.');
}

// Machine-specific paths stay in ignored .codex/config.toml, never in shared docs.
// Preserve all unrelated settings and leave permission/sandbox defaults intact.
const q = JSON.stringify;
const managed = [
  begin,
  '[mcp_servers.codegraph]',
  `command = ${q(process.execPath)}`,
  `args = [${q(wrapper)}, "serve", "--mcp"]`,
  `cwd = ${q(root)}`,
  'startup_timeout_sec = 30',
  'tool_timeout_sec = 60',
  'env = { CODEGRAPH_TELEMETRY = "0", DO_NOT_TRACK = "1", CODEGRAPH_NO_DOWNLOAD = "1" }',
  '',
  '[mcp_servers.openaiDeveloperDocs]',
  'url = "https://developers.openai.com/mcp"',
  'startup_timeout_sec = 30',
  'tool_timeout_sec = 60',
  end,
].join('\n');
const updated = start < 0
  ? `${existing.trimEnd()}${existing.trim() ? '\n\n' : ''}${managed}\n`
  : existing.slice(0, start) + managed + existing.slice(finish + end.length);

// Validate the local installation and index before writing configuration.
const graph = spawnSync(process.execPath, [wrapper, existsSync(path.join(root, '.codegraph', 'codegraph.db')) ? 'sync' : 'init'], {
  cwd: root, stdio: 'inherit', windowsHide: true,
});
if (graph.error || graph.status !== 0) {
  console.error(graph.error?.message || 'CodeGraph setup failed; MCP configuration was not changed.');
  process.exit(1);
}
mkdirSync(configDir, { recursive: true });
const temporaryPath = `${configPath}.tmp`;
writeFileSync(temporaryPath, updated, 'utf8');
renameSync(temporaryPath, configPath);
console.log('Configured project-local CodeGraph and OpenAI Docs MCP in .codex/config.toml.');
console.log('Open a new Codex session in this trusted repository to load AGENTS.md, skills, and MCP settings.');
