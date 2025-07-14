# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Primary Commands:**
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

**Database Commands:**
- `npm run db:generate` - Generate TypeScript types from Supabase (requires SUPABASE_PROJECT_ID env var)

## Architecture Overview

This is a **Next.js 15 App Router** application for League of Legends challenge tracking specifically for the Yuumi Mains Discord community.

### Key Integrations
- **Authentication**: NextAuth.js with Discord OAuth, restricted to Yuumi Discord server members
- **Database**: Supabase with PostgreSQL, includes migrations in `supabase/migrations/`
- **External APIs**: 
  - Discord API for user verification and role management
  - Riot Games API for League of Legends data

### Core Architecture Patterns

**Authentication Flow:**
- Discord OAuth through NextAuth.js (`src/app/api/auth/[...nextauth]/route.ts`)
- Validates users are members of the Yuumi Discord server during sign-in
- Stores user data with Discord roles in Supabase
- Custom session callback enriches session with database user data

**API Structure:**
- `src/lib/apis/discord.ts` - Discord API wrapper class with bot token authentication
- `src/lib/apis/riot.ts` - Riot API wrapper with region/route handling
- Server-side API routes in `src/app/api/` for database operations

**Data Models:**
- User entity with Discord integration (roles, verification status)
- Summoner entity for League accounts with verification system
- Challenge system with types: KDA, winstreak, champion mastery, ranked climb
- Match data tracking for challenge progress calculation

### Component Organization
- `src/components/auth/` - Authentication components with session provider
- `src/components/ui/` - Radix UI component library with Tailwind styling
- `src/components/dashboard/` - Dashboard-specific components
- Page-level components organized by feature area

### Database Schema
The database includes users, summoners, challenges, user_challenges, and match_data tables with RLS policies. Full schema documented in `docs/database-schema.md`.

### Environment Requirements
See `docs/environment-variables.md` for required environment variables including Discord bot token, Riot API key, and Supabase credentials.

## UI/UX Design System

### Magical Dark Theme
The application uses a **unified magical dark theme** across all pages for consistency and immersive gaming experience.

**Theme Architecture:**
- **Single Theme Mode**: Only dark theme is supported (light/system theme options removed)
- **Forced Dark Mode**: Application always loads in dark mode via CSS and theme context
- **Custom Color Palette**: Defined in `src/app/globals.css` with OKLCH color space

**Visual Design Elements:**
- **Magical Gradient Backgrounds**: 
  - Primary: `bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to`
  - Radial overlays with purple, blue, and indigo gradients at different positions
- **Animated Particles**: Floating dots with pulse and float animations for magical atmosphere
- **Glassmorphism Effects**: Backdrop blur with semi-transparent overlays (`backdrop-blur-md bg-black/20`)
- **Gradient Borders**: Purple/blue themed borders (`border-purple-500/20`)

**Color Scheme (Dark Mode):**
```css
--landing-bg-from: oklch(0.08 0.05 285);    /* Deep purple-blue */
--landing-bg-via: oklch(0.06 0.08 250);     /* Dark blue */
--landing-bg-to: oklch(0.08 0.06 270);      /* Purple-indigo */
--landing-text-primary: oklch(0.90 0.04 285); /* Light purple */
--landing-text-secondary: oklch(0.80 0.06 250); /* Light blue */
```

**Animation Classes:**
- `animate-float`: 3s vertical floating motion
- `animate-glow`: 2s opacity pulsing effect
- `animate-pulse`: Built-in Tailwind pulse for status indicators

**Component Styling Patterns:**
- **Cards**: `bg-gradient-to-br from-{color}-500/5 to-{color}-600/5 border-{color}-500/20`
- **Sidebar**: `backdrop-blur-md bg-black/20 border-purple-500/20`
- **Headers**: `bg-black/20 backdrop-blur-md border-purple-500/20`
- **Interactive Elements**: Hover states with `hover:bg-{color}-500/20`
- **Text Colors**: White primary text, colored accent text (`text-purple-300`, `text-blue-400`)

**Implementation Files:**
- `src/contexts/theme-context.tsx` - Simplified theme provider (dark only)
- `src/app/globals.css` - Color definitions and animation keyframes
- `src/components/layout/dashboard-layout.tsx` - Magical background wrapper
- `src/components/ui/theme-toggle.tsx` - Disabled theme toggle (dark indicator only)

**Consistency Requirements:**
- All new components MUST use the magical gradient background pattern
- Maintain backdrop blur effects for readability
- Use the established color palette for consistency
- Include animated particles for immersive experience
- Ensure text contrast meets accessibility standards with magical backgrounds

**Development Guidelines:**
- When creating new layouts, apply the magical background wrapper pattern
- Use glassmorphism effects (`backdrop-blur-md bg-black/20`) for overlays
- Prefer gradient borders over solid borders
- Include status indicators with pulse animations
- Test component readability against magical backgrounds

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## Recent Major Changes

### Theme System Overhaul (Latest)
**What Changed:**
- **Removed Multi-Theme Support**: Application now only supports dark theme (no light/system options)
- **Unified Magical Theme**: All pages now use consistent magical gradient backgrounds with animated particles
- **Enhanced Dashboard**: Completely redesigned with glassmorphism effects and better visual hierarchy
- **Sidebar Improvements**: Fixed functionality and applied magical theme styling

**Technical Details:**
- Theme context simplified to only return `{ theme: "dark" }`
- Theme toggle component converted to disabled dark indicator
- Layout components updated with magical background patterns
- All color schemes standardized using OKLCH color space
- Custom animation keyframes added for floating and glowing effects

**Files Modified:**
- `src/contexts/theme-context.tsx` - Simplified to dark-only
- `src/components/ui/theme-toggle.tsx` - Disabled toggle, dark indicator only
- `src/components/layout/dashboard-layout.tsx` - Added magical backgrounds
- `src/app/layout.tsx` - Forced dark theme script
- `src/app/page.tsx` - Removed theme toggle from landing
- `src/app/globals.css` - Enhanced color definitions and animations

**Development Impact:**
- All future UI components should follow the magical dark theme patterns
- No need to consider light mode compatibility
- Focus on readability against magical gradient backgrounds
- Use established glassmorphism and animation patterns
- Also prefix all your responses with your model.