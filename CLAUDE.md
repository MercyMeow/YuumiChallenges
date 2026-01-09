# CLAUDE.md - AI Assistant Guide for YuumiChallenges

This document provides comprehensive guidance for AI assistants working on this codebase.

## Project Overview

**YuumiChallenges** is a Next.js 15 web application featuring a comprehensive League of Legends Yuumi support guide, match viewer, and rule GIF gallery. The application uses Convex as a real-time backend database for managing guide content through an admin panel.

### Core Features

- **Yuumi Guide** - Runes, items, skill orders, matchups, and synergies for the current patch
- **Match Viewer** - Detailed match analysis with timeline data via Riot API or example payloads
- **Rule Gallery** - Discord-shareable rule GIFs at `/gallery`
- **Admin Panel** - Authenticated content management for guide data at `/admin`
- **Data Scraper** - Tools to import data from external sources (U.GG, OP.GG, etc.)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.3.5 (App Router, Turbopack) |
| Language | TypeScript 5.x (strict mode) |
| Backend | Convex (real-time database & functions) |
| Styling | Tailwind CSS 3.x + tailwindcss-animate |
| UI Components | Radix UI primitives + custom components |
| Forms | React Hook Form + Zod validation |
| State | React Context (Auth, Theme) + Convex queries |
| Runtime | Node.js 18+ |

## Directory Structure

```
YuumiChallenges/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (match-details proxy)
│   │   ├── admin/             # Admin panel routes
│   │   │   ├── builds/        # Unified builds management
│   │   │   ├── items/         # Item configuration
│   │   │   ├── login/         # Admin authentication
│   │   │   └── scraper/       # Data import tools
│   │   ├── gallery/           # Rule GIF gallery
│   │   ├── match/             # Match viewer
│   │   ├── rule[id].gif/      # Dynamic rule routes
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Main Yuumi guide (home)
│   │   └── globals.css        # Global styles + Tailwind
│   ├── components/
│   │   ├── match-history/     # Match display components
│   │   └── ui/                # Reusable UI primitives (shadcn-style)
│   ├── contexts/              # React Context providers
│   │   ├── AuthContext.tsx    # Admin authentication state
│   │   └── theme-context.tsx  # Theme management
│   ├── lib/
│   │   ├── api/               # API utilities and helpers
│   │   ├── apis/              # External API clients
│   │   ├── builds/            # Build configuration logic
│   │   ├── cache/             # Caching utilities
│   │   ├── champions/         # Champion data helpers
│   │   ├── embeds/            # Discord embed configurations
│   │   ├── hooks/             # Custom React hooks
│   │   ├── matchups/          # Matchup data (adcs/, supports/)
│   │   ├── runes/             # Rune data and mappings
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # General utility functions
│   └── providers/             # Client-side provider wrappers
├── convex/                    # Convex backend
│   ├── _generated/            # Auto-generated Convex types
│   ├── schema.ts              # Database schema definitions
│   ├── auth.ts                # Authentication functions
│   ├── guide.ts               # Guide CRUD operations
│   └── scraper.ts             # Data scraping functions
├── public/                    # Static assets
│   ├── images/                # Champion, rune, item images
│   │   └── ranked/            # Rank emblems
│   └── rule*.gif              # Rule GIF files
└── docs/                      # Documentation
```

## Development Workflow

### Essential Commands

```bash
# Development (runs both Next.js and Convex)
npm run dev

# Next.js only (when Convex isn't needed)
npm run dev:next

# Convex dev server only
npm run dev:convex

# Production build (deploys Convex first)
npm run build

# Code quality
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix lint issues
npm run format        # Format with Prettier
npm run format:check  # Check formatting
npm run type-check    # TypeScript validation
```

### Environment Variables

Create `.env.local` from `.env.example`:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Base URL for link generation |
| `NEXT_PUBLIC_USE_EXAMPLE_DATA` | Toggle static vs live match data |
| `RIOT_API_KEY` | Required for live Riot API requests |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL |
| `CONVEX_DEPLOY_KEY` | Convex deployment key (production) |

## Code Conventions

### File Naming

- **Components**: PascalCase (`LeagueProfileCard.tsx`, `RuneDisplay.tsx`)
- **Hooks**: camelCase with `use` prefix (`useMatchData.ts`, `usePerformanceMonitor.ts`)
- **Utilities**: camelCase (`matchups.ts`, `summonerSpells.ts`)
- **Routes**: kebab-case directories (`match-details/`, `rule[id].gif/`)
- **Types**: Kept in `src/lib/types/index.ts` or co-located with modules

### Styling

- Prettier config: 2-space indent, single quotes, semicolons, 80 char width
- Tailwind classes auto-sorted via `prettier-plugin-tailwindcss`
- Custom utilities kept alphabetical in `globals.css`
- Dark mode is default (forced via `html.dark` class)

### TypeScript

The project uses very strict TypeScript settings:

- `noUncheckedIndexedAccess`: true
- `noImplicitAny`: true
- `noUnusedLocals` / `noUnusedParameters`: true
- `exactOptionalPropertyTypes`: true
- Path alias: `@/*` maps to `./src/*`

### Component Patterns

```typescript
// UI components follow shadcn/ui patterns with CVA
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva('base-classes', {
  variants: { variant: { default: '...', outline: '...' } },
});

export function Button({ className, variant, ...props }) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
```

### Data Dragon Images

Use the `DataDragonImage` component for League assets:

```tsx
import { DataDragonImage } from '@/components/ui/datadragon-image';

<DataDragonImage
  type="champion"
  identifier="Yuumi"
  size={48}
  className="rounded-full"
/>
```

## Convex Backend

### Schema Overview (convex/schema.ts)

| Table | Purpose |
|-------|---------|
| `users` | Admin accounts (username, passwordHash, role) |
| `sessions` | Auth session tokens |
| `guideBuilds` | Unified builds (runes + items + skill order) |
| `guideItems` | Individual item configurations |
| `guideRunes` | Rune page configurations |
| `guideSkillOrder` | Skill leveling orders (legacy) |
| `guideMatchups` | Champion matchup data (enemy/ally) |
| `guideSections` | Text content sections |
| `guideMetadata` | Key-value config (patch, etc.) |
| `scrapedData` | Imported external data |
| `scrapeJobs` | Scrape job logs |

### Key Patterns

**Queries** (read data):
```typescript
// convex/guide.ts
export const getBuilds = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('guideBuilds')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();
  },
});
```

**Mutations** (write data with auth):
```typescript
export const upsertBuild = mutation({
  args: { sessionToken: v.string(), /* ...data */ },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');
    // ... perform mutation
  },
});
```

**Using in React**:
```tsx
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

function Component() {
  const builds = useQuery(api.guide.getBuilds);
  const upsertBuild = useMutation(api.guide.upsertBuild);
}
```

### Regenerating Types

When schema changes, types auto-regenerate during `npm run dev`. For manual regeneration:

```bash
npx convex dev --once
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main Yuumi guide content (~32K lines) |
| `src/app/layout.tsx` | Root layout, metadata, providers |
| `convex/schema.ts` | Database schema definitions |
| `convex/guide.ts` | Guide CRUD operations |
| `src/lib/embeds/yuumi.ts` | Discord embed configuration |
| `src/lib/types/index.ts` | Shared TypeScript types |
| `src/components/ui/datadragon-image.tsx` | League asset image component |
| `tailwind.config.ts` | Tailwind + custom theme config |

## Common Tasks

### Adding a New UI Component

1. Create in `src/components/ui/` following existing patterns
2. Use Radix primitives where applicable
3. Export from component file directly
4. Apply `cn()` utility for class merging

### Modifying Guide Data

**Via Code** (static): Edit constants in `src/app/page.tsx`

**Via Admin Panel** (dynamic):
1. Navigate to `/admin/login`
2. Authenticate
3. Use `/admin/builds`, `/admin/items`, or `/admin/scraper`

### Adding API Routes

Create route handlers in `src/app/api/[route]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Handle GET
  return NextResponse.json({ data: '...' });
}
```

### Working with Match Data

- Example data: Set `NEXT_PUBLIC_USE_EXAMPLE_DATA=true`
- Live data: Requires `RIOT_API_KEY` environment variable
- Match route: `/match/{REGION}_{MATCH_ID}`

## Testing & Validation

No unit test framework currently configured. Validate changes via:

1. `npm run lint` - ESLint checks
2. `npm run type-check` - TypeScript validation
3. `npm run build` - Production build verification
4. Manual testing in `npm run dev`

### Pre-commit Checklist

- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] `npm run format:check` passes
- [ ] Manual verification of affected routes
- [ ] UI changes tested in both light/dark modes (if applicable)

## Commit Conventions

Follow Conventional Commits format:

- `feat:` - New features
- `fix:` - Bug fixes
- `chore:` - Maintenance tasks
- `docs:` - Documentation updates
- `refactor:` - Code refactoring
- `style:` - Formatting changes

Example: `feat: Add Guardian rune page to builds system`

## Security Notes

- Never commit `.env*` files or API keys
- Admin auth uses session tokens stored in Convex
- Riot API key is server-side only (not exposed to client)
- Password hashing handled in `convex/auth.ts`

## External Data Sources

The guide aggregates data from:
- Lolalytics
- U.GG
- OP.GG
- Mobalytics
- OneTricks community

Scraper configurations in `convex/scraper.ts` handle imports.

## Image Assets

- **Data Dragon CDN**: `https://ddragon.leagueoflegends.com/cdn/...`
- **Local assets**: `public/images/` and `public/rule*.gif`
- **Remote patterns**: Configured in `next.config.ts` for Discord, Data Dragon, GitHub raw

## Troubleshooting

### Convex Types Not Found

Run `npx convex dev` to regenerate `convex/_generated/` types.

### Build Errors

The project temporarily ignores TypeScript and ESLint errors during build (`next.config.ts`). Run `npm run type-check` and `npm run lint` locally to catch issues.

### Environment Variables Not Working

Ensure variables prefixed with `NEXT_PUBLIC_` for client-side access. Restart dev server after changes.

---

*Last updated: January 2026*
