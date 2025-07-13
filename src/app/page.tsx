'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <div className="mb-8">
              <span className="text-8xl">🐱</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Yuum.Ai Dashboard
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Professional challenge tracking for League of Legends Yuumi Mains
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
              Track your progress, compete with friends, and excel as an enchanter 
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
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-primary-foreground">Join the Yuumi Mains Discord</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Connect with thousands of Yuumi players worldwide
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-primary-foreground/90">
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