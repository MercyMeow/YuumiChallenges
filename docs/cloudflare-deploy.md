# Deploy on Cloudflare Workers

The Next.js app runs on Cloudflare via [@opennextjs/cloudflare](https://opennext.js.org/cloudflare). **Convex** stays on Convex Cloud (same as Vercel).

## Local commands

| Command | Purpose |
|--------|---------|
| `npm run dev` | Next + Convex (unchanged) |
| `npm run build:next` | Next-only production build |
| `npm run build:cloudflare` | OpenNext bundle for Workers |
| `npm run preview` | Build + `wrangler dev` (production-like runtime) |
| `npm run deploy` | Build + deploy to Worker `yuumi-challenges` |

OpenNext warns on native Windows; **WSL** or **Workers Builds** (Linux) is recommended for production deploys.

## Environment variables

Set these in the Cloudflare dashboard (**Workers & Pages → yuumi-challenges → Settings → Variables**) or in **Workers Builds → Build variables and secrets**:

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex deployment URL |
| `NEXT_PUBLIC_SITE_URL` | Yes (prod) | `https://yuumi.quest` |
| `NEXT_PUBLIC_APP_URL` | Recommended | Same as site URL for OG/metadata |
| `RIOT_API_KEY` | Yes | Server-only; match API routes |
| `CONVEX_DEPLOY_KEY` | CI only | If build runs `convex deploy` |
| `YUUMI_DISCORD_SERVER_ID` | Optional | Discord embeds |

Public `NEXT_PUBLIC_*` and server secrets must be available at **build time** for OpenNext (see [env vars guide](https://opennext.js.org/cloudflare/howtos/env-vars#workers-builds)).

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