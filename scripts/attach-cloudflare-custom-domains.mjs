#!/usr/bin/env node
/**
 * Attach Worker custom domains after removing conflicting apex A/CNAME records.
 * Run once for cutover, or when wrangler deploy fails on domains/records.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ACCOUNT_ID =
  process.env.CLOUDFLARE_ACCOUNT_ID ?? '34ec904c07227ab237ed84e4a2043cd5';
const ZONE_ID =
  process.env.CLOUDFLARE_ZONE_ID ?? '89daf611be1495f2e4605b464850b6ed';
const ZONE_NAME = 'yuumi.quest';
const WORKER = 'yuumi-challenges';
const HOSTNAMES = ['yuumi.quest', 'www.yuumi.quest'];

const token =
  process.env.CLOUDFLARE_API_TOKEN ??
  (() => {
    try {
      const envPath = resolve(process.cwd(), '.env');
      const line = readFileSync(envPath, 'utf8')
        .split('\n')
        .find((l) => l.startsWith('CLOUDFLARE_API_TOKEN='));
      return line?.split('=').slice(1).join('=').trim();
    } catch {
      return undefined;
    }
  })();

if (!token) {
  console.error('Set CLOUDFLARE_API_TOKEN');
  process.exit(1);
}

async function cf(path, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.success) {
    const msg = json.errors?.map((e) => e.message).join('; ') ?? res.statusText;
    throw new Error(msg);
  }
  return json.result;
}

/** Delete proxied A/CNAME on apex/www that block Worker custom domains. */
async function clearConflictingRecords(hostname) {
  const records = await cf(
    `/zones/${ZONE_ID}/dns_records?per_page=100&type=A,CNAME`
  );
  const name = hostname === ZONE_NAME ? ZONE_NAME : hostname;
  for (const rec of records) {
    if (rec.name !== name) continue;
    if (rec.type !== 'A' && rec.type !== 'CNAME') continue;
    console.log(`Deleting ${rec.type} ${rec.name} → ${rec.content}`);
    await cf(`/zones/${ZONE_ID}/dns_records/${rec.id}`, { method: 'DELETE' });
  }
}

async function attach(hostname) {
  await clearConflictingRecords(hostname);
  const result = await cf(`/accounts/${ACCOUNT_ID}/workers/domains`, {
    method: 'PUT',
    body: {
      hostname,
      service: WORKER,
      zone_id: ZONE_ID,
      zone_name: ZONE_NAME,
    },
  });
  console.log(`Attached ${hostname} → ${WORKER} (${result.id})`);
}

for (const hostname of HOSTNAMES) {
  try {
    await attach(hostname);
  } catch (err) {
    if (String(err.message).includes('already exists')) {
      console.log(`Skip ${hostname}: already attached`);
      continue;
    }
    console.error(`${hostname}: ${err.message}`);
    process.exitCode = 1;
  }
}
