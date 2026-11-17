// scripts/build-api.mjs
// Bundles each api/*.ts handler into a self-contained CJS file for Vercel Functions.
// Runs after `tsc && vite build` as part of the full build.

import { build } from 'esbuild';
import { readdirSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const apiDir = join(root, 'api');
const outDir = join(root, 'api');

// Collect top-level api/*.ts handlers (exclude _lib/)
const entryPoints = readdirSync(apiDir)
  .filter(f => f.endsWith('.ts') && !f.startsWith('_'))
  .map(f => join(apiDir, f));

if (entryPoints.length === 0) {
  console.error('build-api: no entry points found in api/');
  process.exit(1);
}

console.log(`build-api: bundling ${entryPoints.length} functions...`);
entryPoints.forEach(ep => console.log('  -', ep));

await build({
  entryPoints,
  outdir: outDir,
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',       // Vercel Node runtime supports ESM natively
  outExtension: { '.js': '.js' },
  // Keep googleapis external — it's a large package and is in dependencies (included by Vercel)
  external: ['googleapis'],
  // Inline everything from _lib/ and src/ so there are no relative import gaps
  // (googleapis stays as a node_module dep in package.json)
  sourcemap: false,
  minify: false,
  logLevel: 'info',
  // Allow overwriting the .ts source companion .js output
  allowOverwrite: true,
});

console.log('build-api: done.');
