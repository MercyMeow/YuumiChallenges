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
- `npm run build`: Production build validation before PR merge.
- `npm start`: Serve the built app to reproduce production behaviour.
- `npm run lint` / `npm run lint:fix`: Run ESLint and auto-fix safe issues.
- `npm run format` / `npm run format:check`: Prettier formatting (MD excluded).
- `npm run type-check`: TS diagnostics without emit.

## Coding Style & Naming Conventions
- Prettier enforces 2-space indent, single quotes, semicolons, width 80.
- Tailwind classes auto-sorted; keep custom utilities alphabetical.
- Components PascalCase, hooks prefixed `use`, utilities camelCase, routes kebab-case.
- Keep files ASCII unless existing content requires otherwise; one responsibility per module.

## Testing Guidelines
- No unit-test framework yet; focus on lint + type-check gates.
- Run `npm run dev` to manually validate guide, advanced match, and gallery flows.
- Name exploratory scripts clearly and clean up before committing.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`) as in git history.
- PRs must link issues (`Closes #123`), describe scope, and include UI captures for `src/app/` changes.
- Document test steps and env toggles (see `docs/environment-variables.md`); ensure build, lint, and type checks pass.

## Security & Configuration Tips
- Never commit secrets; rely on `.env.local` for Riot API keys.
- Confirm integrations stay within documented scopes; update `docs/` when adding new providers.
