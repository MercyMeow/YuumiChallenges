# Admin Panel Page Implementation Plan

**Route:** `/admin`  
**File Location:** `src/app/admin/page.tsx`  
**Component Name:** `AdminPage`

## Overview

The Admin Panel is a comprehensive administrative interface for managing the Yuumi challenge tracking system. This page provides moderators and administrators with tools to create and manage challenges, monitor user activity, moderate content, and maintain the overall health of the community platform.

## Access Control

### Role-Based Access
- **Visibility:** Only shown to users with `user_role !== 'member'` (moderators and admins)
- **Permissions:** Tiered access based on role level
- **Authentication:** Requires valid Discord OAuth session with server membership

### Permission Levels
```typescript
interface AdminPermissions {
  // Moderator permissions
  viewUsers: boolean;
  viewChallenges: boolean;
  viewReports: boolean;
  moderateContent: boolean;
  
  // Admin permissions (includes all moderator permissions)
  createChallenges: boolean;
  editChallenges: boolean;
  deleteChallenges: boolean;
  manageUsers: boolean;
  viewSystemStats: boolean;
  manageRoles: boolean;
  systemSettings: boolean;
}
```

## Database Requirements

### Administrative Tables
- **challenges** - Challenge management with creation/modification tracking
- **users** - User management with role assignment and activity monitoring
- **user_challenges** - Progress monitoring and manual adjustments
- **match_history** - Data integrity checks and manual corrections
- **admin_actions** - Audit log of all administrative actions
- **reports** - User reports and moderation queue
- **system_settings** - Configurable application settings

### Key Queries Needed
```sql
-- Admin dashboard statistics
SELECT 
  (SELECT COUNT(*) FROM users WHERE is_yuumi_member = true) as total_users,
  (SELECT COUNT(*) FROM users WHERE last_activity > NOW() - INTERVAL '7 days') as active_users,
  (SELECT COUNT(*) FROM challenges WHERE active = true) as active_challenges,
  (SELECT COUNT(*) FROM user_challenges WHERE completed = true) as completed_challenges,
  (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports;

-- Recent user activity with roles
SELECT 
  u.id,
  u.name,
  u.image,
  u.user_role,
  u.is_yuumi_member,
  u.last_activity,
  COUNT(uc.id) as total_challenges,
  SUM(CASE WHEN uc.completed THEN 1 ELSE 0 END) as completed_challenges
FROM users u
LEFT JOIN user_challenges uc ON u.id = uc.user_id
WHERE u.last_activity > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name, u.image, u.user_role, u.is_yuumi_member, u.last_activity
ORDER BY u.last_activity DESC
LIMIT 50;

-- Challenge management data
SELECT 
  c.id,
  c.title,
  c.description,
  c.type,
  c.reward_points,
  c.active,
  c.created_at,
  c.updated_at,
  COUNT(uc.id) as participants,
  SUM(CASE WHEN uc.completed THEN 1 ELSE 0 END) as completions,
  AVG(uc.progress / uc.max_progress * 100) as avg_progress
FROM challenges c
LEFT JOIN user_challenges uc ON c.id = uc.challenge_id
GROUP BY c.id, c.title, c.description, c.type, c.reward_points, c.active, c.created_at, c.updated_at
ORDER BY c.created_at DESC;

-- System audit log
SELECT 
  aa.id,
  aa.admin_id,
  u.name as admin_name,
  aa.action_type,
  aa.target_type,
  aa.target_id,
  aa.details,
  aa.created_at
FROM admin_actions aa
JOIN users u ON aa.admin_id = u.id
ORDER BY aa.created_at DESC
LIMIT 100;
```

## Required API Endpoints

### GET `/api/admin/dashboard`
```typescript
interface AdminDashboardResponse {
  stats: {
    totalUsers: number;
    activeUsers: number;
    activeChallenges: number;
    completedChallenges: number;
    pendingReports: number;
  };
  recentActivity: RecentActivity[];
  systemHealth: SystemHealth;
  alerts: SystemAlert[];
}
```

### GET `/api/admin/users`
```typescript
interface AdminUsersResponse {
  users: AdminUserView[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface AdminUserView {
  id: string;
  name: string;
  image: string;
  discord_id: string;
  user_role: string;
  is_yuumi_member: boolean;
  last_activity: string;
  total_challenges: number;
  completed_challenges: number;
  total_points: number;
  created_at: string;
}
```

### PUT `/api/admin/users/[id]/role`
```typescript
interface UpdateUserRoleRequest {
  newRole: 'member' | 'moderator' | 'admin';
  reason: string;
}
```

### GET `/api/admin/challenges`
```typescript
interface AdminChallengesResponse {
  challenges: AdminChallengeView[];
  stats: {
    totalChallenges: number;
    activeChallenges: number;
    avgParticipation: number;
    avgCompletionRate: number;
  };
}
```

### POST `/api/admin/challenges`
```typescript
interface CreateChallengeRequest {
  title: string;
  description: string;
  type: ChallengeType;
  criteria: ChallengeCriteria;
  reward_points: number;
  active: boolean;
  start_date?: string;
  end_date?: string;
}
```

### GET `/api/admin/reports`
```typescript
interface AdminReportsResponse {
  reports: UserReport[];
  stats: {
    pending: number;
    resolved: number;
    dismissed: number;
  };
}
```

### GET `/api/admin/audit`
```typescript
interface AuditLogResponse {
  actions: AuditLogEntry[];
  pagination: PaginationInfo;
}
```

## Page Architecture

### Layout Structure
```tsx
<DashboardLayout>
  <div className="space-y-8">
    {/* Admin Header with Role Indicator */}
    <AdminHeader user={user} />
    
    {/* Admin Navigation */}
    <AdminNavigation 
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      permissions={permissions}
    />
    
    {/* Dynamic Content Based on Section */}
    <div className="min-h-[600px]">
      {activeSection === 'dashboard' && (
        <AdminDashboard stats={dashboardStats} />
      )}
      {activeSection === 'users' && (
        <UserManagement users={users} />
      )}
      {activeSection === 'challenges' && (
        <ChallengeManagement challenges={challenges} />
      )}
      {activeSection === 'reports' && (
        <ReportsManagement reports={reports} />
      )}
      {activeSection === 'audit' && (
        <AuditLog auditEntries={auditEntries} />
      )}
      {activeSection === 'settings' && (
        <SystemSettings settings={systemSettings} />
      )}
    </div>
  </div>
</DashboardLayout>
```

## Component Breakdown

### 1. AdminHeader
**Purpose:** Display admin panel header with user role and quick actions  
**Props:** `{ user: User }`

**Features:**
- Admin role badge with permissions indicator
- Quick statistics overview
- System health status
- Emergency actions (if needed)

**Styling:**
```tsx
<Card className="bg-gradient-to-br from-red-500/5 via-orange-500/5 to-amber-500/5 border-red-500/20">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-red-500/20 rounded-xl">
          <Shield className="h-8 w-8 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <div className="flex items-center space-x-2 mt-1">
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              <Crown className="h-3 w-3 mr-1" />
              {user.user_role === 'admin' ? 'Administrator' : 'Moderator'}
            </Badge>
            <span className="text-sm text-gray-400">
              Welcome back, {user.name}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-center">
          <div className="text-lg font-bold text-white">{stats.pendingReports}</div>
          <div className="text-xs text-gray-400">Pending Reports</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">{stats.activeUsers}</div>
          <div className="text-xs text-gray-400">Active Users</div>
        </div>
        <SystemHealthIndicator health={systemHealth} />
      </div>
    </div>
  </CardContent>
</Card>
```

### 2. AdminNavigation
**Purpose:** Navigation between different admin sections  
**Props:** `{ activeSection: string, onSectionChange: Function, permissions: AdminPermissions }`

**Features:**
- Role-based section visibility
- Badge indicators for pending actions
- Responsive design with mobile sheet

**Navigation Sections:**
```typescript
const adminSections = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: BarChart3, 
    permission: 'viewUsers',
    badge: null 
  },
  { 
    id: 'users', 
    label: 'User Management', 
    icon: Users, 
    permission: 'viewUsers',
    badge: null 
  },
  { 
    id: 'challenges', 
    label: 'Challenges', 
    icon: Target, 
    permission: 'viewChallenges',
    badge: null 
  },
  { 
    id: 'reports', 
    label: 'Reports', 
    icon: Flag, 
    permission: 'viewReports',
    badge: pendingReports 
  },
  { 
    id: 'audit', 
    label: 'Audit Log', 
    icon: FileText, 
    permission: 'viewUsers',
    badge: null 
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: Settings, 
    permission: 'systemSettings',
    badge: null 
  },
];
```

### 3. AdminDashboard
**Purpose:** Overview of system statistics and recent activity  
**Props:** `{ stats: AdminDashboardStats }`

**Features:**
- Key metrics cards
- Recent activity timeline
- System health monitoring
- Quick action buttons

**Dashboard Layout:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Stats Cards */}
  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
    <StatCard
      title="Total Users"
      value={stats.totalUsers}
      change={stats.userGrowth}
      icon={Users}
      color="blue"
    />
    <StatCard
      title="Active Challenges"
      value={stats.activeChallenges}
      change={stats.challengeGrowth}
      icon={Target}
      color="green"
    />
    <StatCard
      title="Completed Challenges"
      value={stats.completedChallenges}
      change={stats.completionGrowth}
      icon={CheckCircle}
      color="purple"
    />
    <StatCard
      title="Pending Reports"
      value={stats.pendingReports}
      urgent={stats.pendingReports > 5}
      icon={AlertTriangle}
      color="red"
    />
  </div>
  
  {/* Recent Activity */}
  <div className="lg:col-span-1">
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RecentActivityFeed activities={recentActivity} />
      </CardContent>
    </Card>
  </div>
</div>
```

### 4. UserManagement
**Purpose:** Manage user accounts, roles, and activity  
**Props:** `{ users: AdminUserView[] }`

**Features:**
- User search and filtering
- Role assignment interface
- Activity monitoring
- Bulk actions for user management

**User Management Table:**
```tsx
<Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>User Management</CardTitle>
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left p-2">User</th>
            <th className="text-left p-2">Role</th>
            <th className="text-left p-2">Activity</th>
            <th className="text-left p-2">Challenges</th>
            <th className="text-left p-2">Points</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <UserRow 
              key={user.id} 
              user={user} 
              onRoleChange={handleRoleChange}
              onViewProfile={handleViewProfile}
            />
          ))}
        </tbody>
      </table>
    </div>
  </CardContent>
</Card>
```

### 5. ChallengeManagement
**Purpose:** Create, edit, and manage challenges  
**Props:** `{ challenges: AdminChallengeView[] }`

**Features:**
- Challenge creation form
- Challenge editing interface
- Activation/deactivation controls
- Participant statistics

**Challenge Management Interface:**
```tsx
<div className="space-y-6">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-xl font-bold text-white">Challenge Management</h2>
      <p className="text-gray-400">Create and manage community challenges</p>
    </div>
    <Button 
      onClick={() => setShowCreateForm(true)}
      className="bg-green-500/20 hover:bg-green-500/30 text-green-400"
    >
      <Plus className="h-4 w-4 mr-2" />
      Create Challenge
    </Button>
  </div>
  
  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
    {challenges.map(challenge => (
      <ChallengeManagementCard
        key={challenge.id}
        challenge={challenge}
        onEdit={handleEditChallenge}
        onToggleActive={handleToggleActive}
        onDelete={handleDeleteChallenge}
      />
    ))}
  </div>
</div>
```

### 6. ChallengeCreationForm
**Purpose:** Form for creating new challenges  
**Props:** `{ onSubmit: Function, onCancel: Function }`

**Features:**
- Challenge type selection
- Criteria configuration
- Reward points assignment
- Preview functionality

**Form Structure:**
```tsx
<Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
  <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
    <DialogHeader>
      <DialogTitle>Create New Challenge</DialogTitle>
      <DialogDescription>
        Design a new challenge for the community
      </DialogDescription>
    </DialogHeader>
    
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Challenge Title</Label>
          <Input
            id="title"
            placeholder="Epic KDA Challenge"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="type">Challenge Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kda">KDA Challenge</SelectItem>
              <SelectItem value="winstreak">Win Streak</SelectItem>
              <SelectItem value="champion_mastery">Champion Mastery</SelectItem>
              <SelectItem value="ranked_climb">Ranked Climb</SelectItem>
              <SelectItem value="games_played">Games Played</SelectItem>
              <SelectItem value="perfect_game">Perfect Game</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Achieve a KDA of 2.0 or higher in 10 consecutive games"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="reward_points">Reward Points</Label>
          <Input
            id="reward_points"
            type="number"
            min="1"
            max="1000"
            value={formData.reward_points}
            onChange={(e) => setFormData({...formData, reward_points: parseInt(e.target.value)})}
            required
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData({...formData, active: checked})}
          />
          <Label htmlFor="active">Activate immediately</Label>
        </div>
      </div>
      
      {/* Dynamic criteria configuration based on challenge type */}
      <ChallengeCriteriaConfig
        type={formData.type}
        criteria={formData.criteria}
        onChange={(criteria) => setFormData({...formData, criteria})}
      />
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Challenge'}
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
```

### 7. ReportsManagement
**Purpose:** Handle user reports and moderation  
**Props:** `{ reports: UserReport[] }`

**Features:**
- Report queue management
- Report details and evidence
- Moderation actions
- Report resolution tracking

### 8. AuditLog
**Purpose:** Track all administrative actions  
**Props:** `{ auditEntries: AuditLogEntry[] }`

**Features:**
- Chronological action log
- Action type filtering
- Administrator identification
- Change details and timestamps

## Security Features

### Action Auditing
```typescript
// Log all administrative actions
const logAdminAction = async (action: AdminAction) => {
  await db.adminActions.create({
    data: {
      admin_id: currentUser.id,
      action_type: action.type,
      target_type: action.targetType,
      target_id: action.targetId,
      details: action.details,
      ip_address: getClientIP(),
      user_agent: getUserAgent(),
    }
  });
};
```

### Role-Based Access Control
```typescript
// Middleware for admin routes
const requireAdminRole = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user || user.user_role === 'member') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    if (requiredPermission === 'admin' && user.user_role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  };
};
```

### Input Validation
```typescript
// Validation schemas for admin actions
const createChallengeSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  type: z.enum(['kda', 'winstreak', 'champion_mastery', 'ranked_climb', 'games_played', 'perfect_game']),
  reward_points: z.number().min(1).max(1000),
  criteria: z.object({
    target_value: z.number().min(0),
    game_count: z.number().min(1).optional(),
    queue_types: z.array(z.string()).optional(),
  }),
  active: z.boolean(),
});
```

## Error Handling

### Admin-Specific Errors
```tsx
// Permission denied error
<Alert className="border-red-500/20 bg-red-500/5">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Access Denied</AlertTitle>
  <AlertDescription>
    You don't have permission to perform this action. Contact a system administrator if you believe this is an error.
  </AlertDescription>
</Alert>

// System error with admin context
<Alert className="border-yellow-500/20 bg-yellow-500/5">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>System Error</AlertTitle>
  <AlertDescription>
    A system error occurred while processing your request. This incident has been logged.
    <div className="mt-2 text-xs text-gray-400">
      Error ID: {errorId} | Time: {timestamp}
    </div>
  </AlertDescription>
</Alert>
```

## Performance Considerations

### Large Dataset Handling
```typescript
// Paginated admin data loading
const useAdminData = (type: string, page: number, filters: any) => {
  return useSWR(
    ['admin', type, page, filters],
    () => fetchAdminData(type, page, filters),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );
};

// Virtual scrolling for large user lists
const VirtualizedUserList = ({ users }) => {
  const virtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 20,
  });
  
  // Render virtual items
};
```

### Real-Time Updates
```typescript
// WebSocket for admin notifications
const useAdminNotifications = () => {
  const { data: notification } = useWebSocket('/ws/admin');
  
  useEffect(() => {
    if (notification) {
      // Handle real-time admin updates
      switch (notification.type) {
        case 'new_report':
          showNotification('New report received', 'warning');
          break;
        case 'system_alert':
          showNotification(notification.message, 'error');
          break;
        case 'user_action':
          // Update relevant data
          break;
      }
    }
  }, [notification]);
};
```

## Testing Strategy

### Unit Tests
- Permission checking logic
- Form validation
- Data transformation functions
- Component rendering with different roles

### Integration Tests
- Complete admin workflows
- Role-based access control
- Data modification operations
- Audit logging functionality

### E2E Tests
- Full administrative task completion
- Multi-user permission scenarios
- System health monitoring
- Report handling workflows

## Implementation Priority

### Phase 1 (Core Admin Functions)
1. Basic admin dashboard with statistics
2. User management interface
3. Role assignment functionality
4. Basic audit logging

### Phase 2 (Challenge Management)
1. Challenge creation and editing
2. Challenge activation/deactivation
3. Participant monitoring
4. Challenge statistics

### Phase 3 (Advanced Features)
1. Reports management system
2. Advanced audit logging
3. System health monitoring
4. Bulk operations

### Phase 4 (Optimization & Security)
1. Performance optimizations
2. Advanced security features
3. Automated moderation tools
4. Advanced analytics

## Dependencies

### New Packages Needed
```json
{
  "zod": "^3.22.4", // Input validation
  "@hookform/resolvers": "^3.3.2", // Form validation
  "react-hook-form": "^7.47.0", // Form management
  "date-fns": "^2.30.0", // Date formatting
  "@tanstack/react-virtual": "^3.0.0" // Virtual scrolling
}
```

### Security Requirements
- Enhanced session management for admin users
- IP address logging for sensitive actions
- Rate limiting for admin endpoints
- Encrypted audit log storage

## Success Metrics

### Administrative Efficiency
- Time to complete common admin tasks
- Number of admin actions per session
- Error rate for admin operations
- User satisfaction with admin tools

### System Health
- Response time for admin operations
- System uptime during admin usage
- Data integrity after admin changes
- Security incident prevention rate

### Community Management
- Report resolution time
- User satisfaction with moderation
- Challenge engagement rates
- Community growth metrics