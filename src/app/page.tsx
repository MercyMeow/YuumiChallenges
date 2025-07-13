'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 dark:from-purple-900 dark:via-pink-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <div className="mb-8">
              <span className="text-8xl">🐱</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Yuum.Ai Dashboard
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              The magical challenge platform for League of Legends Yuumi Mains
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
              Track your progress, compete with friends, and become the ultimate enchanter 
              in the Yuumi Mains Discord community.
            </p>
            
            <Button asChild size="lg" className="text-lg px-8 py-3">
              <Link href="/auth/signin">
                Get Started
              </Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card>
              <CardHeader>
                <div className="text-3xl mb-2">🎯</div>
                <CardTitle>Challenge Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Complete exciting challenges and track your progress with detailed statistics
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-3xl mb-2">🏆</div>
                <CardTitle>Leaderboards</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Compete with other Yuumi players and climb the community rankings
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-3xl mb-2">📊</div>
                <CardTitle>Game Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get insights into your gameplay with detailed match history and statistics
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Discord CTA */}
          <Card className="bg-[#5865F2] text-white">
            <CardHeader>
              <CardTitle className="text-white">Join the Yuumi Mains Discord</CardTitle>
              <CardDescription className="text-blue-100">
                Connect with thousands of Yuumi players worldwide
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                You must be a member of our Discord server to access the dashboard
              </p>
              <Button asChild variant="secondary">
                <a 
                  href="https://discord.gg/yuumi" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Join Discord Server
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}