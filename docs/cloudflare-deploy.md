# Deploy on Cloudflare Workers

The Next.js app runs on Cloudflare via [@opennextjs/cloudflare](https://opennext.js.org/cloudflare). **Convex** stays on Convex Cloud (same as Vercel).

## Local commands

| Command | Purpose |
|--------|---------|
| `npm run dev` | Next + Convex (unchanged) |
| `npm run build` | Local production-style Next.js build (`next build --webpack`) |
| `npm run build:next` | Plain `next build` without OpenNext |
| `npm run build:cloudflare` | OpenNext Workers bundle; runs `convex deploy --cmd "npx opennextjs-cloudflare build"` when deploy credentials exist |
| `npm run preview` | Build + `wrangler dev` (production-like runtime) |
| `npm run deploy` | Build + deploy to Worker `yuumi-challenges` |
| `npm run test` | Run Vitest suite (supports TS/React and jsdom by default) |
| `npm run test:discover` | Discover and execute tests in CI-like mode with no-fail empty suite |
| `npm run test:run` | One-shot test run with explicit pass-through for empty test sets |

OpenNext warns on native Windows; **WSL** or **Workers Builds** (Linux) is recommended for production deploys.

## Environment variables

Set these in the Cloudflare dashboard (**Workers & Pages → yuumi-challenges → Settings → Variables**) or in **Workers Builds → Build variables and secrets**.

### Cloudflare / Next runtime

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex deployment URL used by server routes and the client |
| `NEXT_PUBLIC_SITE_URL` | Yes (prod) | `https://yuumi.quest`; used for metadata, auth redirects, and Stripe return URLs |
| `NEXT_PUBLIC_APP_URL` | Recommended | Explicit canonical origin for match share URLs and metadata |
| `YUUMI_DISCORD_SERVER_ID` | Optional | Community links / embeds |
| `RIOT_API_KEY` | Yes | Required by Next.js match APIs |
| `DISCORD_CLIENT_ID` | Yes for web auth | Discord OAuth login route |
| `DISCORD_CLIENT_SECRET` | Yes for web auth | Discord OAuth callback route |
| `AUTH_BRIDGE_SECRET` | Yes for web auth / Stripe | Shared secret for Next.js bridge calls into Convex; must exactly match the Convex environment value |
| `STRIPE_SECRET_KEY` | Yes for Supporter checkout | Stripe Checkout session creation |
| `STRIPE_WEBHOOK_SECRET` | Yes for Supporter webhooks | Stripe signature verification |

### Convex environment

Set these with `npx convex env set ...` on the target deployment:

| Variable | Required | Notes |
|----------|----------|--------|
| `RIOT_API_KEY` | Yes | Required by Convex actions that call Riot |
| `AUTH_BRIDGE_SECRET` | Yes for web auth / Stripe | Must exactly match the Cloudflare / Next runtime value |

### Build-only variables

These are only needed when a build step should deploy Convex before building the app:

| Variable | Required | Notes |
|----------|----------|--------|
| `CONVEX_DEPLOY_KEY` | Convex Cloud only | Enables `convex deploy` inside `build:cloudflare` / `build:vercel` |
| `CONVEX_SELF_HOSTED_URL` | Self-hosted Convex only | Self-hosted deployment endpoint |
| `CONVEX_SELF_HOSTED_ADMIN_KEY` | Self-hosted Convex only | Self-hosted admin key |

Public `NEXT_PUBLIC_*` and server secrets must be available at **build time** for OpenNext (see [env vars guide](https://opennext.js.org/cloudflare/howtos/env-vars#workers-builds)).

## First admin bootstrap

The admin console is backed by `convex/auth.ts` `createAdminUser`, an
internal-only one-shot mutation that refuses to run once an admin exists.

```bash
# personal dev deployment
npx convex run auth:createAdminUser '{"username":"admin","password":"change-me-now"}'

# default production deployment
npx convex run auth:createAdminUser '{"username":"admin","password":"change-me-now"}' --prod
```

If you target a non-default deployment, use `--deployment <name>` instead of
`--prod`.

## Workers Builds (GitHub)

1. Connect the repo in **Workers & Pages → Create → Workers Builds**.
2. **Build command:** `npm run build:cloudflare` (or `npx convex deploy --cmd "npx opennextjs-cloudflare build"` if Convex deploy on build is required).
3. **Deploy command:** `npx wrangler deploy` (or use `npm run deploy` as a single step if you only use manual deploy).
4. Add build variables/secrets above.

## Custom domain (yuumi.quest)

Keep custom domains **out of** `wrangler.jsonc` if an apex `A`/`CNAME` still exists (Wrangler deploy fails on `domains/records`).

1. Zone on the same account as the Worker.
2. Remove conflicting apex records, then run `npm run cf:attach-domains` (or attach in the dashboard).
3. See `docs/cloudflare-migration-checklist.md` for cutover and Vercel teardown.

## Windows local deploy

OpenNext on native Windows can produce broken bundles (`ChunkLoadError` at runtime). Local deploy uses `scripts/patch-opennext-windows.mjs` for wasm paths, but **production deploys should use GitHub Actions** (Linux).

## GitHub Actions (recommended)

Workflow: `.github/workflows/deploy-cloudflare.yml`

Add repo secret **`CLOUDFLARE_API_TOKEN`** (Workers Scripts Edit). Optional build secret **`NEXT_PUBLIC_CONVEX_URL`** if not only in `wrangler.jsonc` vars.

Run manually: **Actions → Deploy Cloudflare Workers → Run workflow**, or push to `main`.

## Full migration

See **`docs/cloudflare-migration-checklist.md`** for DNS cutover, Vercel decommission, and smoke tests.

## Vercel rollback

`npm run build:vercel` keeps the old Convex + Next Vercel build script if you need to redeploy there.
