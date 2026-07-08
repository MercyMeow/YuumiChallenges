import { spawnSync } from 'node:child_process';

/** Runs Convex+Next production build when configured; otherwise Next-only (e.g. PR previews). */
const hasConvexDeployKey = Boolean(process.env.CONVEX_DEPLOY_KEY?.trim());
const hasSelfHostedConvex =
  Boolean(process.env.CONVEX_SELF_HOSTED_URL?.trim()) &&
  Boolean(process.env.CONVEX_SELF_HOSTED_ADMIN_KEY?.trim());

const command =
  hasConvexDeployKey || hasSelfHostedConvex
    ? 'npx convex deploy --cmd "next build"'
    : 'npm run build:next';

const result = spawnSync(command, {
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
