# Cloudflare migration checklist (yuumi.quest)

## Done in repo

- [x] OpenNext + `wrangler.jsonc` for Worker `yuumi-challenges`
- [x] GitHub Actions: `.github/workflows/deploy-cloudflare.yml` (Linux build + deploy)
- [x] GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `NEXT_PUBLIC_CONVEX_URL`
- [x] Worker runtime secrets via `npm run sync:cf-secrets`
- [x] Custom domains attached via API / `npm run cf:attach-domains` (not in `wrangler.jsonc` — avoids CI deploy failures when apex A record conflicts)
- [x] Convex stays at `https://convex-yuumi-challenges.veiledcat.de` (self-hosted)

## After each push to `main`

GitHub Actions builds with `NEXT_PUBLIC_CONVEX_URL` and deploys with `--keep-vars`.

## Manual steps (one-time)

### 1. Cloudflare Workers Builds (optional, dashboard)

If you use **Workers & Pages → yuumi-challenges → Builds**:

| Setting | Value |
|---------|--------|
| Build command | `npm run build:cloudflare` |
| Deploy command | `npx opennextjs-cloudflare deploy -- --keep-vars` |
| Build variables | `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL` |

Or rely on GitHub Actions only and disable duplicate Builds.

### 2. Convex production env

In Convex dashboard for self-hosted deployment, ensure **`RIOT_API_KEY`** is set (Convex `highelo.ts` uses it).

### 3. Cut over DNS (one-time)

Cloudflare **rejects** Worker custom domains while a manual apex `A`/`CNAME` exists (error 100117).

```bash
# Requires CLOUDFLARE_API_TOKEN (Workers + Zone DNS Edit)
npm run cf:attach-domains
```

Or dashboard: **Workers & Pages → yuumi-challenges → Domains** after deleting the Vercel apex `A` record.

Verify: `curl -sI https://yuumi.quest/` → `200`, `server: cloudflare`

### 4. Decommission Vercel

1. Remove Vercel project domain binding (or delete project after cutover)
2. Revoke unused Vercel env / OIDC if no longer needed
3. Keep `npm run build:vercel` only for emergency rollback

### 5. Smoke test

- `https://yuumi.quest/` — guide home
- `https://yuumi.quest/games` — Convex high-elo feed
- `https://yuumi.quest/match` — match viewer
- Discord embed / OG image on a match or profile URL

## Rollback

Redeploy on Vercel with `npm run build:vercel` and point `yuumi.quest` DNS back to Vercel.