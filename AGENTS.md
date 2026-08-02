# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: Next.js App Router routes, shared layouts, and `globals.css` styling.
- `src/components/`: Reusable React UI in PascalCase files, e.g. `LeagueProfileCard.tsx`.
- `src/lib/`: Domain utilities, API clients, and shared types; keep functions camelCase.
- `src/hooks/` & `src/contexts/`: Custom hooks (`useMatchData.ts` style) and providers.
- `public/`: Static assets delivered by Next.js; keep large media here.
- `docs/`: Architecture notes, environment setup, and contributor docs; update when adding flows.

## Build, Test, and Development Commands
- `npm run dev`: Launch Turbopack dev server; ideal for feature work.
- `npm run convex:dev`: Run the Convex dev server by itself.
- `npm run build`: Local production-style Next.js build (`next build --webpack`).
- `npm run build:cloudflare`: Build the OpenNext Cloudflare bundle; when deploy credentials are configured, Convex deploys after the bundle succeeds.
- `npm start`: Serve the built app to reproduce production behaviour.
- `npm run lint` / `npm run lint:fix`: Run ESLint and auto-fix safe issues.
- `npm run format` / `npm run format:check`: Prettier formatting (MD excluded).
- `npm run type-check`: TS diagnostics without emit.
- `npm run test` / `npm run test:run` / `npm run test:watch`: Vitest default, one-shot CI-style run, and watch mode.

## Coding Style & Naming Conventions
- Prettier enforces 2-space indent, single quotes, semicolons, width 80.
- Tailwind classes auto-sorted; keep custom utilities alphabetical.
- Components PascalCase, hooks prefixed `use`, utilities camelCase, routes kebab-case.
- Keep files ASCII unless existing content requires otherwise; one responsibility per module.
- **Always use Next.js `Image` component** instead of `<img>` tags for better performance and optimization.
- Add explicit `eslint-disable-next-line` comments when intentionally deviating from React hooks exhaustive-deps.

## Testing Guidelines
- Vitest uses `jsdom` for frontend tests under `src/**/*.{test,spec}.*` or `test/`; colocate Convex tests under `convex/**/*.{test,spec}.{ts,tsx}` (the `edge-runtime` project).
- Default validation is `npm run lint`, `npm run type-check`, and `npm run test:run`; add manual checks for guide, advanced match, and gallery flows when UI or data plumbing changes.
- Run `npm run dev` to manually validate guide, advanced match, and gallery flows.
- Name exploratory scripts clearly and clean up before committing.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`) as in git history.
- PRs must link issues (`Closes #123`), describe scope, and include UI captures for `src/app/` changes.
- Document test steps and env toggles (see the environment section in `README.md` and `docs/cloudflare-deploy.md`); ensure build, lint, and type checks pass.
- **Before committing:** Run `npm run lint`, `npm run format`, `npm run type-check`, and `npm run test:run` to ensure code quality.
- Target zero ESLint warnings and zero TypeScript errors.

## Security & Configuration Tips
- Never commit secrets; rely on `.env.local` for Riot API keys.
- Keep `AUTH_BRIDGE_SECRET` identical in both the Next.js/Cloudflare runtime and the Convex environment, or Discord auth and Stripe bridge mutations will fail.
- Confirm integrations stay within documented scopes; update `docs/` when adding new providers.

## Refactoring & Code Quality
- See `docs/refactoring-summary.md` for recent refactoring work and architectural decisions.
- Deprecated functions are marked but retained for backward compatibility until migration is complete.
- When adding new features, prefer composition over creating large monolithic components (>500 lines).
- Document complex algorithms and business logic with JSDoc comments.
