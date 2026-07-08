import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

if (os.platform() !== 'win32') {
  console.log('Skipping Windows wasm patch on', os.platform());
  process.exit(0);
}

const ROOT = path.resolve(import.meta.dirname, '..');
const handlerPath = path.join(
  ROOT,
  '.open-next/server-functions/default/handler.mjs'
);

if (!fs.existsSync(handlerPath)) {
  console.error('Missing handler.mjs — run npm run build:cloudflare first');
  process.exit(1);
}

let content = fs.readFileSync(handlerPath, 'utf8');

const replacements = [
  [
    /D:\/YuumiChallenges\/\.open-next\/server-functions\/default\/\.next\/server\/chunks\/YuumiChallenges\.open-nextserver-functionsdefault\\node_modules\\nextdistcompiled@vercelog\\resvg\.wasm/g,
    './node_modules/next/dist/compiled/@vercel/og/resvg.wasm',
  ],
  [
    /D:\/YuumiChallenges\/\.open-next\/server-functions\/default\/\.next\/server\/chunks\/YuumiChallenges\.open-nextserver-functionsdefault\\node_modules\\nextdistcompiled@vercelogyoga\.wasm/g,
    './node_modules/next/dist/compiled/@vercel/og/yoga.wasm',
  ],
  [
    /D:\/YuumiChallenges\/\.open-next\/server-functions\/default\/\.next\/server\/chunks\/ssr\/YuumiChallenges\.open-nextserver-functionsdefault\\node_modules\\nextdistcompiled@vercelog\\resvg\.wasm/g,
    './node_modules/next/dist/compiled/@vercel/og/resvg.wasm',
  ],
  [
    /D:\/YuumiChallenges\/\.open-next\/server-functions\/default\/\.next\/server\/chunks\/ssr\/YuumiChallenges\.open-nextserver-functionsdefault\\node_modules\\nextdistcompiled@vercelogyoga\.wasm/g,
    './node_modules/next/dist/compiled/@vercel/og/yoga.wasm',
  ],
];

let changed = 0;
for (const [pattern, replacement] of replacements) {
  const before = content;
  content = content.replace(pattern, replacement);
  if (content !== before) changed += 1;
}

if (changed === 0) {
  console.log('No Windows wasm paths to patch (already OK or Linux build)');
} else {
  fs.writeFileSync(handlerPath, content, 'utf8');
  console.log(`Patched ${changed} wasm import path group(s) in handler.mjs`);
}
