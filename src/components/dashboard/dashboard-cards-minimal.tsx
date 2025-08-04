'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Minimal ChallengesCard for testing
export function ChallengesCard() {
  return (
    <Card className="h-full border-purple-500/30 bg-black/20 backdrop-blur-md">
      <CardHeader>
        <CardTitle>My Challenges</CardTitle>
        <CardDescription>Active challenges and progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="py-8 text-center">
          <p className="text-gray-400">No active challenges yet</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Minimal LeagueProfileCard for testing
export function LeagueProfileCard() {
  return (
    <Card className="h-full border-blue-500/30 bg-black/20 backdrop-blur-md">
      <CardHeader>
        <CardTitle>League Profile</CardTitle>
        <CardDescription>Your League of Legends stats</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="py-8 text-center">
          <p className="text-gray-400">League profile information</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
}