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


# Using Gemini CLI for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

## File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
  gemini command:

### Examples:

**Single file analysis:**
gemini -p "@src/main.py Explain this file's purpose and structure"

Multiple files:
gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"

Entire directory:
gemini -p "@src/ Summarize the architecture of this codebase"

Multiple directories:
gemini -p "@src/ @tests/ Analyze test coverage for the source code"

Current directory and subdirectories:
gemini -p "@./ Give me an overview of this entire project"

# Or use --all_files flag:
gemini --all_files -p "Analyze the project structure and dependencies"

Implementation Verification Examples

Check if a feature is implemented:
gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

Verify authentication implementation:
gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

Check for specific patterns:
gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

Verify error handling:
gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

Check for rate limiting:
gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

Verify caching strategy:
gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

Check for specific security measures:
gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"

Verify test coverage for features:
gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

When to Use Gemini CLI

Use gemini -p when:
- Analyzing entire codebases or large directories
- Comparing multiple large files
- Need to understand project-wide patterns or architecture
- Current context window is insufficient for the task
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase

Important Notes

- Paths in @ syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results