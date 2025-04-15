# YuumiChallenges

## Overview

Yuum.Ai Dashboard is a Next.js application that provides League of Legends players with challenge tracking, game analysis, and community features. The application follows a client-server architecture with a React frontend and Next.js API routes for backend functionality.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/Veiled-Cat-Studios/YuumiChallenges.git
   cd YuumiChallenges
   ```

2. Install dependencies

   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables

   - Copy `.env.example` to `.env.local`
   - Fill in the required environment variables

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Project Structure

- `/pages` - Next.js pages and API routes
- `/components` - React components
- `/styles` - CSS and styling files
- `/lib` - Utility functions and services
- `/models` - Database models
- `/public` - Static assets
- `/docs` - Project documentation

## Documentation

- [Architecture Documentation](docs/architecture.md) - System architecture, component relationships
- [Technical Documentation](docs/technical.md) - Technical specifications, established patterns
- [Branching Strategy](docs/branching-strategy.md) - Git workflow and branching model
- [Status Documentation](docs/status.md) - Current project status and progress
- [Tasks](tasks/tasks.md) - Current development tasks and requirements

## Contributing

### Branching Strategy

We follow a simplified Git Flow branching model. Please read our [Branching Strategy](docs/branching-strategy.md) document for details.

### Creating a New Branch

We provide a script to help you create branches following our branching strategy:

```bash
# Using npm script
npm run create-branch <branch-type> <branch-name>

# Example: Create a feature branch
npm run create-branch feature user-authentication

# Or directly using the script
node scripts/create-branch.js <branch-type> <branch-name>
```

Valid branch types are:

- `feature` - For new features (branched from develop)
- `bugfix` - For bug fixes (branched from develop)
- `hotfix` - For urgent production fixes (branched from main)
- `release` - For release preparation (branched from develop)

Please read our contributing guidelines before submitting pull requests.

## License

[MIT](LICENSE)
