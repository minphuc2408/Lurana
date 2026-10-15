import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const sourceRoot = path.resolve('src');
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]
  );
}
function resolve(file, specifier) {
  const base = specifier.startsWith('@/') ? path.join(sourceRoot, specifier.slice(2))
    : specifier.startsWith('.') ? path.resolve(path.dirname(file), specifier) : null;
  return base && [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}
const errors = [];
const sourceFiles = files(sourceRoot).filter(file => /\.[tj]sx?$/.test(file));
for (const file of sourceFiles) {
  const relative = path.relative(sourceRoot, file).replaceAll('\\', '/');
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const feature = relative.match(/^features\/([^/]+)\//)?.[1];
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const target = resolve(file, node.moduleSpecifier.text);
      if (target) {
        const targetPath = path.relative(sourceRoot, target).replaceAll('\\', '/');
        if (relative.startsWith('shared/') && /^(app|pages|features)\//.test(targetPath)) errors.push(`${relative}: shared imports ${targetPath}`);
        if (feature && /^(app|pages)\//.test(targetPath)) errors.push(`${relative}: feature imports ${targetPath}`);
        const targetFeature = targetPath.match(/^features\/([^/]+)\//)?.[1];
        if (targetFeature && targetFeature !== feature && targetPath !== `features/${targetFeature}/index.ts`) errors.push(`${relative}: use public API for ${targetFeature}`);
      } else if (node.moduleSpecifier.text.startsWith('@/') || node.moduleSpecifier.text.startsWith('.')) errors.push(`${relative}: unresolved ${node.moduleSpecifier.text}`);
    }
    if (ts.isJsxAttribute(node) && node.name.text === 'style' && /^(features|pages|app\/layouts)\//.test(relative)) errors.push(`${relative}: inline page/component style`);
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const name = node.expression.text;
      if (name === 'fetch' && (/^pages\//.test(relative) || /^features\/[^/]+\/components\//.test(relative))) errors.push(`${relative}: move API calls to a feature service`);
      if (relative.startsWith('pages/') && /^(useState|useReducer|useEffect|useContext)$/.test(name)) errors.push(`${relative}: move state/effects to a feature hook`);
      if (/^features\/[^/]+\/components\//.test(relative) && /^(useState|useReducer|useEffect|useContext)$/.test(name)) errors.push(`${relative}: presentation owns state/effects`);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log(`Architecture checked: ${sourceFiles.length} source files; layer boundaries, public APIs, presentation state, and Tailwind page styles.`);
