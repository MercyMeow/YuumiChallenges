# Database Schema Documentation

This document provides comprehensive documentation for the League of Legends challenge tracking application database. The database is built on PostgreSQL and managed through Supabase with full Row Level Security (RLS) implementation.

## Architecture Overview

The database architecture supports a Discord-integrated League of Legends challenge tracking system with the following core features:

- **User Management**: Discord OAuth integration with role-based access control
- **Summoner Verification**: League account linking with verification system
- **Challenge System**: Flexible challenge creation with multiple types and progress tracking
- **Match Analysis**: Automatic match data collection and challenge progress calculation
- **Leaderboard**: Points-based ranking system with real-time updates
- **Performance Optimization**: Strategic indexing and efficient queries

## Migration History

The database schema is maintained through the following migrations:

1. **001_initial_schema.sql** - Core table structure, types, indexes, and basic triggers
2. **002_rls_policies.sql** - Comprehensive Row Level Security policies
3. **003_functions_and_views.sql** - Business logic functions, triggers, and views

## Custom Types (Enums)

### `user_role`
Defines application-level user permissions.
```sql
CREATE TYPE user_role AS ENUM ('member', 'admin', 'owner');
```
- **member**: Regular Discord server member
- **admin**: Can manage challenges and moderate content
- **owner**: Full system access including user management and role assignment

### `challenge_type`
Specifies the category and evaluation method for challenges.
```sql
CREATE TYPE challenge_type AS ENUM ('kda', 'winstreak', 'champion_mastery', 'ranked_climb', 'games_played', 'perfect_game');
```
- **kda**: Kill/Death/Assist ratio challenges
- **winstreak**: Consecutive win challenges
- **champion_mastery**: Champion-specific performance challenges
- **ranked_climb**: Ranked ladder progression challenges
- **games_played**: Game quantity challenges
- **perfect_game**: Perfect KDA (no deaths) challenges

### `region_type`
Riot Games server regions for League of Legends.
```sql
CREATE TYPE region_type AS ENUM ('na1', 'euw1', 'eun1', 'kr', 'jp1', 'br1', 'la1', 'la2', 'oc1', 'tr1', 'ru', 'ph2', 'sg2', 'th2', 'tw2', 'vn2');
```

## Core Tables

### `users`

Central user table storing Discord authentication data and application permissions.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `UUID` | Primary Key, Default: `gen_random_uuid()` | Unique identifier for the user |
| `discord_id` | `TEXT` | Unique, Not Null | Discord snowflake ID for OAuth integration |
| `username` | `TEXT` | Not Null | Discord display name |
| `discriminator` | `TEXT` | Nullable | Discord discriminator (legacy) |
| `avatar` | `TEXT` | Nullable | Discord CDN URL for user avatar |
| `email` | `TEXT` | Nullable | User's email from Discord OAuth |
| `roles` | `TEXT[]` | Default: `'{}'` | Array of Discord server role names |
| `user_role` | `user_role` | Default: `'member'` | Application-level permission role |
| `joined_discord_at` | `TIMESTAMPTZ` | Nullable | When user joined the Discord server |
| `is_yuumi_member` | `BOOLEAN` | Default: `false` | Verified membership in Yuumi Discord |
| `created_at` | `TIMESTAMPTZ` | Default: `NOW()` | Account creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | Default: `NOW()` | Last profile update timestamp |

**Indexes:**
- `idx_users_discord_id` - Fast OAuth lookups

**Triggers:**
- `update_users_updated_at` - Auto-updates `updated_at` on row changes

### `summoners`

Stores League of Legends account information with verification system.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `UUID` | Primary Key, Default: `gen_random_uuid()` | Unique identifier for the summoner record |
| `user_id` | `UUID` | Foreign Key → `users(id)`, CASCADE DELETE | Owner of this League account |
| `puuid` | `TEXT` | Unique, Not Null | Riot's permanent unique player identifier |
| `summoner_id` | `TEXT` | Not Null | Riot's summoner ID for API calls |
| `account_id` | `TEXT` | Not Null | Riot's account ID (legacy) |
| `name` | `TEXT` | Not Null | Current in-game summoner name |
| `tag_line` | `TEXT` | Not Null | Riot ID tag (e.g., "NA1") |
| `region` | `region_type` | Not Null | Server region for API routing |
| `level` | `INTEGER` | Default: `1` | Summoner level in League |
| `profile_icon_id` | `INTEGER` | Default: `1` | Profile icon ID from Riot |
| `verified` | `BOOLEAN` | Default: `false` | Account ownership verification status |
| `verification_code` | `TEXT` | Nullable | Temporary code for verification |
| `verification_expires_at` | `TIMESTAMPTZ` | Nullable | Verification code expiration |
| `created_at` | `TIMESTAMPTZ` | Default: `NOW()` | Account link creation time |
| `updated_at` | `TIMESTAMPTZ` | Default: `NOW()` | Last account data update |

**Unique Constraints:**
- `(summoner_id, region)` - Prevents duplicate accounts per region
- `puuid` - Global uniqueness across all regions

**Indexes:**
- `idx_summoners_user_id` - User's summoner lookup
- `idx_summoners_puuid` - Riot API integration
- `idx_summoners_region` - Region-based queries

**Triggers:**
- `update_summoners_updated_at` - Auto-updates `updated_at`

### `challenges`

Defines available challenges with flexible criteria system.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `UUID` | Primary Key, Default: `gen_random_uuid()` | Unique challenge identifier |
| `title` | `TEXT` | Not Null | Display name for the challenge |
| `description` | `TEXT` | Not Null | Detailed challenge description |
| `type` | `challenge_type` | Not Null | Challenge category and evaluation method |
| `criteria` | `JSONB` | Not Null | Flexible challenge parameters |
| `reward_points` | `INTEGER` | Default: `0` | Points awarded upon completion |
| `active` | `BOOLEAN` | Default: `true` | Challenge availability status |
| `featured` | `BOOLEAN` | Default: `false` | Homepage/spotlight visibility |
| `created_by` | `UUID` | Foreign Key → `users(id)` | Challenge creator (staff member) |
| `created_at` | `TIMESTAMPTZ` | Default: `NOW()` | Challenge creation time |
| `updated_at` | `TIMESTAMPTZ` | Default: `NOW()` | Last modification time |

**JSONB Criteria Examples:**
```json
// KDA Challenge
{
  "champion": "Yuumi",
  "kda_threshold": 3.0,
  "games_count": 5,
  "time_period": "weekly"
}

// Ranked Climb Challenge
{
  "start_rank": "SILVER",
  "target_rank": "GOLD",
  "queue_type": "RANKED_SOLO_5x5"
}

// Winstreak Challenge
{
  "win_count": 10,
  "champion": "Yuumi",
  "queue_type": "RANKED_SOLO_5x5"
}
```

**Triggers:**
- `update_challenges_updated_at` - Auto-updates `updated_at`

### `user_challenges`

Tracks individual user progress on challenges with completion state.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `UUID` | Primary Key, Default: `gen_random_uuid()` | Unique progress record identifier |
| `user_id` | `UUID` | Foreign Key → `users(id)`, CASCADE DELETE | User participating in challenge |
| `challenge_id` | `UUID` | Foreign Key → `challenges(id)`, CASCADE DELETE | Target challenge |
| `progress` | `INTEGER` | Default: `0` | Current progress value |
| `max_progress` | `INTEGER` | Not Null | Required progress for completion |
| `completed` | `BOOLEAN` | Default: `false` | Completion status flag |
| `completed_at` | `TIMESTAMPTZ` | Nullable | Completion timestamp |
| `created_at` | `TIMESTAMPTZ` | Default: `NOW()` | Challenge start time |
| `updated_at` | `TIMESTAMPTZ` | Default: `NOW()` | Last progress update |

**Unique Constraints:**
- `(user_id, challenge_id)` - One progress record per user per challenge

**Indexes:**
- `idx_user_challenges_user_id` - User's active challenges
- `idx_user_challenges_challenge_id` - Challenge participation stats
- `idx_user_challenges_completed` - Leaderboard queries

**Triggers:**
- `update_user_challenges_updated_at` - Auto-updates `updated_at`
- `update_points_on_challenge_completion` - Awards points when completed

### `match_history`

Stores match data for challenge progress calculation and statistics.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `UUID` | Primary Key, Default: `gen_random_uuid()` | Unique match record identifier |
| `summoner_id` | `UUID` | Foreign Key → `summoners(id)`, CASCADE DELETE | Player who participated |
| `match_id` | `TEXT` | Not Null | Riot's unique match identifier |
| `champion` | `TEXT` | Not Null | Champion played (e.g., "Yuumi") |
| `kills` | `INTEGER` | Default: `0` | Player kills in the match |
| `deaths` | `INTEGER` | Default: `0` | Player deaths in the match |
| `assists` | `INTEGER` | Default: `0` | Player assists in the match |
| `win` | `BOOLEAN` | Not Null | Match outcome for the player |
| `duration` | `INTEGER` | Not Null | Match duration in seconds |
| `game_mode` | `TEXT` | Not Null | Game mode (e.g., "CLASSIC") |
| `queue_id` | `INTEGER` | Not Null | Riot queue identifier |
| `game_creation` | `TIMESTAMPTZ` | Not Null | When the match started |
| `analyzed_for_challenges` | `BOOLEAN` | Default: `false` | Processing status flag |
| `created_at` | `TIMESTAMPTZ` | Default: `NOW()` | Record insertion time |

**Unique Constraints:**
- `(summoner_id, match_id)` - Prevents duplicate match records

**Indexes:**
- `idx_match_history_summoner_id` - Player match lookups
- `idx_match_history_game_creation` - Time-based queries
- `idx_match_history_analyzed` - Processing queue management

**Usage Notes:**
- KDA calculation: `(kills + assists) / max(deaths, 1)`
- Perfect games identified by `deaths = 0`
- Winstreaks calculated from consecutive `win = true` records

### `ranked_info`

Tracks current ranked status across different queue types and seasons.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `UUID` | Primary Key, Default: `gen_random_uuid()` | Unique ranked record identifier |
| `summoner_id` | `UUID` | Foreign Key → `summoners(id)`, CASCADE DELETE | Summoner this rank belongs to |
| `queue_type` | `TEXT` | Not Null | Ranked queue (e.g., "RANKED_SOLO_5x5") |
| `tier` | `TEXT` | Not Null | Rank tier (IRON, BRONZE, SILVER, etc.) |
| `rank_level` | `TEXT` | Not Null | Division within tier (I, II, III, IV) |
| `league_points` | `INTEGER` | Default: `0` | LP within current division |
| `wins` | `INTEGER` | Default: `0` | Season wins for this queue |
| `losses` | `INTEGER` | Default: `0` | Season losses for this queue |
| `hot_streak` | `BOOLEAN` | Default: `false` | Currently on winning streak |
| `veteran` | `BOOLEAN` | Default: `false` | Long-time player in this tier |
| `fresh_blood` | `BOOLEAN` | Default: `false` | Recently promoted to this tier |
| `inactive` | `BOOLEAN` | Default: `false` | Decay warning status |
| `season` | `TEXT` | Not Null | Game season identifier |
| `created_at` | `TIMESTAMPTZ` | Default: `NOW()` | Record creation time |
| `updated_at` | `TIMESTAMPTZ` | Default: `NOW()` | Last rank update |

**Unique Constraints:**
- `(summoner_id, queue_type, season)` - One rank per queue per season

**Indexes:**
- `idx_ranked_info_summoner_id` - Summoner rank lookups

**Common Queue Types:**
- `RANKED_SOLO_5x5` - Solo/Duo queue
- `RANKED_FLEX_SR` - Flex queue
- `RANKED_TFT` - Teamfight Tactics

**Triggers:**
- `update_ranked_info_updated_at` - Auto-updates `updated_at`

### `user_points`

Maintains leaderboard rankings and point totals for all users.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `UUID` | Primary Key, Default: `gen_random_uuid()` | Unique points record identifier |
| `user_id` | `UUID` | Foreign Key → `users(id)`, CASCADE DELETE, UNIQUE | User these points belong to |
| `total_points` | `INTEGER` | Default: `0` | Accumulated points from challenges |
| `challenges_completed` | `INTEGER` | Default: `0` | Count of completed challenges |
| `rank_position` | `INTEGER` | Nullable | Current leaderboard position |
| `created_at` | `TIMESTAMPTZ` | Default: `NOW()` | Points record creation |
| `updated_at` | `TIMESTAMPTZ` | Default: `NOW()` | Last points update |

**Indexes:**
- `idx_user_points_total_points` - Leaderboard sorting (DESC)

**Triggers:**
- `update_user_points_updated_at` - Auto-updates `updated_at`
- `recalculate_ranks_trigger` - Recalculates all positions on changes

**Ranking Logic:**
Primary sort: `total_points DESC`
Tiebreaker: `challenges_completed DESC`

**Auto-population:**
Records created automatically when users complete their first challenge.

## Relationships and Foreign Keys

### Entity Relationship Diagram
```
users (1) ←→ (N) summoners
users (1) ←→ (1) user_points
users (1) ←→ (N) user_challenges
users (1) ←→ (N) challenges [created_by]

summoners (1) ←→ (N) match_history
summoners (1) ←→ (N) ranked_info

challenges (1) ←→ (N) user_challenges
```

### Cascade Behaviors
- **User deletion**: Cascades to summoners, user_challenges, user_points
- **Summoner deletion**: Cascades to match_history, ranked_info
- **Challenge deletion**: Cascades to user_challenges

### Referential Integrity
All foreign key relationships are enforced at the database level with appropriate cascade rules to maintain data consistency.

## Row Level Security (RLS) Policies

All tables have RLS enabled with comprehensive access control policies.

### Authentication Context
Policies use `auth.jwt() ->> 'discord_id'` to identify the current user from NextAuth.js sessions.

### Policy Summary

#### `users` Table
- **SELECT**: Users can view their own profile + public info viewable by all
- **UPDATE**: Users can only update their own profile
- **ALL**: Admins have full access

#### `summoners` Table  
- **ALL**: Users manage their own summoners
- **SELECT**: Public can view verified summoners
- **ALL**: Admins have full access

#### `challenges` Table
- **SELECT**: Public can view active challenges
- **ALL**: Staff (admins/owners) can manage challenges

#### `user_challenges` Table
- **SELECT**: Users view own progress + public can see completions
- **UPDATE**: Users can update their own progress
- **INSERT**: System can create progress records
- **ALL**: Admins have full access

#### `match_history` Table
- **SELECT**: Users view their own match history
- **INSERT/UPDATE**: System can manage match data
- **ALL**: Admins have full access

#### `ranked_info` Table
- **SELECT**: Users view own ranks + public sees verified summoner ranks
- **ALL**: System and admins can manage ranked data

#### `user_points` Table
- **SELECT**: Public can view for leaderboards
- **ALL**: System and admins can update points

## Database Functions

### Trigger Functions

#### `update_updated_at_column()`
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
Automatically updates `updated_at` timestamp on row modifications.

#### `calculate_user_rank()`
```sql
CREATE OR REPLACE FUNCTION calculate_user_rank()
RETURNS TRIGGER AS $$
BEGIN
    WITH ranked_users AS (
        SELECT user_id,
               ROW_NUMBER() OVER (ORDER BY total_points DESC, challenges_completed DESC) as new_rank
        FROM user_points
    )
    UPDATE user_points 
    SET rank_position = ranked_users.new_rank
    FROM ranked_users
    WHERE user_points.user_id = ranked_users.user_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```
Recalculates leaderboard positions when user points change.

#### `update_user_points_on_challenge_completion()`
```sql
CREATE OR REPLACE FUNCTION update_user_points_on_challenge_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
        DECLARE challenge_points INTEGER;
        BEGIN
            SELECT reward_points INTO challenge_points
            FROM challenges WHERE id = NEW.challenge_id;
            
            INSERT INTO user_points (user_id, total_points, challenges_completed)
            VALUES (NEW.user_id, challenge_points, 1)
            ON CONFLICT (user_id) DO UPDATE SET
                total_points = user_points.total_points + challenge_points,
                challenges_completed = user_points.challenges_completed + 1,
                updated_at = NOW();
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
Awards points and updates completion count when challenges are finished.

### Query Functions

#### `get_user_leaderboard_position(UUID)`
Returns the current leaderboard rank for a specific user.

#### `get_user_challenge_progress(UUID, UUID)`
Returns detailed progress information for a user's participation in a specific challenge.

#### `get_user_full_profile(UUID)`
Comprehensive profile query returning user info, points, rank, and all summoners with ranked data in a single JSON response.

## Database Views

### `leaderboard`
Pre-computed leaderboard with badge tiers for efficient display.
```sql
CREATE VIEW leaderboard AS
SELECT 
    u.id, u.username, u.avatar,
    up.total_points, up.challenges_completed, up.rank_position,
    CASE 
        WHEN up.rank_position <= 3 THEN 'gold'
        WHEN up.rank_position <= 10 THEN 'silver'
        WHEN up.rank_position <= 50 THEN 'bronze'
        ELSE 'normal'
    END as badge_tier
FROM users u
JOIN user_points up ON u.id = up.user_id
ORDER BY up.rank_position ASC;
```

### `challenges_with_stats`
Active challenges with participation and completion analytics.
```sql
CREATE VIEW challenges_with_stats AS
SELECT 
    c.*,
    COUNT(uc.id) as total_participants,
    COUNT(CASE WHEN uc.completed THEN 1 END) as total_completions,
    ROUND(
        COUNT(CASE WHEN uc.completed THEN 1 END)::numeric / 
        NULLIF(COUNT(uc.id), 0) * 100, 2
    ) as completion_rate
FROM challenges c
LEFT JOIN user_challenges uc ON c.id = uc.challenge_id
WHERE c.active = true
GROUP BY c.id
ORDER BY c.created_at DESC;
```

### `user_summoner_overview`
Consolidated view of verified summoners with their ranked information.
```sql
CREATE VIEW user_summoner_overview AS
SELECT 
    u.id as user_id, u.username, u.avatar,
    s.id as summoner_id, s.name as summoner_name, s.tag_line, s.region, s.level, s.verified,
    ri.tier, ri.rank_level, ri.league_points, ri.wins, ri.losses,
    CASE 
        WHEN ri.wins + ri.losses > 0 
        THEN ROUND(ri.wins::numeric / (ri.wins + ri.losses) * 100, 1)
        ELSE 0 
    END as win_rate
FROM users u
JOIN summoners s ON u.id = s.user_id
LEFT JOIN ranked_info ri ON s.id = ri.summoner_id AND ri.queue_type = 'RANKED_SOLO_5x5'
WHERE s.verified = true;
```

## Performance Optimization

### Strategic Indexing
- **Primary Keys**: All tables use UUID primary keys with B-tree indexes
- **Foreign Keys**: Indexed for efficient JOIN operations
- **Query Patterns**: Indexes on frequently filtered columns
- **Leaderboard**: Descending index on `total_points` for fast ranking
- **Time-series**: Indexes on timestamp columns for temporal queries

### Query Optimization Tips
```sql
-- Efficient leaderboard pagination
SELECT * FROM leaderboard 
WHERE rank_position BETWEEN 1 AND 50;

-- Fast user challenge lookup
SELECT * FROM user_challenges 
WHERE user_id = $1 AND completed = true;

-- Recent matches for a summoner
SELECT * FROM match_history 
WHERE summoner_id = $1 
ORDER BY game_creation DESC 
LIMIT 20;
```

## Common Usage Examples

### Challenge Progress Tracking
```sql
-- Update challenge progress
UPDATE user_challenges 
SET progress = progress + 1,
    completed = CASE WHEN progress + 1 >= max_progress THEN true ELSE false END,
    completed_at = CASE WHEN progress + 1 >= max_progress THEN NOW() ELSE NULL END
WHERE user_id = $1 AND challenge_id = $2;
```

### Leaderboard Queries
```sql
-- Top 10 players
SELECT username, total_points, challenges_completed, rank_position
FROM leaderboard 
LIMIT 10;

-- User's rank and nearby players
WITH user_rank AS (
    SELECT rank_position FROM user_points WHERE user_id = $1
)
SELECT * FROM leaderboard 
WHERE rank_position BETWEEN (SELECT rank_position - 5 FROM user_rank) 
                        AND (SELECT rank_position + 5 FROM user_rank);
```

### Match Analysis
```sql
-- Calculate KDA for recent matches
SELECT 
    champion,
    AVG((kills + assists)::numeric / GREATEST(deaths, 1)) as avg_kda,
    COUNT(*) as games_played,
    COUNT(CASE WHEN win THEN 1 END)::numeric / COUNT(*) * 100 as win_rate
FROM match_history 
WHERE summoner_id = $1 
  AND game_creation > NOW() - INTERVAL '30 days'
GROUP BY champion
ORDER BY avg_kda DESC;
```

## Migration Management

The schema is version-controlled through sequential migration files:

1. **001_initial_schema.sql**: Foundation tables, types, indexes
2. **002_rls_policies.sql**: Security policies and access control  
3. **003_functions_and_views.sql**: Business logic and query optimization

Future migrations should follow the pattern `NNN_descriptive_name.sql` and be applied in order to maintain schema consistency across environments.

## Security Considerations

- **Row Level Security**: Comprehensive RLS prevents unauthorized data access
- **Input Validation**: All user inputs validated before database insertion
- **API Authentication**: Discord OAuth integration with role-based permissions
- **Sensitive Data**: No plaintext passwords or API keys in database
- **Audit Trail**: All tables include creation and modification timestamps
