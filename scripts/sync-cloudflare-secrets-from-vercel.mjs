import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const BULK_FILE = path.join(ROOT, '.tmp-cf-secrets.json');
const WRANGLER_PATH = path.join(ROOT, 'wrangler.jsonc');

const SECRET_KEYS = new Set([
  'RIOT_API_KEY',
  'DISCORD_BOT_TOKEN',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'NEXTAUTH_SECRET',
  'CONVEX_DEPLOY_KEY',
  'CONVEX_SELF_HOSTED_URL',
  'CONVEX_SELF_HOSTED_ADMIN_KEY',
]);

const VAR_KEYS = new Set([
  'NEXT_PUBLIC_CONVEX_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SITE_URL',
  'YUUMI_DISCORD_SERVER_ID',
  'NEXTAUTH_URL',
  'NODE_ENV',
]);

const SKIP_PREFIXES = ['VERCEL_', 'TURBO_', 'NX_'];

function parseDotenv(content) {
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function loadMergedEnv() {
  const merged = {};
  for (const file of ['.env.vercel.pull', '.env']) {
    const p = path.join(ROOT, file);
    if (!fs.existsSync(p)) continue;
    const parsed = parseDotenv(fs.readFileSync(p, 'utf8'));
    for (const [key, value] of Object.entries(parsed)) {
      if (value !== '') merged[key] = value;
    }
  }
  return merged;
}

const env = loadMergedEnv();
const secrets = {};
const vars = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_SITE_URL: 'https://yuumi.quest',
  NEXT_PUBLIC_APP_URL: 'https://yuumi.quest',
  NEXTAUTH_URL: 'https://yuumi.quest',
};

for (const [key, value] of Object.entries(env)) {
  if (SKIP_PREFIXES.some((p) => key.startsWith(p)) || value === '') continue;
  if (SECRET_KEYS.has(key)) secrets[key] = value;
  else if (VAR_KEYS.has(key)) vars[key] = value;
}

if (!secrets.RIOT_API_KEY) {
  console.error('Missing RIOT_API_KEY');
  process.exit(1);
}
if (!vars.NEXT_PUBLIC_CONVEX_URL) {
  console.error('Missing NEXT_PUBLIC_CONVEX_URL (check .env)');
  process.exit(1);
}

fs.writeFileSync(BULK_FILE, JSON.stringify(secrets), 'utf8');

const whoami = spawnSync('npx', ['wrangler', 'whoami'], {
  cwd: ROOT,
  encoding: 'utf8',
  shell: true,
});

if (!whoami.stdout?.includes('You are logged in')) {
  console.error('Run: npx wrangler login');
  fs.unlinkSync(BULK_FILE);
  process.exit(1);
}

const bulk = spawnSync(
  'npx',
  ['wrangler', 'secret', 'bulk', BULK_FILE, '--name', 'yuumi-challenges'],
  { cwd: ROOT, stdio: 'inherit', shell: true }
);

fs.unlinkSync(BULK_FILE);

if (bulk.status !== 0) {
  process.exit(bulk.status ?? 1);
}

const wranglerJsonc = `{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "yuumi-challenges",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-07-08",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "observability": {
    "enabled": true
  },
  "vars": ${JSON.stringify(vars, null, 2)}
}
`;

fs.writeFileSync(WRANGLER_PATH, wranglerJsonc, 'utf8');

console.log('Secrets uploaded:', Object.keys(secrets).join(', '));
console.log('wrangler.jsonc vars:', Object.keys(vars).join(', '));
