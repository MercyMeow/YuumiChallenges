import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Windows OpenNext builds embed machine-absolute import specifiers (wasm,
 * fonts) in handler.mjs. Wrangler uploads the server-function modules
 * unbundled, so workerd can never resolve those specifiers at runtime and
 * the whole worker 500s. Rewrite them relative to handler.mjs.
 */
if (os.platform() !== 'win32') {
  console.log('Skipping Windows wasm patch on', os.platform());
  process.exit(0);
}

const ROOT = path.resolve(import.meta.dirname, '..');
const serverFunctionsDir = path.join(
  ROOT,
  '.open-next/server-functions/default'
);
const handlerPath = path.join(serverFunctionsDir, 'handler.mjs');

if (!fs.existsSync(handlerPath)) {
  console.error('Missing handler.mjs — run npm run build:cloudflare first');
  process.exit(1);
}

let content = fs.readFileSync(handlerPath, 'utf8');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Forward-slash form of the absolute server-functions dir, as it appears
// inside import specifiers (e.g. "D:/YuumiChallenges/.open-next/...").
const absPrefix = `${serverFunctionsDir.replace(/\\/g, '/')}/`;
// Mangled form Turbopack produces for wasm chunk keys on Windows, e.g.
// "YuumiChallenges.open-nextserver-functionsdefault\node_modules..." —
// path separators collapsed, mixed backslashes.
const mangledPrefix = `${path.basename(ROOT)}.open-nextserver-functionsdefault`;

const replacements = [
  // Any absolute reference into the server-functions dir -> relative.
  [new RegExp(escapeRegExp(absPrefix), 'g'), './'],
  // Chunk-key variants that route through .next/server/chunks before the
  // mangled segment (with or without the ssr/ level).
  [
    new RegExp(
      `\\./\\.next/server/chunks/(?:ssr/)?${escapeRegExp(mangledPrefix)}\\\\?node_modules\\\\?nextdistcompiled@vercelog\\\\?resvg\\.wasm`,
      'g'
    ),
    './node_modules/next/dist/compiled/@vercel/og/resvg.wasm',
  ],
  [
    new RegExp(
      `\\./\\.next/server/chunks/(?:ssr/)?${escapeRegExp(mangledPrefix)}\\\\?node_modules\\\\?nextdistcompiled@vercelog\\\\?yoga\\.wasm`,
      'g'
    ),
    './node_modules/next/dist/compiled/@vercel/og/yoga.wasm',
  ],
  // Wrangler resolves uploaded modules by plain path — drop the ?module
  // suffix (it never matches an uploaded module name).
  [/\.wasm\?module/g, '.wasm'],
];

let changed = 0;
for (const [pattern, replacement] of replacements) {
  const before = content;
  content = content.replace(pattern, replacement);
  if (content !== before) changed += 1;
}

// Populate the Turbopack requireChunk stub. OpenNext's chunk enumeration
// finds no JS chunks on Windows (Turbopack's bracketed filenames plus
// backslash separators defeat its glob), so it leaves a stub that throws
// "Not found <chunk>" and every route 500s with ChunkLoadError. Generate
// the switch it should have produced: literal require() per chunk file,
// which wrangler's esbuild pass then statically bundles into the worker.
const serverRoot = path.join(serverFunctionsDir, '.next/server');
const chunkFiles = [];
(function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(entryPath);
    else if (entry.name.endsWith('.js')) chunkFiles.push(entryPath);
  }
})(path.join(serverRoot, 'chunks'));

// Chunk files carry the same machine-mangled wasm/font specifiers; once
// requireChunk pulls them into the esbuild graph, unresolvable specifiers
// fail the whole build. Rewrite them relative to each chunk file.
const ogDir = path.join(
  serverFunctionsDir,
  'node_modules/next/dist/compiled/@vercel/og'
);
let chunksPatched = 0;
for (const file of chunkFiles) {
  const original = fs.readFileSync(file, 'utf8');
  if (!/\.wasm|\.ttf\.bin/.test(original)) continue;
  const rel = path.relative(path.dirname(file), ogDir).replace(/\\/g, '/');
  const patched = original
    .replace(
      /(["'`])[^"'`]*resvg\.wasm(?:\?module)?\1/g,
      (_, quote) => `${quote}${rel}/resvg.wasm${quote}`
    )
    .replace(
      /(["'`])[^"'`]*yoga\.wasm(?:\?module)?\1/g,
      (_, quote) => `${quote}${rel}/yoga.wasm${quote}`
    )
    .replace(
      /(["'`])[^"'`]*Geist-Regular\.ttf\.bin\1/g,
      (_, quote) => `${quote}${rel}/Geist-Regular.ttf.bin${quote}`
    );
  if (patched !== original) {
    fs.writeFileSync(file, patched, 'utf8');
    chunksPatched += 1;
  }
}
if (chunksPatched > 0) {
  console.log(`Patched wasm/font specifiers in ${chunksPatched} chunk file(s)`);
}

const stub =
  'function requireChunk(chunkPath){throw new Error(`Not found ${chunkPath}`)}';
if (content.includes(stub) && chunkFiles.length > 0) {
  const cases = chunkFiles
    .map((file) => {
      const key = `server/${path.relative(serverRoot, file).replace(/\\/g, '/')}`;
      const requirePath = `./.next/${key}`;
      return `case ${JSON.stringify(key)}:return require(${JSON.stringify(requirePath)});`;
    })
    .join('');
  content = content.replaceAll(
    stub,
    `function requireChunk(chunkPath){switch(chunkPath){${cases}default:throw new Error(\`Not found \${chunkPath}\`)}}`
  );
  changed += 1;
  console.log(`Generated requireChunk switch for ${chunkFiles.length} chunks`);
}

if (changed === 0) {
  console.log('No Windows paths to patch (already OK or Linux build)');
} else {
  fs.writeFileSync(handlerPath, content, 'utf8');
  console.log(`Patched ${changed} import path group(s) in handler.mjs`);
}

// Fail loudly if anything absolute survived — deploying it would 500.
const leftover = content.match(
  new RegExp(escapeRegExp(absPrefix.slice(0, -1)), 'g')
);
if (leftover) {
  console.error(
    `ERROR: ${leftover.length} absolute path(s) still in handler.mjs — deploy would break`
  );
  process.exit(1);
}
