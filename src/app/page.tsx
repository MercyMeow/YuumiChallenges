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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-primary/30"></div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-24">
            <div className="mb-8 relative">
              <div className="text-8xl mb-4 relative inline-block animate-subtle-float">
                <span className="relative z-10">🐱</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/60 blur-3xl opacity-30 animate-subtle-pulse"></div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text text-transparent leading-tight">
              Yuum.Ai Dashboard
            </h1>
            
            <p className="text-xl md:text-3xl text-foreground mb-8 font-medium">
              Professional challenge tracking for League of Legends Yuumi Mains
            </p>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-16 leading-relaxed">
              Track your progress, compete with friends, and excel as an enchanter 
              in the Yuumi Mains Discord community. Master the art of support gameplay 
              with advanced analytics and community challenges.
            </p>
            
            <div className="relative inline-block group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/60 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <Button 
                asChild 
                size="lg" 
                className="relative text-lg px-12 py-4 bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-2xl font-semibold shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <Link href="/auth/signin">
                  Begin Your Journey
                </Link>
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {[
              {
                icon: "🎯",
                title: "Challenge Tracking",
                description: "Complete exciting challenges and track your progress with detailed statistics and performance insights",
                gradient: "from-primary/20 to-primary/10"
              },
              {
                icon: "🏆",
                title: "Leaderboards",
                description: "Compete with other Yuumi players and climb the community rankings across multiple game modes",
                gradient: "from-success/20 to-success/10"
              },
              {
                icon: "📊",
                title: "Game Analytics",
                description: "Get deep insights into your gameplay with detailed match history, statistics, and improvement recommendations",
                gradient: "from-info/20 to-info/10"
              },
              {
                icon: "🖼️",
                title: "Rule Gallery",
                description: "Browse and share Discord server rule GIFs with short links for easy embedding",
                gradient: "from-warning/20 to-warning/10",
                href: "/gallery"
              }
            ].map((feature, index) => (
              <div key={index} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/30 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                {feature.href ? (
                  <Link href={feature.href}>
                    <Card className={`relative bg-gradient-to-br ${feature.gradient} border border-border hover:border-border/60 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer`}>
                      <CardHeader className="text-center">
                        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                          {feature.icon}
                        </div>
                        <CardTitle className="text-foreground text-xl font-bold">
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-muted-foreground text-center leading-relaxed">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <Card className={`relative bg-gradient-to-br ${feature.gradient} border border-border hover:border-border/60 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl`}>
                    <CardHeader className="text-center">
                      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-foreground text-xl font-bold">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-muted-foreground text-center leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>

          {/* Discord CTA */}
          <div className="relative group max-w-4xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-3xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
            <Card className="relative bg-gradient-to-br from-primary/30 to-primary/20 border border-primary/30 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5"></div>
              <CardHeader className="relative text-center pb-4">
                <CardTitle className="text-foreground text-3xl font-bold mb-2">
                  Join the Yuumi Mains Discord
                </CardTitle>
                <CardDescription className="text-muted-foreground text-lg">
                  Connect with thousands of Yuumi players worldwide
                </CardDescription>
              </CardHeader>
              <CardContent className="relative text-center">
                <p className="mb-8 text-muted-foreground text-lg leading-relaxed">
                  You must be a member of our Discord server to access the dashboard. 
                  Join our community to unlock challenges, leaderboards, and connect with fellow enchanters.
                </p>
                <div className="relative inline-block group/btn">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary/60 rounded-xl blur opacity-75 group-hover/btn:opacity-100 transition duration-300"></div>
                  <Button 
                    asChild 
                    variant="secondary"
                    className="relative bg-card hover:bg-card/80 text-card-foreground font-semibold px-8 py-3 rounded-xl transform hover:scale-105 transition-all duration-300 shadow-xl"
                  >
                    <a 
                      href="https://discord.gg/yuumi" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Join Discord Server
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Decoration */}
          <div className="mt-20 text-center">
            <div className="inline-flex items-center gap-4 text-muted-foreground text-sm">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-border"></div>
              <span>Crafted for the Yuumi Community</span>
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-border"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}