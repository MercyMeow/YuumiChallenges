# My Challenges Page Implementation Plan

**Route:** `/dashboard/challenges`  
**File Location:** `src/app/dashboard/challenges/page.tsx`  
**Component Name:** `ChallengesPage`

## Overview

The My Challenges page is the central hub for users to track their active challenge progress, browse available challenges, and participate in new ones. This page emphasizes progress visualization, achievement tracking, and community engagement.

## Database Requirements

### Primary Tables
- **user_challenges** - Active user challenge participation with progress tracking
- **challenges** - Available challenge definitions with criteria and rewards
- **summoners** - User's linked League accounts for challenge verification
- **match_history** - Game data for progress calculation
- **user_points** - Point totals and ranking information

### Key Queries Needed
```sql
-- Get user's active challenges with progress
SELECT uc.*, c.title, c.description, c.reward_points, c.type, c.criteria
FROM user_challenges uc
JOIN challenges c ON uc.challenge_id = c.id
WHERE uc.user_id = $1 AND uc.completed = false;

-- Get available challenges user hasn't joined
SELECT c.*
FROM challenges c
WHERE c.active = true 
AND c.id NOT IN (
  SELECT challenge_id FROM user_challenges WHERE user_id = $1
);

-- Get completed challenges for achievements section
SELECT uc.*, c.title, c.reward_points
FROM user_challenges uc
JOIN challenges c ON uc.challenge_id = c.id
WHERE uc.user_id = $1 AND uc.completed = true
ORDER BY uc.completed_at DESC;
```

## Required API Endpoints

### GET `/api/challenges`
```typescript
interface ChallengesResponse {
  active: UserChallenge[];
  available: Challenge[];
  completed: UserChallenge[];
  stats: {
    totalCompleted: number;
    totalPoints: number;
    activeCount: number;
  };
}
```

### POST `/api/challenges/[id]/participate`
```typescript
interface ParticipateRequest {
  challengeId: string;
}
interface ParticipateResponse {
  success: boolean;
  userChallenge: UserChallenge;
}
```

### DELETE `/api/challenges/[id]/leave`
```typescript
interface LeaveResponse {
  success: boolean;
  message: string;
}
```

## Page Architecture

### Layout Structure
```tsx
<DashboardLayout>
  <div className="space-y-8">
    {/* Page Header */}
    <ChallengesHeader stats={userStats} />
    
    {/* Active Challenges Section */}
    <ActiveChallengesSection challenges={activeChallenges} />
    
    {/* Available Challenges Section */}
    <AvailableChallengesSection challenges={availableChallenges} />
    
    {/* Achievements Section */}
    <AchievementsSection completedChallenges={completedChallenges} />
  </div>
</DashboardLayout>
```

## Component Breakdown

### 1. ChallengesHeader
**Purpose:** Display user's challenge statistics and quick actions  
**Props:** `{ stats: ChallengeStats }`

**Features:**
- Total challenges completed
- Total points earned
- Current active challenges count
- Quick filter options (All, KDA, Winstreak, Champion, etc.)

**Styling:**
```tsx
<Card className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-500/20">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    <StatCard icon={Target} label="Active" value={stats.activeCount} />
    <StatCard icon={Trophy} label="Completed" value={stats.totalCompleted} />
    <StatCard icon={Star} label="Points" value={stats.totalPoints} />
    <StatCard icon={TrendingUp} label="Streak" value={stats.currentStreak} />
  </div>
</Card>
```

### 2. ActiveChallengesSection
**Purpose:** Show challenges user is currently participating in  
**Props:** `{ challenges: UserChallenge[] }`

**Features:**
- Progress bars with animated progression
- Time remaining for time-limited challenges
- Quick challenge details on hover
- "Leave Challenge" option
- Progress update animations

**Component Structure:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {activeChallenges.map(challenge => (
    <ActiveChallengeCard 
      key={challenge.id}
      challenge={challenge}
      onLeave={handleLeaveChallenge}
    />
  ))}
</div>
```

### 3. ActiveChallengeCard
**Purpose:** Individual active challenge display with progress  
**Props:** `{ challenge: UserChallenge, onLeave: (id: string) => void }`

**Features:**
- Progress bar with percentage and visual completion indicator
- Challenge type icon and color theming
- Reward points display
- Time remaining (if applicable)
- Leave challenge button

**Styling Pattern:**
```tsx
<Card className="bg-gradient-to-br from-{type-color}-500/5 to-{type-color}-600/5 border-{type-color}-500/20 hover:shadow-lg transition-all duration-300">
  <CardHeader>
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-{type-color}-500/20 rounded-xl">
          <ChallengeTypeIcon className="h-6 w-6 text-{type-color}-400" />
        </div>
        <div>
          <CardTitle className="text-white">{challenge.title}</CardTitle>
          <CardDescription>{challenge.description}</CardDescription>
        </div>
      </div>
      <Badge className="bg-{type-color}-500/20 text-{type-color}-400">
        {challenge.reward_points} pts
      </Badge>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      <Progress 
        value={(challenge.progress / challenge.max_progress) * 100} 
        className="h-3"
      />
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">
          {challenge.progress} / {challenge.max_progress}
        </span>
        <span className="text-{type-color}-400">
          {Math.round((challenge.progress / challenge.max_progress) * 100)}%
        </span>
      </div>
    </div>
  </CardContent>
</Card>
```

### 4. AvailableChallengesSection
**Purpose:** Browse and join new challenges  
**Props:** `{ challenges: Challenge[] }`

**Features:**
- Filter by challenge type
- Search functionality
- Sort by difficulty, points, or popularity
- Challenge preview modal
- "Join Challenge" action

**Component Structure:**
```tsx
<div className="space-y-6">
  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
    <ChallengeFilters 
      selectedType={selectedType}
      onTypeChange={setSelectedType}
    />
    <ChallengeSearch 
      value={searchQuery}
      onChange={setSearchQuery}
    />
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {filteredChallenges.map(challenge => (
      <AvailableChallengeCard 
        key={challenge.id}
        challenge={challenge}
        onJoin={handleJoinChallenge}
        onPreview={handlePreviewChallenge}
      />
    ))}
  </div>
</div>
```

### 5. AvailableChallengeCard
**Purpose:** Display joinable challenges with preview  
**Props:** `{ challenge: Challenge, onJoin: (id: string) => void, onPreview: (challenge: Challenge) => void }`

**Features:**
- Challenge difficulty indicator
- Estimated completion time
- Preview button for detailed criteria
- Join button with confirmation
- Participant count display

### 6. AchievementsSection
**Purpose:** Display completed challenges as achievements  
**Props:** `{ completedChallenges: UserChallenge[] }`

**Features:**
- Timeline view of completed challenges
- Achievement badges with completion dates
- Points earned display
- Share achievement functionality
- Filter by time period (this week, month, all time)

## Challenge Type Handling

### Type-Specific UI Elements

**KDA Challenges:**
- Progress: Current KDA vs target KDA
- Visual: KDA ratio display with color coding
- Icon: `Zap` (yellow theme)

**Winstreak Challenges:**
- Progress: Current streak vs required streak
- Visual: Flame icon with streak counter
- Icon: `Flame` (orange theme)

**Champion Mastery:**
- Progress: Current mastery points vs target
- Visual: Champion icon with mastery badge
- Icon: `Shield` (blue theme)

**Ranked Climb:**
- Progress: Current rank vs target rank
- Visual: Rank emblem progression
- Icon: `TrendingUp` (green theme)

## State Management

### Page-Level State
```typescript
interface ChallengesPageState {
  activeChallenges: UserChallenge[];
  availableChallenges: Challenge[];
  completedChallenges: UserChallenge[];
  loading: boolean;
  error: string | null;
  filters: {
    type: ChallengeType | 'all';
    search: string;
    sortBy: 'difficulty' | 'points' | 'popularity';
  };
}
```

### API Integration
```typescript
// Custom hooks for data fetching
const { data: challengesData, loading, error, refetch } = useChallenges();
const { mutate: joinChallenge, loading: joining } = useJoinChallenge();
const { mutate: leaveChallenge, loading: leaving } = useLeaveChallenge();
```

## Real-Time Updates

### Challenge Progress Updates
- WebSocket connection for real-time progress updates
- Optimistic UI updates for immediate feedback
- Progress bar animations on data changes
- Completion celebrations with confetti animations

### Auto-Refresh Logic
```typescript
// Refresh challenge data when user returns to page
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      refetch();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [refetch]);
```

## Error Handling

### Common Error Scenarios
1. **No Linked Summoners:** Show prompt to link League account
2. **API Errors:** Display retry options with helpful error messages
3. **Network Issues:** Offline mode with cached data
4. **Challenge Join Failures:** Specific error messages for requirements not met

### Error UI Components
```tsx
<Alert className="border-red-500/20 bg-red-500/5">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Unable to join challenge</AlertTitle>
  <AlertDescription>
    You need to link a verified League of Legends account to participate in challenges.
    <Button variant="link" onClick={() => router.push('/dashboard/profile')}>
      Link Account →
    </Button>
  </AlertDescription>
</Alert>
```

## Loading States

### Skeleton Components
```tsx
export function ChallengeCardSkeleton() {
  return (
    <Card className="bg-slate-800/50">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-full mb-2" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}
```

## Accessibility

### Key A11y Features
- Keyboard navigation for all interactive elements
- Screen reader friendly progress announcements
- High contrast mode support
- Focus management for modals and filters
- ARIA labels for progress bars and status indicators

## Performance Considerations

### Optimization Strategies
- Virtualization for large challenge lists
- Image lazy loading for challenge icons
- Debounced search queries
- Cached challenge data with SWR
- Progressive loading of challenge details

## Testing Strategy

### Unit Tests
- Challenge card rendering with different states
- Progress calculation accuracy
- Filter and search functionality
- Join/leave challenge actions

### Integration Tests
- Full page loading with mock API responses
- Challenge progression flow
- Error state handling
- Real-time update simulation

### E2E Tests
- Complete challenge participation flow
- Challenge completion and achievement unlock
- Multi-device challenge progress sync

## Implementation Priority

### Phase 1 (Core Functionality)
1. Basic page layout with active challenges display
2. Challenge joining/leaving functionality
3. Progress tracking and visualization
4. Basic filtering and search

### Phase 2 (Enhanced Features)
1. Real-time progress updates
2. Achievement system
3. Challenge preview modals
4. Advanced filtering options

### Phase 3 (Polish & Performance)
1. Animations and micro-interactions
2. Performance optimizations
3. Advanced error handling
4. Accessibility improvements

## Dependencies

### New Packages Needed
```json
{
  "framer-motion": "^10.16.4", // For animations
  "react-intersection-observer": "^9.5.2", // For lazy loading
  "date-fns": "^2.30.0" // For time calculations
}
```

### Internal Dependencies
- Existing UI components from `src/components/ui/`
- Authentication hook from `src/lib/hooks/use-auth.ts`
- API clients from `src/lib/apis/`
- Type definitions from `src/lib/types/`

## Success Metrics

### User Engagement
- Challenge participation rate
- Average challenges per user
- Challenge completion rate
- Time spent on challenges page

### Technical Performance
- Page load time < 2 seconds
- Challenge data refresh time < 500ms
- Error rate < 1%
- Mobile responsiveness score > 95%