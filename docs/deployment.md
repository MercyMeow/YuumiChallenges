# Deployment Guide

This comprehensive guide covers deploying the Yuumi Challenges League of Legends challenge tracking application in various environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Environment Setup](#development-environment-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup and Migration](#database-setup-and-migration)
5. [Production Deployment Options](#production-deployment-options)
6. [Build Process and Optimization](#build-process-and-optimization)
7. [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
8. [Performance Considerations](#performance-considerations)
9. [Security Checklist](#security-checklist)
10. [CI/CD Pipeline Suggestions](#cicd-pipeline-suggestions)

## Prerequisites

### System Requirements

- **Node.js**: Version 18.0.0 or higher (LTS recommended)
- **npm**: Version 8.0.0 or higher (or equivalent package manager)
- **Git**: For version control and deployment
- **PostgreSQL**: For local development (optional, can use Supabase cloud)

### Required Accounts and API Keys

1. **Supabase Account**: For database and authentication backend
2. **Discord Developer Account**: For OAuth and bot integration
3. **Riot Games Developer Account**: For League of Legends API access
4. **Deployment Platform Account**: Vercel, Netlify, or cloud provider

## Development Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd YuumiChallenges
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the environment template and configure:

```bash
cp .env.example .env.local
```

### 4. Supabase Setup

#### Option A: Use Supabase Cloud (Recommended for Development)

1. Create a new project at [supabase.com](https://supabase.com)
2. Note your project URL and API keys
3. Configure environment variables (see [Environment Configuration](#environment-configuration))

#### Option B: Local Supabase (Advanced)

```bash
npx supabase start
```

### 5. Discord Application Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Navigate to OAuth2 section
4. Add redirect URLs:
   - Development: `http://localhost:3000/api/auth/callback/discord`
   - Production: `https://yourdomain.com/api/auth/callback/discord`
5. Note your Client ID and Client Secret

### 6. Riot Games API Setup

1. Go to [Riot Developer Portal](https://developer.riotgames.com/)
2. Create an application
3. Get your API key
4. Note rate limits and terms of service

### 7. Database Migration

```bash
npm run db:generate
```

### 8. Start Development Server

```bash
npm run dev
```

The application should be available at `http://localhost:3000`.

## Environment Configuration

### Development (.env.local)

```env
# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Supabase Configuration
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_PROJECT_ID=your-supabase-project-id

# Discord Configuration
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_BOT_TOKEN=your-discord-bot-token
DISCORD_GUILD_ID=your-yuumi-discord-server-id

# Riot Games API
RIOT_API_KEY=your-riot-api-key

# Database Configuration (if using local PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/yuumi_challenges
```

### Production Environment Variables

**Required Variables:**
- `NEXTAUTH_URL`: Your production domain
- `NEXTAUTH_SECRET`: Strong random secret (use `openssl rand -base64 32`)
- `SUPABASE_URL`: Production Supabase project URL
- `SUPABASE_ANON_KEY`: Production Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Production Supabase service role key
- `DISCORD_CLIENT_ID`: Discord application client ID
- `DISCORD_CLIENT_SECRET`: Discord application client secret
- `DISCORD_BOT_TOKEN`: Discord bot token
- `DISCORD_GUILD_ID`: Target Discord server ID
- `RIOT_API_KEY`: Production Riot API key

**Optional Variables:**
- `NODE_ENV=production`
- `ANALYZE=true` (for bundle analysis)

## Database Setup and Migration

### Initial Setup

1. **Create Supabase Project**:
   ```bash
   # If using Supabase CLI
   npx supabase init
   npx supabase start
   ```

2. **Run Migrations**:
   ```bash
   # Apply all migrations
   npx supabase db reset
   
   # Or apply specific migration
   npx supabase migration up
   ```

3. **Generate TypeScript Types**:
   ```bash
   npm run db:generate
   ```

### Migration Management

```bash
# Create new migration
npx supabase migration new migration_name

# Apply migrations
npx supabase db push

# Reset database (development only)
npx supabase db reset
```

### Row Level Security (RLS) Setup

Ensure RLS policies are properly configured:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE summoners ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_data ENABLE ROW LEVEL SECURITY;
```

## Production Deployment Options

### Option 1: Vercel (Recommended)

#### Automatic Deployment

1. **Connect Repository**:
   - Import project from GitHub/GitLab
   - Vercel will auto-detect Next.js configuration

2. **Configure Environment Variables**:
   - Add all production environment variables in Vercel dashboard
   - Use environment-specific variables for staging/production

3. **Custom Domain** (Optional):
   ```bash
   vercel domains add yourdomain.com
   ```

#### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

### Option 2: Docker Deployment

#### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose

```yaml
version: '3.8'
services:
  yuumi-challenges:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXTAUTH_URL=https://yourdomain.com
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID}
      - DISCORD_CLIENT_SECRET=${DISCORD_CLIENT_SECRET}
      - RIOT_API_KEY=${RIOT_API_KEY}
    restart: unless-stopped
```

### Option 3: AWS Deployment

#### Using AWS Amplify

1. **Connect Repository**: Link GitHub/GitLab repository
2. **Build Settings**:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

#### Using EC2 with PM2

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'yuumi-challenges',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 4: Self-Hosted with Nginx

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Build Process and Optimization

### Standard Build

```bash
# Install dependencies
npm ci

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

### Build Optimization

#### Bundle Analysis

```bash
# Analyze bundle size
ANALYZE=true npm run build
```

#### Environment-specific Builds

```bash
# Staging build
NODE_ENV=staging npm run build

# Production build
NODE_ENV=production npm run build
```

### Performance Optimizations

#### next.config.ts Enhancements

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable compression
  compress: true,
  
  // Image optimization
  images: {
    domains: ['cdn.riotgames.com', 'ddragon.leagueoflegends.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Enable experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
  
  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}

export default nextConfig
```

## Monitoring and Troubleshooting

### Application Monitoring

#### Vercel Analytics (if using Vercel)

```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

#### Error Tracking with Sentry

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### Health Checks

#### API Health Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('users').select('count').limit(1)
    
    if (error) throw error
    
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error.message 
      },
      { status: 500 }
    )
  }
}
```

### Common Issues and Solutions

#### Database Connection Issues

```typescript
// Check Supabase connection
const supabase = createClient()
const { data, error } = await supabase.from('users').select('count')
if (error) console.error('Database connection failed:', error)
```

#### Discord API Rate Limiting

```typescript
// Implement rate limiting
class DiscordAPI {
  private rateLimitQueue: Promise<any> = Promise.resolve()
  
  async makeRequest(endpoint: string) {
    this.rateLimitQueue = this.rateLimitQueue.then(async () => {
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
      return fetch(endpoint)
    })
    return this.rateLimitQueue
  }
}
```

#### Riot API Issues

```typescript
// Handle Riot API errors
async function fetchRiotData(endpoint: string) {
  try {
    const response = await fetch(endpoint)
    if (response.status === 429) {
      // Rate limited - implement backoff
      const retryAfter = response.headers.get('Retry-After')
      throw new Error(`Rate limited. Retry after: ${retryAfter}s`)
    }
    return response.json()
  } catch (error) {
    console.error('Riot API error:', error)
    throw error
  }
}
```

### Logging Strategy

#### Structured Logging

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }))
  },
  error: (message: string, error?: Error, meta?: object) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...meta
    }))
  }
}
```

## Performance Considerations

### Database Optimization

#### Indexing Strategy

```sql
-- Essential indexes for performance
CREATE INDEX idx_users_discord_id ON users(discord_id);
CREATE INDEX idx_summoners_riot_id ON summoners(riot_id);
CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_match_data_summoner_id ON match_data(summoner_id);
CREATE INDEX idx_match_data_match_id ON match_data(match_id);
```

#### Query Optimization

```typescript
// Use select to limit returned fields
const { data } = await supabase
  .from('users')
  .select('id, discord_username, avatar_url')
  .eq('discord_id', discordId)
  .single()

// Use pagination for large datasets
const { data } = await supabase
  .from('match_data')
  .select('*')
  .range(0, 49) // Limit to 50 records
  .order('created_at', { ascending: false })
```

### Caching Strategy

#### Redis Implementation

```typescript
// lib/cache.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export const cache = {
  async get(key: string) {
    const value = await redis.get(key)
    return value ? JSON.parse(value) : null
  },
  
  async set(key: string, value: any, ttl = 3600) {
    await redis.setex(key, ttl, JSON.stringify(value))
  },
  
  async del(key: string) {
    await redis.del(key)
  }
}
```

#### Next.js Caching

```typescript
// Use Next.js built-in caching
export const revalidate = 3600 // 1 hour

// API route caching
export async function GET() {
  const data = await fetchExpensiveData()
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
}
```

### Frontend Optimization

#### Code Splitting

```typescript
// Dynamic imports for large components
import dynamic from 'next/dynamic'

const DashboardChart = dynamic(() => import('@/components/DashboardChart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false
})
```

#### Image Optimization

```typescript
// components/Avatar.tsx
import Image from 'next/image'

export function Avatar({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      className="rounded-full"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  )
}
```

## Security Checklist

### Environment Security

- [ ] All environment variables are properly set
- [ ] No sensitive data in client-side code
- [ ] API keys are restricted by domain/IP
- [ ] Database connection uses SSL
- [ ] NEXTAUTH_SECRET is cryptographically strong

### Application Security

- [ ] Input validation on all forms
- [ ] SQL injection protection (using Supabase query builder)
- [ ] XSS protection enabled
- [ ] CSRF protection via NextAuth.js
- [ ] Rate limiting on API endpoints
- [ ] Proper error handling (no sensitive data in errors)

### Database Security

- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Proper RLS policies implemented
- [ ] Database backups configured
- [ ] SSL connections enforced
- [ ] Service role key properly secured

### Infrastructure Security

- [ ] HTTPS enabled in production
- [ ] Security headers configured
- [ ] Regular dependency updates
- [ ] Vulnerability scanning enabled
- [ ] Access logs monitored

### Implementation Examples

#### Input Validation

```typescript
// lib/validation.ts
import { z } from 'zod'

export const summonerSchema = z.object({
  name: z.string().min(1).max(16).regex(/^[0-9A-Za-z ]+$/),
  tag: z.string().min(1).max(5).regex(/^[0-9A-Za-z]+$/),
  region: z.enum(['NA1', 'EUW1', 'EUN1', 'KR', 'JP1'])
})
```

#### Rate Limiting

```typescript
// lib/rate-limit.ts
import { NextRequest } from 'next/server'

const rateLimit = new Map()

export function checkRateLimit(request: NextRequest, limit = 10) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const windowStart = now - 60000 // 1 minute window
  
  const requests = rateLimit.get(ip) || []
  const recentRequests = requests.filter((time: number) => time > windowStart)
  
  if (recentRequests.length >= limit) {
    return false
  }
  
  recentRequests.push(now)
  rateLimit.set(ip, recentRequests)
  return true
}
```

## CI/CD Pipeline Suggestions

### GitHub Actions

#### Basic Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
        env:
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

#### Advanced Workflow with Database Migration

```yaml
# .github/workflows/deploy-with-db.yml
name: Deploy with Database Migration

on:
  push:
    branches: [main]

jobs:
  migrate-database:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Run database migrations
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
      
      - name: Generate types
        run: supabase gen types typescript --project-id ${{ secrets.SUPABASE_PROJECT_ID }} > src/lib/database.types.ts
      
      - name: Commit generated types
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add src/lib/database.types.ts
          git diff --staged --quiet || git commit -m "Update database types"
          git push

  deploy:
    needs: migrate-database
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Required Secrets

Set these secrets in your repository settings:

- `NEXTAUTH_URL`: Production URL
- `NEXTAUTH_SECRET`: NextAuth secret key
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `DISCORD_CLIENT_ID`: Discord application client ID
- `DISCORD_CLIENT_SECRET`: Discord application client secret
- `DISCORD_BOT_TOKEN`: Discord bot token
- `RIOT_API_KEY`: Riot Games API key
- `VERCEL_TOKEN`: Vercel deployment token
- `ORG_ID`: Vercel organization ID
- `PROJECT_ID`: Vercel project ID

### Development Workflow

#### Feature Branch Strategy

```bash
# Create feature branch
git checkout -b feature/new-challenge-type

# Make changes and commit
git add .
git commit -m "feat: add new challenge type for champion mastery"

# Push and create PR
git push origin feature/new-challenge-type
```

#### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### Environment-specific Deployments

#### Staging Environment

```yaml
# .github/workflows/staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel (Preview)
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
        env:
          NEXTAUTH_URL: https://staging-yuumi-challenges.vercel.app
```

This comprehensive deployment guide covers all aspects of deploying the Yuumi Challenges application, from development setup to production deployment across multiple platforms. Choose the deployment strategy that best fits your infrastructure requirements and team preferences.