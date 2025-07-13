# Environment Variables

This document provides a comprehensive guide to all environment variables required for the League of Legends Yuumi Challenge Tracker application. These variables must be configured for both development and production environments.

## Quick Setup Checklist

Before starting development, ensure you have:
- [ ] Supabase project created with database schema deployed
- [ ] Discord application created with OAuth2 configuration
- [ ] Discord bot created and added to your server
- [ ] Riot Games API key obtained
- [ ] All environment variables configured in `.env.local`

## Required Environment Variables

### Supabase Configuration

#### `NEXT_PUBLIC_SUPABASE_URL` (Required)
- **Purpose**: The public URL of your Supabase project
- **Format**: `https://your-project-id.supabase.co`
- **Usage**: Client-side database connections, authentication adapter
- **Security**: Public (safe to expose to browser)
- **Where to find**: Supabase Dashboard → Settings → API → Project URL

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Required)
- **Purpose**: Anonymous/public key for client-side Supabase operations
- **Format**: JWT token starting with `eyJ...`
- **Usage**: Client-side database queries with RLS (Row Level Security)
- **Security**: Public (safe to expose to browser, respects RLS policies)
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

#### `SUPABASE_SERVICE_ROLE_KEY` (Required)
- **Purpose**: Service role key for server-side operations bypassing RLS
- **Format**: JWT token starting with `eyJ...`
- **Usage**: NextAuth adapter, server-side admin operations
- **Security**: **CRITICAL** - Never expose to client, has full database access
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`

#### `SUPABASE_PROJECT_ID` (Optional - Development only)
- **Purpose**: Used for TypeScript type generation script
- **Format**: Short alphanumeric string (e.g., `abc123def456`)
- **Usage**: `npm run db:generate` command
- **Where to find**: Extract from your Supabase URL or Dashboard → Settings → General

### Discord OAuth & Bot Configuration

#### `DISCORD_CLIENT_ID` (Required)
- **Purpose**: Discord OAuth application client identifier
- **Format**: 18-19 digit numeric string
- **Usage**: NextAuth Discord provider, OAuth flow initiation
- **Security**: Public (used in OAuth redirects)
- **Where to find**: Discord Developer Portal → Your App → OAuth2 → General → Client ID

#### `DISCORD_CLIENT_SECRET` (Required)
- **Purpose**: Discord OAuth application secret for token exchange
- **Format**: Base64-like string with underscores and hyphens
- **Usage**: NextAuth Discord provider, server-side OAuth token exchange
- **Security**: **SECRET** - Never expose to client
- **Where to find**: Discord Developer Portal → Your App → OAuth2 → General → Client Secret

#### `DISCORD_BOT_TOKEN` (Required)
- **Purpose**: Bot token for Discord API operations (server verification)
- **Format**: Base64 string starting with bot user ID
- **Usage**: Server membership verification, role checking
- **Security**: **CRITICAL** - Never expose to client, has bot permissions
- **Where to find**: Discord Developer Portal → Your App → Bot → Token

#### `YUUMI_DISCORD_SERVER_ID` (Required)
- **Purpose**: Discord server ID for membership verification
- **Format**: 18-19 digit numeric string
- **Usage**: Verify users are members of the Yuumi Discord server
- **Security**: Public (Discord server IDs are not sensitive)
- **Where to find**: Discord → Right-click server → Copy Server ID (Developer Mode required)

### Riot Games API Configuration

#### `RIOT_API_KEY` (Required)
- **Purpose**: Riot Games API authentication for League of Legends data
- **Format**: String starting with `RGAPI-` followed by UUID
- **Usage**: Summoner lookup, match history, ranked data retrieval
- **Security**: **SECRET** - Has rate limits, should not be exposed
- **Where to find**: [Riot Developer Portal](https://developer.riotgames.com/) → Personal API Key
- **Note**: Development keys expire after 24 hours, production keys require approval

### NextAuth Configuration

#### `NEXTAUTH_URL` (Required)
- **Purpose**: Base URL for NextAuth callbacks and redirects
- **Format**: Full URL with protocol (e.g., `http://localhost:3000` or `https://yourdomain.com`)
- **Usage**: OAuth callback URLs, session management
- **Security**: Public (used in redirects)
- **Development**: `http://localhost:3000`
- **Production**: Your deployed application URL

#### `NEXTAUTH_SECRET` (Required)
- **Purpose**: Secret key for JWT signing and encryption
- **Format**: Random string, minimum 32 characters
- **Usage**: Session token encryption, CSRF protection
- **Security**: **CRITICAL** - Compromise allows session forgery
- **Generation**: `openssl rand -base64 32` or `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### Application Settings

#### `NODE_ENV` (Automatic/Optional)
- **Purpose**: Node.js environment identifier
- **Values**: `development`, `production`, `test`
- **Usage**: Conditional logic, debug mode, optimizations
- **Note**: Automatically set by Next.js and deployment platforms

#### `APP_URL` (Optional)
- **Purpose**: Application base URL for internal references
- **Format**: Full URL with protocol
- **Usage**: Email links, webhook URLs, canonical URLs
- **Default**: Inherits from `NEXTAUTH_URL` if not specified

## Environment File Setup

### Development (`.env.local`)

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Discord OAuth Configuration
DISCORD_CLIENT_ID=1234567890123456789
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_BOT_TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.GhIjKl.MnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUv
YUUMI_DISCORD_SERVER_ID=570702412428476438

# Riot Games API
RIOT_API_KEY=RGAPI-12345678-1234-1234-1234-123456789012

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_32_character_secret_key_here

# Application Settings
NODE_ENV=development
APP_URL=http://localhost:3000
```

### Production Deployment

For production deployments (Vercel, Netlify, etc.), set these variables in your platform's environment variable settings.

## Security Best Practices

### Critical Secrets (Never expose to client)
- `SUPABASE_SERVICE_ROLE_KEY`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_BOT_TOKEN`
- `RIOT_API_KEY`
- `NEXTAUTH_SECRET`

### Public Variables (Safe for client exposure)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DISCORD_CLIENT_ID`
- `YUUMI_DISCORD_SERVER_ID`
- `NEXTAUTH_URL`

### Rotation Schedule
- **Riot API Key**: Regenerate every 24 hours (development) or as needed (production)
- **Discord Bot Token**: Regenerate if compromised
- **NextAuth Secret**: Regenerate if compromised (invalidates all sessions)
- **Supabase Keys**: Monitor usage, regenerate if suspicious activity

## Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Navigate to Settings → API to find your keys
3. Deploy the database schema from `supabase/migrations/`
4. Configure Row Level Security (RLS) policies

### 2. Discord Application Setup

1. Visit [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Navigate to OAuth2 → General:
   - Copy Client ID and Client Secret
   - Add redirect URL: `http://localhost:3000/api/auth/callback/discord`
4. Navigate to Bot:
   - Create a bot and copy the token
   - Enable necessary intents (Server Members Intent)
5. Add bot to your Discord server with appropriate permissions

### 3. Discord OAuth Configuration

In Discord Developer Portal → OAuth2 → Redirects:
- Development: `http://localhost:3000/api/auth/callback/discord`
- Production: `https://yourdomain.com/api/auth/callback/discord`

Required OAuth2 Scopes:
- `identify` - Basic user information
- `guilds` - Server membership verification

### 4. Riot API Setup

1. Visit [Riot Developer Portal](https://developer.riotgames.com/)
2. Sign in with your Riot account
3. Generate a Personal API Key (expires in 24 hours for development)
4. For production, apply for a Production API Key

### 5. NextAuth Secret Generation

Generate a secure secret:
```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator (use with caution)
# Visit: https://generate-secret.vercel.app/32
```

## Troubleshooting

### Common Issues

#### Authentication Not Working
- **Problem**: Discord OAuth fails
- **Check**: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, and redirect URLs match
- **Verify**: NextAuth URL is correctly set

#### Database Connection Errors
- **Problem**: Supabase connection fails
- **Check**: NEXT_PUBLIC_SUPABASE_URL and keys are correct
- **Verify**: RLS policies allow your operations

#### Bot Verification Fails
- **Problem**: Server membership verification fails
- **Check**: DISCORD_BOT_TOKEN is valid and bot is in server
- **Verify**: Bot has necessary permissions (Read Messages/View Channels)

#### Riot API Errors
- **Problem**: 403 Forbidden from Riot API
- **Check**: RIOT_API_KEY is valid and not expired
- **Verify**: API key has correct permissions for your region

### Development vs Production Differences

#### Development
- Use development Discord application
- Riot API keys expire daily
- NEXTAUTH_URL uses localhost
- Debug mode enabled

#### Production
- Use production Discord application
- Apply for production Riot API key
- NEXTAUTH_URL uses production domain
- Enable all security headers

### Rate Limiting

#### Riot API
- Development: 100 requests per 2 minutes
- Production: Varies by approved key type
- Implement proper caching to avoid limits

#### Discord API
- Bot API: 5 requests per 5 seconds per endpoint
- OAuth: Standard OAuth rate limits apply

## Validation

The application validates environment variables at startup. Missing required variables will cause the application to fail to start with descriptive error messages.

### Required Variable Check
```typescript
// This validation happens automatically
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_BOT_TOKEN',
  'NEXTAUTH_SECRET'
];
```

## Additional Notes

- This application does not collect or store email addresses
- Only Discord username, avatar, and server membership data are used
- All sensitive operations use server-side API routes
- Row Level Security (RLS) is enforced for all database operations
- User sessions are encrypted and stored securely
