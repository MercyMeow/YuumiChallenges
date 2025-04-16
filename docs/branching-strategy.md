# Branching Strategy

This document outlines the branching strategy for the Yuum.Ai Dashboard project.

## Overview

We follow a simplified Git Flow branching model with the following branches:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Hot fix branches for production issues
- `release/*` - Release preparation branches

## Branch Types

### Main Branch (`main`)

- Contains production-ready code
- Always deployable
- Protected branch - no direct commits
- Only merged from `release/*` or `hotfix/*` branches
- Tagged with version numbers for releases

### Development Branch (`develop`)

- Integration branch for features
- Contains the latest delivered development changes for the next release
- When stable and ready for release, merged to a `release/*` branch

### Feature Branches (`feature/*`)

- Created from: `develop`
- Merged back into: `develop`
- Naming convention: `feature/feature-name` (e.g., `feature/user-authentication`)
- Used for developing new features
- Should be short-lived (1-2 weeks maximum)

### Bug Fix Branches (`bugfix/*`)

- Created from: `develop`
- Merged back into: `develop`
- Naming convention: `bugfix/bug-description` (e.g., `bugfix/login-validation`)
- Used for fixing bugs in the development environment

### Hot Fix Branches (`hotfix/*`)

- Created from: `main`
- Merged back into: `main` AND `develop`
- Naming convention: `hotfix/issue-description` (e.g., `hotfix/critical-security-issue`)
- Used for urgent fixes to production code
- Should be very short-lived

### Release Branches (`release/*`)

- Created from: `develop`
- Merged back into: `main` AND `develop`
- Naming convention: `release/version-number` (e.g., `release/1.0.0`)
- Used for release preparation
- Only bug fixes, documentation, and release-oriented tasks

## Workflow

### Feature Development

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/feature-name
   ```

2. Develop the feature with regular commits:
   ```bash
   git add .
   git commit -m "Descriptive commit message"
   ```

3. Push the feature branch to remote:
   ```bash
   git push -u origin feature/feature-name
   ```

4. When the feature is complete, create a pull request to merge into `develop`
5. After code review and approval, merge the feature branch into `develop`

### Bug Fixes

1. Create a bugfix branch from `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b bugfix/bug-description
   ```

2. Fix the bug with regular commits
3. Create a pull request to merge into `develop`
4. After code review and approval, merge the bugfix branch into `develop`

### Hotfixes

1. Create a hotfix branch from `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/issue-description
   ```

2. Fix the issue with regular commits
3. Create a pull request to merge into `main`
4. After code review and approval, merge the hotfix branch into `main`
5. Also merge the hotfix branch into `develop` to ensure the fix is included in future releases

### Releases

1. Create a release branch from `develop` when ready for release:
   ```bash
   git checkout develop
   git pull
   git checkout -b release/1.0.0
   ```

2. Make any final adjustments, version bumps, and documentation updates
3. Create a pull request to merge into `main`
4. After testing and approval, merge the release branch into `main`
5. Tag the release in `main`:
   ```bash
   git checkout main
   git pull
   git tag -a v1.0.0 -m "Version 1.0.0"
   git push origin v1.0.0
   ```
6. Merge the release branch back into `develop`

## Pull Request Guidelines

- All code changes must go through pull requests
- Pull requests should be reviewed by at least one other developer
- Pull requests should include:
  - Clear description of changes
  - Reference to related issues
  - Tests for new functionality
  - Updated documentation if necessary
- CI checks must pass before merging

## Commit Message Guidelines

- Use clear, descriptive commit messages
- Start with a verb in the present tense (e.g., "Add", "Fix", "Update")
- Reference issue numbers when applicable
- Keep commits focused on a single change
- Example: "Add user authentication feature (#123)"

## Branch Cleanup

- Delete feature, bugfix, hotfix, and release branches after they have been merged
- Regularly clean up local branches that have been merged or abandoned

## Visual Representation

```
    main    ----o----o----o----o----o----o----o----o----o----o----o
                 |                   |                   |
    hotfix/*     |                   |                   o----o
                 |                   |                        |
    release/*    |                   o----o----o--------------o
                 |                  /              \
    develop   ---o----o----o----o--o----o----o----o----o----o----o
                      |         |       |              |
    feature/*         o----o----o       |              o----o----o
                                        |
    bugfix/*                            o----o
```

## Exceptions

In some cases, the team may decide to deviate from this strategy for specific reasons. Any exceptions should be documented and communicated to the team.
