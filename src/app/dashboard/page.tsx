'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { user, isAuthenticated, isLoading, isYuumiMember } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect to signin
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome to Yuum.Ai Dashboard</h1>
            <p className="text-muted-foreground">Manage your challenges and track your progress</p>
          </div>
          <Button onClick={() => signOut({ callbackUrl: '/' })} variant="outline">
            Sign Out
          </Button>
        </div>

        {/* User Profile Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Discord information and server status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                <AvatarFallback>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <p className="text-muted-foreground">Discord ID: {user.discord_id}</p>
                <div className="flex space-x-2 mt-2">
                  <Badge variant={isYuumiMember ? 'default' : 'destructive'}>
                    {isYuumiMember ? '✅ Yuumi Member' : '❌ Not a Yuumi Member'}
                  </Badge>
                  <Badge variant="outline">
                    {user.user_role.charAt(0).toUpperCase() + user.user_role.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>

            {!isYuumiMember && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ You&apos;re not detected as a member of the Yuumi Mains Discord server. 
                  Some features may be limited. Please ensure you&apos;ve joined the server and try signing in again.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🎯</span>
                <span>My Challenges</span>
              </CardTitle>
              <CardDescription>View and track your active challenges</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📊</span>
                <span>League Profile</span>
              </CardTitle>
              <CardDescription>Link your League of Legends accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🏆</span>
                <span>Leaderboard</span>
              </CardTitle>
              <CardDescription>See how you rank against other players</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>

          {user.user_role !== 'member' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>⚙️</span>
                  <span>Admin Panel</span>
                </CardTitle>
                <CardDescription>Manage challenges and users</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Coming soon...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}