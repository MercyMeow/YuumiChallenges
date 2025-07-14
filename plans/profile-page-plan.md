# League Profile Page Implementation Plan

**Route:** `/dashboard/profile`  
**File Location:** `src/app/dashboard/profile/page.tsx`  
**Component Name:** `ProfilePage`

## Overview

The League Profile page serves as the central hub for users to manage their League of Legends accounts, view detailed statistics, analyze match history, and monitor their performance across different champions and game modes. This page emphasizes account verification, data visualization, and performance tracking.

## Database Requirements

### Primary Tables
- **summoners** - User's linked League accounts with verification status
- **match_history** - Detailed game data with KDA, champion, queue type
- **ranked_info** - Current and historical rank data across queue types
- **users** - Base user information and Discord integration
- **user_challenges** - Challenge progress tied to summoner performance

### Key Queries Needed
```sql
-- Get user's verified summoners with current rank
SELECT s.*, ri.tier, ri.rank, ri.league_points, ri.wins, ri.losses
FROM summoners s
LEFT JOIN ranked_info ri ON s.id = ri.summoner_id 
WHERE s.user_id = $1 AND s.verified = true
ORDER BY s.is_primary DESC, s.created_at;

-- Get recent match history with performance stats
SELECT mh.*, 
  (mh.kills + mh.assists) / NULLIF(mh.deaths, 0) as kda_ratio,
  mh.champion_name,
  mh.queue_type,
  mh.game_duration,
  mh.win
FROM match_history mh
WHERE mh.summoner_id = $1
ORDER BY mh.game_creation DESC
LIMIT 20;

-- Get champion performance statistics
SELECT 
  champion_name,
  COUNT(*) as games_played,
  SUM(CASE WHEN win THEN 1 ELSE 0 END) as wins,
  AVG(kills) as avg_kills,
  AVG(deaths) as avg_deaths,
  AVG(assists) as avg_assists,
  AVG((kills + assists) / NULLIF(deaths, 0)) as avg_kda
FROM match_history 
WHERE summoner_id = $1
GROUP BY champion_name
ORDER BY games_played DESC, avg_kda DESC;
```

## Required API Endpoints

### GET `/api/summoners`
```typescript
interface SummonersResponse {
  summoners: Summoner[];
  stats: {
    totalGames: number;
    overallKDA: number;
    favoriteChampion: string;
    currentRank: string;
  };
}
```

### POST `/api/summoners`
```typescript
interface AddSummonerRequest {
  gameName: string;
  tagLine: string;
  region: string;
}
interface AddSummonerResponse {
  success: boolean;
  summoner: Summoner;
  verificationCode?: string;
}
```

### PUT `/api/summoners/[id]/verify`
```typescript
interface VerifyRequest {
  verificationCode: string;
}
interface VerifyResponse {
  success: boolean;
  verified: boolean;
  message: string;
}
```

### DELETE `/api/summoners/[id]`
```typescript
interface RemoveSummonerResponse {
  success: boolean;
  message: string;
}
```

### GET `/api/summoners/[id]/matches`
```typescript
interface MatchHistoryResponse {
  matches: MatchData[];
  pagination: {
    hasMore: boolean;
    nextCursor: string;
  };
}
```

### GET `/api/summoners/[id]/stats`
```typescript
interface SummonerStatsResponse {
  champion_stats: ChampionStat[];
  rank_history: RankEntry[];
  performance_trends: PerformanceTrend[];
}
```

## Page Architecture

### Layout Structure
```tsx
<DashboardLayout>
  <div className="space-y-8">
    {/* Page Header */}
    <ProfileHeader user={user} />
    
    {/* Summoner Accounts Section */}
    <SummonersSection 
      summoners={summoners} 
      onAdd={handleAddSummoner}
      onVerify={handleVerifySummoner}
      onRemove={handleRemoveSummoner}
    />
    
    {/* Performance Overview */}
    <PerformanceOverview stats={performanceStats} />
    
    {/* Match History */}
    <MatchHistorySection matches={matches} />
    
    {/* Champion Statistics */}
    <ChampionStatsSection championStats={championStats} />
  </div>
</DashboardLayout>
```

## Component Breakdown

### 1. ProfileHeader
**Purpose:** Display user information and overall League performance  
**Props:** `{ user: User }`

**Features:**
- Discord profile information
- Overall performance metrics
- Account verification status
- Quick action buttons

**Styling:**
```tsx
<Card className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border-purple-500/20">
  <CardContent className="p-6">
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20 border-2 border-purple-500/30">
          <AvatarImage src={user.image} />
          <AvatarFallback>{user.name?.[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-white">{user.name}</h1>
          <p className="text-gray-400">Discord Member Since 2021</p>
          <div className="flex items-center gap-2 mt-2">
            {user.is_yuumi_member && (
              <Badge className="bg-purple-500/20 text-purple-400">
                <Crown className="h-3 w-3 mr-1" />
                Yuumi Main
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 ml-auto">
        <StatCard label="Total Games" value={stats.totalGames} />
        <StatCard label="Overall KDA" value={stats.overallKDA} />
        <StatCard label="Favorite Champion" value={stats.favoriteChampion} />
      </div>
    </div>
  </CardContent>
</Card>
```

### 2. SummonersSection
**Purpose:** Manage linked League of Legends accounts  
**Props:** `{ summoners: Summoner[], onAdd, onVerify, onRemove }`

**Features:**
- List all linked summoner accounts
- Add new summoner with region selection
- Account verification process
- Set primary account
- Remove unverified accounts

**Component Structure:**
```tsx
<Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="flex items-center gap-2">
          <GamepadIcon className="h-5 w-5 text-blue-400" />
          League Accounts
        </CardTitle>
        <CardDescription>
          Manage your League of Legends summoner accounts
        </CardDescription>
      </div>
      <AddSummonerDialog onAdd={onAdd} />
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {summoners.map(summoner => (
        <SummonerCard 
          key={summoner.id}
          summoner={summoner}
          onVerify={onVerify}
          onRemove={onRemove}
        />
      ))}
      {summoners.length === 0 && (
        <EmptyState 
          title="No League accounts linked"
          description="Add your League of Legends account to start tracking your performance"
          action={<AddSummonerDialog onAdd={onAdd} />}
        />
      )}
    </div>
  </CardContent>
</Card>
```

### 3. SummonerCard
**Purpose:** Display individual summoner account with actions  
**Props:** `{ summoner: Summoner, onVerify, onRemove }`

**Features:**
- Summoner name and region
- Current rank with tier icon
- Verification status indicator
- Primary account badge
- Quick action buttons

**Verification States:**
```tsx
// Verified Account
<div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
  <div className="flex items-center space-x-3">
    <div className="p-2 bg-green-500/20 rounded-lg">
      <Shield className="h-5 w-5 text-green-400" />
    </div>
    <div>
      <h3 className="font-semibold text-white">{summoner.game_name}#{summoner.tag_line}</h3>
      <p className="text-sm text-gray-400">{summoner.region.toUpperCase()} • Level {summoner.summoner_level}</p>
    </div>
    {summoner.is_primary && (
      <Badge className="bg-purple-500/20 text-purple-400">Primary</Badge>
    )}
  </div>
  <div className="flex items-center space-x-2">
    <RankBadge rank={summoner.current_rank} />
    <Button variant="ghost" size="sm" onClick={() => onRemove(summoner.id)}>
      <X className="h-4 w-4" />
    </Button>
  </div>
</div>

// Unverified Account
<div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
  <div className="flex items-center space-x-3">
    <div className="p-2 bg-yellow-500/20 rounded-lg">
      <Clock className="h-5 w-5 text-yellow-400" />
    </div>
    <div>
      <h3 className="font-semibold text-white">{summoner.game_name}#{summoner.tag_line}</h3>
      <p className="text-sm text-gray-400">Verification required</p>
    </div>
  </div>
  <div className="flex items-center space-x-2">
    <Button variant="outline" size="sm" onClick={() => onVerify(summoner.id)}>
      Verify Account
    </Button>
    <Button variant="ghost" size="sm" onClick={() => onRemove(summoner.id)}>
      <X className="h-4 w-4" />
    </Button>
  </div>
</div>
```

### 4. AddSummonerDialog
**Purpose:** Modal for adding new League accounts  
**Props:** `{ onAdd: (data: AddSummonerRequest) => void }`

**Features:**
- Summoner name and tag input with validation
- Region selection dropdown
- Real-time summoner lookup
- Error handling for invalid accounts

**Form Structure:**
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30">
      <Plus className="h-4 w-4 mr-2" />
      Add Account
    </Button>
  </DialogTrigger>
  <DialogContent className="bg-slate-900 border-slate-700">
    <DialogHeader>
      <DialogTitle>Add League Account</DialogTitle>
      <DialogDescription>
        Link your League of Legends account to track your performance
      </DialogDescription>
    </DialogHeader>
    
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gameName">Summoner Name</Label>
          <Input 
            id="gameName"
            placeholder="YuumiMain"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            className="bg-slate-800 border-slate-600"
          />
        </div>
        <div>
          <Label htmlFor="tagLine">Tag Line</Label>
          <Input 
            id="tagLine"
            placeholder="NA1"
            value={tagLine}
            onChange={(e) => setTagLine(e.target.value)}
            className="bg-slate-800 border-slate-600"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="region">Region</Label>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="bg-slate-800 border-slate-600">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="na1">North America</SelectItem>
            <SelectItem value="euw1">Europe West</SelectItem>
            <SelectItem value="eun1">Europe Nordic</SelectItem>
            <SelectItem value="kr">Korea</SelectItem>
            <SelectItem value="jp1">Japan</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Account"}
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
```

### 5. PerformanceOverview
**Purpose:** High-level performance metrics and trends  
**Props:** `{ stats: PerformanceStats }`

**Features:**
- KDA trend chart
- Win rate by queue type
- Recent performance indicators
- Champion mastery highlights

**Chart Integration:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-green-400" />
        Performance Trends
      </CardTitle>
    </CardHeader>
    <CardContent>
      <KDAChart data={stats.kdaTrends} />
    </CardContent>
  </Card>
  
  <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
    <CardHeader>
      <CardTitle>Win Rate by Queue</CardTitle>
    </CardHeader>
    <CardContent>
      <WinRateChart data={stats.queueWinRates} />
    </CardContent>
  </Card>
</div>
```

### 6. MatchHistorySection
**Purpose:** Recent match history with detailed game information  
**Props:** `{ matches: MatchData[] }`

**Features:**
- Infinite scroll for match loading
- Match result indicators (win/loss)
- Champion images and items
- KDA and game duration
- Click to expand for detailed stats

**Match Card Structure:**
```tsx
<Card className={`${match.win ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'} hover:shadow-lg transition-all`}>
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img 
            src={getChampionImage(match.champion_name)} 
            alt={match.champion_name}
            className="w-12 h-12 rounded-lg"
          />
          <div className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full px-1 text-xs">
            {match.champion_level}
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold text-white">{match.champion_name}</h3>
          <p className="text-sm text-gray-400">{getQueueName(match.queue_type)}</p>
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-lg font-bold text-white">
          {match.kills}/{match.deaths}/{match.assists}
        </div>
        <div className={`text-sm ${match.win ? 'text-green-400' : 'text-red-400'}`}>
          {((match.kills + match.assists) / Math.max(match.deaths, 1)).toFixed(2)} KDA
        </div>
      </div>
      
      <div className="text-right">
        <div className={`font-semibold ${match.win ? 'text-green-400' : 'text-red-400'}`}>
          {match.win ? 'Victory' : 'Defeat'}
        </div>
        <div className="text-sm text-gray-400">
          {formatGameDuration(match.game_duration)}
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

### 7. ChampionStatsSection
**Purpose:** Champion performance statistics and mastery  
**Props:** `{ championStats: ChampionStat[] }`

**Features:**
- Champion mastery levels
- Win rates and KDA by champion
- Most played champions
- Performance comparisons

## Account Verification Flow

### Step 1: Add Account
1. User inputs summoner name, tag, and region
2. System validates account exists via Riot API
3. If valid, creates unverified summoner record
4. Generates unique verification code

### Step 2: In-Game Verification
1. User must create a custom item set with verification code as name
2. System polls Riot API for item sets
3. When verification code found, marks account as verified
4. Enables challenge participation for that account

### Verification UI Flow
```tsx
// Verification Modal
<Dialog open={verificationOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Verify Your Account</DialogTitle>
      <DialogDescription>
        Follow these steps to verify account ownership
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <h3 className="font-semibold text-blue-400 mb-2">Step 1: Copy Verification Code</h3>
        <div className="flex items-center space-x-2">
          <code className="bg-slate-800 px-3 py-1 rounded font-mono text-sm">
            {verificationCode}
          </code>
          <Button size="sm" onClick={() => copyToClipboard(verificationCode)}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
        <h3 className="font-semibold text-purple-400 mb-2">Step 2: Create Item Set</h3>
        <ol className="text-sm space-y-1 text-gray-400">
          <li>1. Open League of Legends client</li>
          <li>2. Go to Collection → Item Sets</li>
          <li>3. Create new item set</li>
          <li>4. Name it exactly: "{verificationCode}"</li>
          <li>5. Save the item set</li>
        </ol>
      </div>
      
      <div className="flex items-center justify-center space-x-2">
        <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></div>
        <span className="text-sm text-gray-400">Checking for verification...</span>
      </div>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setVerificationOpen(false)}>
        Cancel
      </Button>
      <Button onClick={checkVerification} disabled={checking}>
        {checking ? "Checking..." : "Check Again"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Data Synchronization

### Match History Updates
```typescript
// Automatic match history syncing
const syncMatchHistory = async (summonerId: string) => {
  const lastMatch = await getLastMatchDate(summonerId);
  const newMatches = await RiotAPI.getMatchHistory(summonerId, { since: lastMatch });
  
  for (const match of newMatches) {
    await saveMatchData(match);
    await updateChallengeProgress(summonerId, match);
  }
};

// Scheduled sync every 30 minutes for active users
useEffect(() => {
  const interval = setInterval(() => {
    if (user.summoners?.length > 0) {
      user.summoners.forEach(summoner => {
        if (summoner.verified) {
          syncMatchHistory(summoner.id);
        }
      });
    }
  }, 30 * 60 * 1000); // 30 minutes

  return () => clearInterval(interval);
}, [user.summoners]);
```

### Real-Time Rank Updates
```typescript
// WebSocket connection for live rank updates
const { data: rankUpdate } = useWebSocket(`/ws/ranks/${summoner.id}`);

useEffect(() => {
  if (rankUpdate) {
    // Update UI with new rank information
    setSummoners(prev => prev.map(s => 
      s.id === rankUpdate.summonerId 
        ? { ...s, current_rank: rankUpdate.newRank }
        : s
    ));
  }
}, [rankUpdate]);
```

## Error Handling

### Common Error Scenarios
1. **Invalid Summoner:** Show helpful error with suggested corrections
2. **Account Already Linked:** Inform user if account is linked to another user
3. **Verification Timeout:** Provide retry option with new code
4. **API Rate Limits:** Display queue position and estimated wait time
5. **Region Mismatch:** Suggest correct region based on summoner data

### Error UI Components
```tsx
// Summoner Not Found Error
<Alert className="border-red-500/20 bg-red-500/5">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Summoner not found</AlertTitle>
  <AlertDescription>
    We couldn't find a summoner with that name and tag. Please check:
    <ul className="mt-2 list-disc list-inside text-sm space-y-1">
      <li>Spelling of summoner name</li>
      <li>Correct tag line (e.g., #NA1)</li>
      <li>Selected region matches your account</li>
    </ul>
  </AlertDescription>
</Alert>

// Rate Limit Error
<Alert className="border-yellow-500/20 bg-yellow-500/5">
  <Clock className="h-4 w-4" />
  <AlertTitle>Please wait</AlertTitle>
  <AlertDescription>
    Too many requests. Please try again in {waitTime} seconds.
  </AlertDescription>
</Alert>
```

## Performance Considerations

### Data Loading Strategy
- Load summoner list immediately
- Lazy load match history on scroll
- Cache champion images and static data
- Debounce verification checks
- Implement request deduplication

### Optimization Techniques
```typescript
// Memoized champion stats calculation
const championStats = useMemo(() => {
  return matches.reduce((acc, match) => {
    const champion = acc[match.champion_name] || {
      games: 0,
      wins: 0,
      totalKills: 0,
      totalDeaths: 0,
      totalAssists: 0
    };
    
    champion.games++;
    if (match.win) champion.wins++;
    champion.totalKills += match.kills;
    champion.totalDeaths += match.deaths;
    champion.totalAssists += match.assists;
    
    acc[match.champion_name] = champion;
    return acc;
  }, {});
}, [matches]);

// Virtualized match history for performance
const virtualizedMatches = useVirtualizer({
  count: matches.length,
  getScrollElement: () => scrollElementRef.current,
  estimateSize: () => 80,
});
```

## Accessibility Features

### Key A11y Implementations
- Keyboard navigation for all forms and actions
- Screen reader announcements for verification status
- High contrast mode for rank badges and status indicators
- Focus management in modals and dialogs
- ARIA labels for champion images and match results

## Mobile Responsiveness

### Responsive Design Patterns
```tsx
// Mobile-optimized match card
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Mobile: Stack vertically */}
  <div className="md:hidden space-y-2">
    <div className="flex items-center justify-between">
      <ChampionInfo champion={match.champion_name} />
      <MatchResult result={match.win} />
    </div>
    <KDADisplay kda={match} />
    <GameDetails duration={match.game_duration} queue={match.queue_type} />
  </div>
  
  {/* Desktop: Horizontal layout */}
  <div className="hidden md:flex items-center justify-between">
    {/* Desktop layout components */}
  </div>
</div>
```

## Testing Strategy

### Unit Tests
- Summoner addition and verification flow
- KDA calculation accuracy
- Champion statistics aggregation
- Error handling for invalid inputs

### Integration Tests
- Complete account verification process
- Match history data synchronization
- Real-time updates and WebSocket integration
- Cross-device account management

### E2E Tests
- Full summoner linking workflow
- Account verification with item sets
- Performance data accuracy
- Multi-account management

## Implementation Priority

### Phase 1 (Core Account Management)
1. Basic summoner account display
2. Add/remove summoner functionality
3. Account verification system
4. Primary account designation

### Phase 2 (Performance Data)
1. Match history display with pagination
2. Basic champion statistics
3. Current rank display
4. Performance overview charts

### Phase 3 (Advanced Features)
1. Real-time data synchronization
2. Advanced performance analytics
3. Match details modal
4. Export functionality

### Phase 4 (Polish & Optimization)
1. Performance optimizations
2. Advanced error handling
3. Offline mode support
4. Mobile app-like experience

## Dependencies

### New Packages Needed
```json
{
  "recharts": "^2.8.0", // For performance charts
  "react-window": "^1.8.8", // For virtualized lists
  "react-intersection-observer": "^9.5.2", // For infinite scroll
  "copy-to-clipboard": "^3.3.3" // For verification code copying
}
```

### API Integration Requirements
- Riot Games API key with appropriate rate limits
- WebSocket server for real-time updates
- Background job system for match history syncing
- Image CDN for champion and item assets

## Success Metrics

### User Engagement
- Account verification completion rate
- Average accounts per user
- Profile page time spent
- Match history exploration depth

### Data Quality
- Match history accuracy vs Riot API
- Verification success rate
- Data synchronization speed
- Error rate for account operations

### Performance Metrics
- Page load time < 3 seconds
- Match history scroll performance > 60fps
- Verification check response time < 2 seconds
- Mobile responsiveness score > 95%