import { spawnSync } from 'node:child_process';

/** Production build for Cloudflare Workers (OpenNext + optional Convex deploy). */
const hasConvexDeployKey = Boolean(process.env.CONVEX_DEPLOY_KEY?.trim());
const hasSelfHostedConvex =
  Boolean(process.env.CONVEX_SELF_HOSTED_URL?.trim()) &&
  Boolean(process.env.CONVEX_SELF_HOSTED_ADMIN_KEY?.trim());

const openNextBuild = 'npx opennextjs-cloudflare build';

const command =
  hasConvexDeployKey || hasSelfHostedConvex
    ? `npx convex deploy --cmd "${openNextBuild}"`
    : openNextBuild;

const result = spawnSync(command, {
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
