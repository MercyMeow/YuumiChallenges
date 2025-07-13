# API Documentation

## Overview

This document provides comprehensive documentation for the League of Legends Challenge Tracker API. The application is built with Next.js 15 App Router and uses a combination of API routes, server actions, and external API integrations to provide a complete challenge tracking experience for the Yuumi Mains Discord community.

## Architecture

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Authentication**: NextAuth.js with Discord OAuth
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **External APIs**: Discord API v10, Riot Games API v4/v5
- **Type Safety**: TypeScript with generated database types

### Core Components
1. **Authentication Routes**: NextAuth.js handled Discord OAuth
2. **External API Wrappers**: Discord and Riot Games API clients
3. **Database Operations**: Direct Supabase client operations with RLS
4. **Server-Side Rendering**: App Router with server components

## Authentication & Authorization

### Authentication Flow

The application uses NextAuth.js with Discord OAuth provider for authentication. Users must be members of the Yuumi Discord server to access the application.

#### Authentication Endpoints

**Base Route**: `/api/auth/[...nextauth]`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signin` | GET | Renders the sign-in page |
| `/api/auth/signin/discord` | POST | Initiates Discord OAuth flow |
| `/api/auth/callback/discord` | GET | Handles Discord OAuth callback |
| `/api/auth/signout` | GET | Renders the sign-out page |
| `/api/auth/signout` | POST | Signs the user out |
| `/api/auth/session` | GET | Returns current session |
| `/api/auth/csrf` | GET | Returns CSRF token |
| `/api/auth/error` | GET | Renders error page |

#### Discord OAuth Configuration

**Required Scopes**:
- `identify` - Basic user information
- `guilds` - Server membership verification
- `guilds.members.read` - Read member information

**Callback URL**: `{NEXTAUTH_URL}/api/auth/callback/discord`

#### Session Structure

```typescript
interface Session {
  user: {
    id: string;           // Database user ID
    discord_id: string;   // Discord snowflake ID
    name: string;         // Discord username
    email?: string;       // Discord email (optional)
    image?: string;       // Discord avatar URL
    user_role: 'member' | 'moderator' | 'admin';
    is_yuumi_member: boolean;
    roles: string[];      // Discord server roles
  }
}
```

### Authorization Levels

1. **Public**: Unauthenticated users (limited read access)
2. **Member**: Authenticated Discord server members
3. **Moderator**: Can manage challenges and content
4. **Admin**: Full system access

## API Routes

Currently, the application has one primary API route for authentication. Future API endpoints for challenges, summoners, and users are referenced in the existing documentation but not yet implemented.

### Authentication API

**Route**: `/api/auth/[...nextauth]/route.ts`

This route handles all NextAuth.js operations with custom callbacks for Discord integration.

#### Sign-In Callback Flow

1. **User Authentication**: Verify Discord OAuth credentials
2. **Server Membership Check**: Validate user is in Yuumi Discord server
3. **Role Retrieval**: Fetch user's Discord server roles
4. **Database Upsert**: Create or update user record with Discord data

```typescript
// Example sign-in callback logic
async signIn({ account, profile }) {
  if (account?.provider === 'discord' && profile) {
    const discordAPI = new DiscordAPI(process.env.DISCORD_BOT_TOKEN!);
    
    // Check server membership
    const isYuumiMember = await discordAPI.isUserInYuumiServer(profile.id);
    
    // Get member roles
    const memberInfo = await discordAPI.getGuildMember(profile.id);
    
    // Update database
    await supabase.from('users').upsert({
      discord_id: profile.id,
      username: profile.username,
      roles: memberInfo?.roles || [],
      is_yuumi_member: isYuumiMember,
      // ... other fields
    });
  }
  return true;
}
```

#### Session Callback

Enriches the NextAuth session with database user information:

```typescript
async session({ session, token }) {
  if (session.user && token.sub) {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', token.sub)
      .single();

    if (userData) {
      session.user.id = userData.id;
      session.user.user_role = userData.user_role;
      session.user.is_yuumi_member = userData.is_yuumi_member;
      session.user.roles = userData.roles;
    }
  }
  return session;
}
```

### Future API Endpoints

The following endpoints are planned but not yet implemented:

#### Challenges API
- **GET** `/api/challenges` - List all active challenges
- **POST** `/api/challenges` - Create new challenge (admin/moderator only)
- **GET** `/api/challenges/[id]` - Get specific challenge details
- **PUT** `/api/challenges/[id]` - Update challenge (admin/moderator only)
- **DELETE** `/api/challenges/[id]` - Delete challenge (admin only)

#### Summoners API
- **GET** `/api/summoners` - List user's summoners
- **POST** `/api/summoners` - Add new summoner account
- **PUT** `/api/summoners/[id]` - Update summoner information
- **DELETE** `/api/summoners/[id]` - Remove summoner account
- **POST** `/api/summoners/[id]/verify` - Verify summoner ownership

#### Users API
- **GET** `/api/users/me` - Get current user profile
- **PUT** `/api/users/me` - Update user profile
- **GET** `/api/users/[id]` - Get public user profile
- **GET** `/api/users/leaderboard` - Get leaderboard rankings

## External API Integrations

### Discord API Integration

**Class**: `DiscordAPI` (`src/lib/apis/discord.ts`)

The Discord API wrapper handles bot token authentication and provides methods for server membership verification and user data retrieval.

#### Configuration

```typescript
const discordAPI = new DiscordAPI(process.env.DISCORD_BOT_TOKEN!);
```

#### Available Methods

##### `getUser(userId: string)`
Retrieve Discord user information by user ID.

**Parameters**:
- `userId` (string): Discord user snowflake ID

**Returns**: Discord user object

**Example**:
```typescript
const user = await discordAPI.getUser('123456789012345678');
```

**Rate Limit**: 5 requests per 5 seconds per endpoint

---

##### `getGuildMember(userId: string, guildId?: string)`
Get guild member information including roles and join date.

**Parameters**:
- `userId` (string): Discord user snowflake ID
- `guildId` (string, optional): Guild ID (defaults to Yuumi server)

**Returns**: Guild member object or `null` if not found

**Example**:
```typescript
const member = await discordAPI.getGuildMember('123456789012345678');
if (member) {
  console.log('User roles:', member.roles);
  console.log('Joined at:', member.joined_at);
}
```

---

##### `getUserGuilds(userToken: string)`
Retrieve user's guild list using their OAuth token.

**Parameters**:
- `userToken` (string): User's OAuth access token

**Returns**: Array of guild objects

**Example**:
```typescript
const guilds = await discordAPI.getUserGuilds(accessToken);
```

---

##### `getGuildRoles(guildId?: string)`
Get all roles in the guild.

**Parameters**:
- `guildId` (string, optional): Guild ID (defaults to Yuumi server)

**Returns**: Array of role objects

**Example**:
```typescript
const roles = await discordAPI.getGuildRoles();
```

---

##### `isUserInYuumiServer(userId: string)`
Check if user is a member of the Yuumi Discord server.

**Parameters**:
- `userId` (string): Discord user snowflake ID

**Returns**: `boolean`

**Example**:
```typescript
const isMember = await discordAPI.isUserInYuumiServer('123456789012345678');
```

---

##### `static getAvatarUrl(userId: string, avatarHash: string | null, discriminator?: string)`
Generate Discord avatar URL.

**Parameters**:
- `userId` (string): Discord user ID
- `avatarHash` (string | null): Avatar hash from Discord
- `discriminator` (string, optional): User discriminator

**Returns**: Avatar URL string

**Example**:
```typescript
const avatarUrl = DiscordAPI.getAvatarUrl(userId, avatarHash, discriminator);
```

#### Error Handling

```typescript
try {
  const member = await discordAPI.getGuildMember(userId);
} catch (error) {
  if (error.message.includes('404')) {
    // User not in server
  } else {
    // Other API error
  }
}
```

### Riot Games API Integration

**Class**: `RiotAPI` (`src/lib/apis/riot.ts`)

The Riot API wrapper handles regional routing and provides methods for League of Legends data retrieval.

#### Configuration

```typescript
const riotAPI = new RiotAPI(process.env.RIOT_API_KEY!);
```

#### Regional Routing

The API automatically handles regional routing between platform APIs and regional APIs:

**Platform Regions**: `na1`, `euw1`, `eun1`, `kr`, `jp1`, `br1`, `la1`, `la2`, `oc1`, `tr1`, `ru`, `ph2`, `sg2`, `th2`, `tw2`, `vn2`

**Route Regions**: `americas`, `asia`, `europe`, `sea`

#### Available Methods

##### `getSummonerByRiotId(gameName: string, tagLine: string, region: string)`
Get account information by Riot ID (new format).

**Parameters**:
- `gameName` (string): Summoner name
- `tagLine` (string): Tag line (e.g., "NA1")
- `region` (string): Platform region

**Returns**: Account object with PUUID

**Example**:
```typescript
const account = await riotAPI.getSummonerByRiotId('YuumiMain', 'NA1', 'na1');
console.log('PUUID:', account.puuid);
```

**Rate Limit**: 100 requests per 2 minutes (development)

---

##### `getSummonerByPuuid(puuid: string, region: string)`
Get summoner information by PUUID.

**Parameters**:
- `puuid` (string): Player UUID
- `region` (string): Platform region

**Returns**: Summoner object

**Example**:
```typescript
const summoner = await riotAPI.getSummonerByPuuid(puuid, 'na1');
console.log('Summoner Level:', summoner.summonerLevel);
```

---

##### `getMatchHistory(puuid: string, region: string, count?: number)`
Get match history for a player.

**Parameters**:
- `puuid` (string): Player UUID
- `region` (string): Platform region
- `count` (number, optional): Number of matches (default: 20, max: 100)

**Returns**: Array of match IDs

**Example**:
```typescript
const matches = await riotAPI.getMatchHistory(puuid, 'na1', 10);
```

---

##### `getMatchDetails(matchId: string, region: string)`
Get detailed match information.

**Parameters**:
- `matchId` (string): Match ID
- `region` (string): Platform region

**Returns**: Match object with full details

**Example**:
```typescript
const match = await riotAPI.getMatchDetails(matchId, 'na1');
console.log('Game Mode:', match.info.gameMode);
console.log('Participants:', match.info.participants);
```

---

##### `getRankedInfo(summonerId: string, region: string)`
Get ranked information for a summoner.

**Parameters**:
- `summonerId` (string): Summoner ID (not PUUID)
- `region` (string): Platform region

**Returns**: Array of ranked entries

**Example**:
```typescript
const rankedInfo = await riotAPI.getRankedInfo(summonerId, 'na1');
const soloQueue = rankedInfo.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
if (soloQueue) {
  console.log(`${soloQueue.tier} ${soloQueue.rank} ${soloQueue.leaguePoints} LP`);
}
```

#### Error Handling

```typescript
try {
  const summoner = await riotAPI.getSummonerByRiotId(gameName, tagLine, region);
} catch (error) {
  if (error.message.includes('404')) {
    // Summoner not found
  } else if (error.message.includes('403')) {
    // API key invalid or expired
  } else if (error.message.includes('429')) {
    // Rate limit exceeded
  }
}
```

## Data Models

### User

```typescript
interface User {
  id: string;
  discord_id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  roles: string[];
  user_role: 'member' | 'moderator' | 'admin';
  is_yuumi_member: boolean;
  joined_discord_at: Date;
  created_at: Date;
  updated_at: Date;
}
```

### Summoner

```typescript
interface Summoner {
  id: string;
  user_id: string;
  puuid: string;
  summoner_id: string;
  account_id: string;
  name: string;
  tag_line: string;
  region: region_type;
  level: number;
  profile_icon_id: number;
  verified: boolean;
  verification_code: string | null;
  created_at: Date;
  updated_at: Date;
}
```

### Challenge

```typescript
interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  criteria: ChallengeCriteria;
  reward_points: number;
  active: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

type ChallengeType = 
  | 'kda'
  | 'winstreak'
  | 'champion_mastery'
  | 'ranked_climb'
  | 'games_played'
  | 'perfect_game';

interface ChallengeCriteria {
  champion?: string;
  rank?: string;
  kda_threshold?: number;
  win_count?: number;
  games_count?: number;
  time_period?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}
```

### User Challenge Progress

```typescript
interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  max_progress: number;
  completed: boolean;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
```

### Match Data

```typescript
interface MatchData {
  match_id: string;
  summoner_id: string;
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  duration: number;
  game_mode: string;
  created_at: Date;
}
```

### Ranked Information

```typescript
interface RankedInfo {
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  queue_type: string;
}
```

## Database Operations

### Row Level Security (RLS)

All database operations are secured through Supabase RLS policies:

- **Users**: Can view own profile and update own data
- **Summoners**: Can manage own summoners, public can view verified accounts
- **Challenges**: Public can view active challenges, staff can manage
- **User Challenges**: Users can view own progress, update progress
- **Match History**: Users can view own matches
- **Ranked Info**: Public can view verified summoner ranks

### Common Query Patterns

#### Get User Profile with Points
```typescript
const { data } = await supabase
  .from('users')
  .select(`
    *,
    user_points (
      total_points,
      challenges_completed,
      rank_position
    )
  `)
  .eq('id', userId)
  .single();
```

#### Get User's Active Challenges
```typescript
const { data } = await supabase
  .from('user_challenges')
  .select(`
    *,
    challenges (
      title,
      description,
      type,
      reward_points
    )
  `)
  .eq('user_id', userId)
  .eq('completed', false);
```

#### Get Leaderboard
```typescript
const { data } = await supabase
  .from('leaderboard')
  .select('*')
  .limit(50);
```

## Rate Limiting

### Discord API
- **Bot API**: 5 requests per 5 seconds per endpoint
- **OAuth API**: Standard OAuth rate limits
- **Global**: 50 requests per second

### Riot Games API
- **Development Key**: 100 requests per 2 minutes
- **Production Key**: Varies by approved tier
- **Rate limiting headers**: Included in responses

### Implementation

Rate limiting is handled at the API wrapper level:

```typescript
// Example rate limit handling
try {
  const data = await riotAPI.getSummoner(puuid, region);
} catch (error) {
  if (error.status === 429) {
    const retryAfter = error.headers.get('Retry-After');
    // Implement exponential backoff
  }
}
```

## Error Handling

### Standard Error Response Format

```typescript
interface APIError {
  error: string;
  message: string;
  status: number;
  timestamp: string;
}
```

### Common Error Codes

#### Authentication Errors
- **401 Unauthorized**: Missing or invalid session
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: User not found or not a server member

#### External API Errors
- **429 Too Many Requests**: Rate limit exceeded
- **503 Service Unavailable**: External API temporarily down
- **400 Bad Request**: Invalid parameters

#### Database Errors
- **409 Conflict**: Duplicate resource
- **422 Unprocessable Entity**: Validation failed

### Error Handling Example

```typescript
// API route error handling
export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const data = await supabase
      .from('challenges')
      .select('*');

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
```

## Testing

### cURL Examples

#### Authentication Check
```bash
curl -X GET "http://localhost:3000/api/auth/session" \
  -H "Cookie: next-auth.session-token=your-session-token"
```

#### Get User Profile
```bash
curl -X GET "http://localhost:3000/api/users/me" \
  -H "Authorization: Bearer your-session-token" \
  -H "Content-Type: application/json"
```

#### Create Challenge (Future)
```bash
curl -X POST "http://localhost:3000/api/challenges" \
  -H "Authorization: Bearer your-session-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Yuumi KDA Master",
    "description": "Achieve 3.0+ KDA with Yuumi in 5 ranked games",
    "type": "kda",
    "criteria": {
      "champion": "Yuumi",
      "kda_threshold": 3.0,
      "games_count": 5,
      "time_period": "weekly"
    },
    "reward_points": 100
  }'
```

### Integration Testing

The application can be tested with the following approaches:

1. **Discord OAuth**: Test with valid Discord server member
2. **Riot API**: Test with valid League of Legends accounts
3. **Database**: Test with Supabase test environment
4. **Rate Limiting**: Test with multiple rapid requests

## Deployment Considerations

### Environment Variables

Required for production deployment:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Discord
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret
DISCORD_BOT_TOKEN=your-bot-token
YUUMI_DISCORD_SERVER_ID=your-server-id

# Riot Games
RIOT_API_KEY=RGAPI-your-api-key

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-32-character-secret
```

### Security Headers

Recommended security headers for production:

```typescript
// next.config.js
const securityHeaders = [
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
];
```

### Database Migrations

Ensure all migrations are applied in production:

```bash
# Run Supabase migrations
supabase db push
```

### Performance Optimization

1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Caching**: Implement Redis caching for frequently accessed data
3. **Connection Pooling**: Configure Supabase connection pooling
4. **CDN**: Use CDN for static assets and Discord avatars

## Monitoring and Logging

### Application Metrics

Monitor the following metrics:

- **API Response Times**: Track endpoint performance
- **Error Rates**: Monitor 4xx and 5xx responses
- **Database Performance**: Track query execution times
- **External API Usage**: Monitor Discord and Riot API rate limits

### Logging Best Practices

```typescript
// Structured logging example
console.log(JSON.stringify({
  level: 'info',
  message: 'User authenticated',
  userId: user.id,
  discordId: user.discord_id,
  timestamp: new Date().toISOString(),
  requestId: request.headers.get('x-request-id')
}));
```

### Health Checks

Implement health check endpoints:

```typescript
// /api/health
export async function GET() {
  try {
    // Check database connection
    const { data } = await supabase.from('users').select('count').limit(1);
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        auth: 'ok'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    );
  }
}
```

## Future Enhancements

### Planned Features

1. **Real-time Updates**: WebSocket integration for live challenge progress
2. **Advanced Analytics**: Detailed match analysis and statistics
3. **Challenge Templates**: Pre-built challenge configurations
4. **Community Features**: User-generated challenges and voting
5. **Mobile API**: RESTful API for mobile application

### API Versioning

Future API versions will follow semantic versioning:

- **v1**: Current implementation
- **v2**: Enhanced features with backward compatibility
- **v3**: Major breaking changes

### GraphQL Integration

Consider GraphQL implementation for complex queries:

```typescript
// Example GraphQL schema
type User {
  id: ID!
  username: String!
  summoners: [Summoner!]!
  challenges: [UserChallenge!]!
  points: UserPoints
}

type Query {
  me: User
  leaderboard(limit: Int = 50): [User!]!
  challenges(filter: ChallengeFilter): [Challenge!]!
}
```

This comprehensive API documentation covers all current implementations and provides a roadmap for future development. The architecture is designed to be scalable, secure, and maintainable while providing a robust foundation for the League of Legends challenge tracking system.