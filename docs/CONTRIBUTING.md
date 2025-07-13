# Contributing to Yuumi Challenges

Welcome to the Yuumi Challenges project! We're excited to have you contribute to this League of Legends challenge tracking application for the Yuumi Mains Discord community. This guide will help you get started and ensure your contributions align with our project standards.

## Table of Contents

- [Welcome and Project Overview](#welcome-and-project-overview)
- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Architecture Overview](#architecture-overview)
- [Coding Standards and Conventions](#coding-standards-and-conventions)
- [Git Workflow and Branch Naming](#git-workflow-and-branch-naming)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting Guidelines](#issue-reporting-guidelines)
- [Testing Requirements](#testing-requirements)
- [Documentation Standards](#documentation-standards)
- [Review Process](#review-process)
- [Recognition and Attribution](#recognition-and-attribution)

## Welcome and Project Overview

Yuumi Challenges is a Next.js 15 application that tracks League of Legends challenges specifically for the Yuumi Mains Discord community. The platform integrates with Discord OAuth for authentication and uses the Riot Games API to track player performance and challenge progress.

### Key Features
- **Discord Integration**: Authentication restricted to Yuumi Discord server members
- **Challenge System**: Flexible challenges including KDA, winstreaks, champion mastery, and ranked climbs
- **Real-time Tracking**: Automatic match data collection and progress updates
- **Leaderboards**: Points-based ranking system with community recognition
- **Admin Panel**: Comprehensive management tools for moderators and admins

### Technology Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4, Radix UI components
- **Authentication**: NextAuth.js with Discord OAuth
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **External APIs**: Discord API, Riot Games API
- **Development**: ESLint, Prettier, Turbopack

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. By participating in this project, you agree to abide by our code of conduct:

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors include:**
- Harassment, trolling, or insulting comments
- Publishing others' private information without permission
- Any conduct that would be inappropriate in a professional setting
- Discrimination based on personal characteristics

### Enforcement

Project maintainers are responsible for clarifying standards and will take appropriate action in response to unacceptable behavior. This may include warning, temporary ban, or permanent removal from the project.

## Development Setup

### Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher
- **Git**: For version control
- **Discord Application**: For OAuth integration (development)
- **Riot API Key**: For League of Legends data (development)
- **Supabase Project**: For database access

### Environment Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/yuumi-challenges.git
   cd yuumi-challenges
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment variables:**
   Copy `.env.example` to `.env.local` and fill in the required values:
   ```bash
   cp .env.example .env.local
   ```
   
   Required environment variables (see `docs/environment-variables.md` for details):
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `DISCORD_CLIENT_ID`
   - `DISCORD_CLIENT_SECRET`
   - `DISCORD_BOT_TOKEN`
   - `RIOT_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_PROJECT_ID`

4. **Database setup:**
   ```bash
   # Generate TypeScript types from Supabase
   npm run db:generate
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Verify setup:**
   Visit `http://localhost:3000` and ensure the application loads correctly.

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint checks |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run type-check` | Run TypeScript type checking |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run db:generate` | Generate TypeScript types from Supabase |

## Architecture Overview

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   └── profile/           # User profiles
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── challenges/        # Challenge-related components
│   ├── dashboard/         # Dashboard components
│   ├── profile/           # Profile components
│   └── ui/                # Reusable UI components (Radix)
├── lib/                   # Utility libraries
│   ├── apis/              # External API wrappers
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
└── styles/                # Global styles and themes

supabase/
└── migrations/            # Database migrations

docs/                      # Project documentation
```

### Key Integrations

**Authentication Flow:**
- Discord OAuth through NextAuth.js
- User validation against Yuumi Discord server membership
- Role-based access control with admin/moderator permissions

**Database Architecture:**
- PostgreSQL with Row Level Security (RLS)
- Comprehensive schema with users, challenges, match data
- Automated triggers for points calculation and ranking

**API Integration:**
- Discord API for user verification and role management
- Riot Games API for match data and summoner information
- RESTful API routes for frontend-backend communication

## Coding Standards and Conventions

### TypeScript

- **Strict mode enabled**: All code must pass TypeScript strict checks
- **Explicit types**: Prefer explicit type annotations over `any`
- **Interface over type**: Use interfaces for object shapes, types for unions
- **Consistent naming**: PascalCase for types/interfaces, camelCase for variables

```typescript
// Good
interface UserProfile {
  id: string;
  username: string;
  discordId: string;
}

const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  // Implementation
};

// Avoid
const fetchUser = async (id: any) => {
  // Implementation
};
```

### React Components

- **Functional components**: Use function declarations with TypeScript
- **Props interface**: Define explicit props interfaces
- **Default exports**: Use default exports for page components
- **Named exports**: Use named exports for utility components

```typescript
// Good
interface DashboardProps {
  userId: string;
  challenges: Challenge[];
}

export default function Dashboard({ userId, challenges }: DashboardProps) {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}

// For utility components
export const ChallengeCard = ({ challenge }: { challenge: Challenge }) => {
  // Implementation
};
```

### CSS and Styling

- **Tailwind CSS**: Use Tailwind utility classes for styling
- **Component variants**: Use `class-variance-authority` for component variants
- **Responsive design**: Mobile-first approach with responsive utilities
- **Dark mode**: Support dark mode using CSS variables

```typescript
// Good - Using CVA for variants
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### Database and API

- **Type safety**: Use generated Supabase types
- **Error handling**: Comprehensive error handling with proper HTTP status codes
- **Validation**: Validate all inputs using Zod schemas
- **Security**: Implement proper authentication and authorization

```typescript
// Good - API route with validation
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const createChallengeSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  type: z.enum(['kda', 'winstreak', 'champion_mastery']),
  criteria: z.object({}).passthrough(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createChallengeSchema.parse(body);
    
    // Implementation
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### File and Folder Naming

- **kebab-case**: Use kebab-case for file and folder names
- **Descriptive names**: Choose clear, descriptive names
- **Component files**: Match component name with file name
- **API routes**: Use RESTful naming conventions

```
// Good
components/challenge-card.tsx
pages/api/challenges/[id]/route.ts
hooks/use-challenge-progress.ts

// Avoid
components/ChallengeCard.tsx
pages/api/challenge_management.ts
hooks/challengeProgressHook.ts
```

## Git Workflow and Branch Naming

### Branch Strategy

We use a feature branch workflow with the following branch types:

- **`main`**: Production-ready code
- **`dev`**: Development integration branch
- **`feature/*`**: New features
- **`fix/*`**: Bug fixes
- **`hotfix/*`**: Critical production fixes
- **`docs/*`**: Documentation updates
- **`refactor/*`**: Code refactoring

### Branch Naming Convention

Use descriptive branch names with the following format:

```
<type>/<short-description>
```

**Examples:**
- `feature/user-challenge-progress`
- `fix/discord-auth-redirect`
- `hotfix/leaderboard-calculation`
- `docs/api-documentation`
- `refactor/challenge-progress-logic`

### Commit Messages

Follow the conventional commit format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(challenges): add winstreak challenge type

Implement winstreak challenge tracking with automatic
progress updates from match history analysis.

Closes #123
```

```
fix(auth): resolve Discord OAuth redirect issue

Update NextAuth configuration to handle Discord OAuth
redirects properly in production environment.

Fixes #456
```

### Working with Git

1. **Create a feature branch:**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   ```bash
   # Make your changes
   git add .
   git commit -m "feat(scope): your commit message"
   ```

3. **Keep your branch up to date:**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout feature/your-feature-name
   git rebase dev
   ```

4. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

## Pull Request Process

### Before Creating a PR

1. **Code quality checks:**
   ```bash
   npm run lint
   npm run type-check
   npm run format:check
   npm run build
   ```

2. **Test your changes:**
   - Verify functionality works as expected
   - Test edge cases and error scenarios
   - Ensure responsive design works on different screen sizes

3. **Update documentation:**
   - Update relevant documentation files
   - Add JSDoc comments for new functions
   - Update API documentation if applicable

### Creating a Pull Request

1. **Use the PR template:**
   - Fill out the provided pull request template
   - Include a clear description of changes
   - Link to related issues

2. **PR title format:**
   ```
   <type>(<scope>): <description>
   ```

3. **PR description should include:**
   - **Summary**: What does this PR do?
   - **Changes**: List of specific changes made
   - **Testing**: How to test the changes
   - **Screenshots**: For UI changes
   - **Breaking changes**: If any
   - **Related issues**: Link to issues

### Example PR Description

```markdown
## Summary
Implement winstreak challenge tracking with automatic progress updates.

## Changes
- Add winstreak challenge type to database schema
- Create challenge progress calculation service
- Implement automatic match history analysis
- Add UI components for winstreak display
- Update leaderboard to show winstreak achievements

## Testing
1. Create a new winstreak challenge through admin panel
2. Play ranked games with a verified summoner
3. Verify progress updates automatically
4. Check leaderboard displays winstreak correctly

## Screenshots
[Include screenshots of UI changes]

## Breaking Changes
None

## Related Issues
Closes #123
Related to #456
```

### PR Requirements

- **All checks pass**: Linting, type checking, and build succeed
- **Code review**: At least one approved review from maintainers
- **Up to date**: Branch must be up to date with target branch
- **Conflicts resolved**: No merge conflicts
- **Documentation updated**: Relevant docs are updated

### Review Process

1. **Automated checks**: CI will run linting, type checking, and build
2. **Code review**: Maintainers will review code for:
   - Code quality and consistency
   - Architecture and design patterns
   - Security considerations
   - Performance implications
   - Documentation completeness

3. **Feedback incorporation**: Address review feedback promptly
4. **Final approval**: Maintainer approval required for merge

## Issue Reporting Guidelines

### Before Creating an Issue

1. **Search existing issues**: Check if the issue already exists
2. **Use latest version**: Ensure you're using the latest development version
3. **Reproduce the issue**: Verify the issue is reproducible

### Issue Types

We use issue templates for different types of issues:

- **🐛 Bug Report**: For reporting bugs
- **✨ Feature Request**: For suggesting new features
- **📚 Documentation**: For documentation improvements
- **🚀 Enhancement**: For improving existing features
- **❓ Question**: For general questions

### Bug Report Template

```markdown
## Bug Description
A clear description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Screenshots
If applicable, add screenshots.

## Environment
- OS: [e.g., Windows 10, macOS 12.0]
- Browser: [e.g., Chrome 95, Firefox 94]
- Node.js version: [e.g., 18.0.0]
- Project version: [e.g., 0.1.0]

## Additional Context
Any other context about the problem.
```

### Feature Request Template

```markdown
## Feature Description
A clear description of what you want to happen.

## Problem Statement
What problem does this feature solve?

## Proposed Solution
Describe your proposed solution.

## Alternatives Considered
Other solutions you've considered.

## Additional Context
Any other context or screenshots.
```

## Testing Requirements

### Testing Philosophy

While we don't currently have automated tests, we maintain high quality through:

- **Manual testing**: Thorough manual testing of all features
- **Code review**: Peer review of all changes
- **Type safety**: TypeScript for compile-time error detection
- **Linting**: Automated code quality checks

### Manual Testing Guidelines

When contributing, please test the following:

1. **Functionality testing:**
   - Core feature works as expected
   - Edge cases are handled properly
   - Error scenarios are graceful

2. **Integration testing:**
   - Discord OAuth flow works
   - Riot API integration functions
   - Database operations succeed

3. **UI/UX testing:**
   - Responsive design on mobile and desktop
   - Dark mode compatibility
   - Accessibility considerations

4. **Performance testing:**
   - Page load times are reasonable
   - Database queries are efficient
   - No memory leaks in client code

### Testing Checklist

Before submitting a PR, verify:

- [ ] Feature works in development environment
- [ ] No console errors or warnings
- [ ] TypeScript compilation succeeds
- [ ] ESLint passes without errors
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Dark mode works correctly
- [ ] Authentication flow works (if applicable)
- [ ] Database operations succeed (if applicable)
- [ ] API endpoints return expected responses (if applicable)

## Documentation Standards

### Documentation Requirements

All contributions should include appropriate documentation:

1. **Code documentation:**
   - JSDoc comments for functions and classes
   - Inline comments for complex logic
   - README updates for new features

2. **API documentation:**
   - Document new API endpoints
   - Include request/response examples
   - Update OpenAPI specifications

3. **User documentation:**
   - Update user guides for new features
   - Include screenshots for UI changes
   - Update FAQ if needed

### JSDoc Standards

```typescript
/**
 * Calculates the KDA ratio for a player's match
 * 
 * @param kills - Number of kills in the match
 * @param deaths - Number of deaths in the match  
 * @param assists - Number of assists in the match
 * @returns The calculated KDA ratio, minimum 0
 * 
 * @example
 * ```typescript
 * const kda = calculateKDA(10, 2, 15); // Returns 12.5
 * const perfectKDA = calculateKDA(10, 0, 15); // Returns 25
 * ```
 */
export function calculateKDA(kills: number, deaths: number, assists: number): number {
  return (kills + assists) / Math.max(deaths, 1);
}
```

### Documentation File Organization

- **`docs/`**: General project documentation
- **`docs/api/`**: API endpoint documentation
- **`docs/setup/`**: Setup and configuration guides
- **`README.md`**: Project overview and quick start
- **`CONTRIBUTING.md`**: This file
- **`CHANGELOG.md`**: Version history and changes

## Review Process

### Code Review Guidelines

As a reviewer, check for:

1. **Functionality**: Does the code do what it's supposed to do?
2. **Code quality**: Is the code clean, readable, and maintainable?
3. **Security**: Are there any security vulnerabilities?
4. **Performance**: Are there performance implications?
5. **Testing**: Has the code been adequately tested?
6. **Documentation**: Is the code properly documented?

### Review Checklist

- [ ] Code follows project conventions
- [ ] No obvious bugs or logical errors
- [ ] Security best practices followed
- [ ] Performance considerations addressed
- [ ] Error handling is appropriate
- [ ] Code is well-documented
- [ ] UI changes are responsive and accessible
- [ ] Database queries are efficient
- [ ] No sensitive information exposed

### Providing Feedback

- **Be constructive**: Provide specific, actionable feedback
- **Be respectful**: Maintain a professional and helpful tone
- **Explain reasoning**: Help contributors understand the why
- **Suggest improvements**: Offer alternative solutions when possible
- **Recognize good work**: Acknowledge well-written code

### Example Review Comments

**Good feedback:**
```
This function looks great! Consider extracting the KDA calculation 
logic into a separate utility function to improve reusability and testability.

```typescript
const kda = calculateKDA(match.kills, match.deaths, match.assists);
```
```

**Constructive criticism:**
```
The error handling here could be improved. Consider using a try-catch 
block and returning a proper error response:

```typescript
try {
  const result = await riskyOperation();
  return NextResponse.json(result);
} catch (error) {
  console.error('Operation failed:', error);
  return NextResponse.json(
    { error: 'Internal server error' }, 
    { status: 500 }
  );
}
```
```

## Recognition and Attribution

### Contributor Recognition

We believe in recognizing our contributors' efforts:

1. **Contributors file**: All contributors are listed in `CONTRIBUTORS.md`
2. **Release notes**: Significant contributions mentioned in release notes
3. **Discord recognition**: Contributors highlighted in project Discord channel
4. **Code comments**: Attribution in code for major features

### How to Get Recognized

- **First contribution**: Added to contributors list automatically
- **Significant features**: Featured in release notes and project announcements
- **Ongoing contributions**: Potential invitation to maintainer team
- **Bug fixes**: Acknowledged in issue closure and release notes

### Maintainer Path

Regular contributors may be invited to become maintainers with:

- **Commit access**: Ability to merge pull requests
- **Issue triage**: Help manage and prioritize issues
- **Code review**: Review and approve contributions
- **Project direction**: Input on project roadmap and decisions

### Contributing Guidelines

By contributing to this project, you agree that:

- Your contributions will be licensed under the same license as the project
- You have the right to submit the contributions
- You understand and agree to the Code of Conduct
- You're willing to work collaboratively with the maintainer team

---

## Getting Help

If you need help while contributing:

1. **Discord**: Join our Discord server for real-time help
2. **Issues**: Create a question issue for project-specific help
3. **Discussions**: Use GitHub Discussions for general questions
4. **Documentation**: Check existing documentation first

## Quick Reference

### Essential Commands
```bash
# Setup
npm install
npm run dev

# Quality checks
npm run lint:fix
npm run format
npm run type-check

# Database
npm run db:generate
```

### Important Files
- `src/app/api/` - API routes
- `src/components/` - React components  
- `src/lib/apis/` - External API integrations
- `supabase/migrations/` - Database schema
- `docs/` - Project documentation

Thank you for contributing to Yuumi Challenges! Your efforts help make the Yuumi Mains community more engaging and fun. 🐱✨

---

*This contributing guide is a living document. If you find areas for improvement, please submit a pull request with your suggestions.*