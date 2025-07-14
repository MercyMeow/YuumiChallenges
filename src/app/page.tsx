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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-purple-400/30"></div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Magical Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(147,51,234,0.3)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.3)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(139,69,234,0.2)_0%,_transparent_50%)]"></div>
      </div>

      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute animate-pulse top-1/4 left-1/4 w-2 h-2 bg-purple-400/60 rounded-full shadow-lg shadow-purple-400/30"></div>
        <div className="absolute animate-pulse delay-1000 top-3/4 left-3/4 w-1 h-1 bg-blue-400/60 rounded-full shadow-lg shadow-blue-400/30"></div>
        <div className="absolute animate-pulse delay-2000 top-1/2 left-1/6 w-1.5 h-1.5 bg-indigo-400/60 rounded-full shadow-lg shadow-indigo-400/30"></div>
        <div className="absolute animate-pulse delay-500 top-1/6 left-2/3 w-1 h-1 bg-purple-300/60 rounded-full shadow-lg shadow-purple-300/30"></div>
        <div className="absolute animate-pulse delay-1500 bottom-1/4 right-1/4 w-2 h-2 bg-blue-300/60 rounded-full shadow-lg shadow-blue-300/30"></div>
        <div className="absolute animate-float delay-700 top-1/3 left-1/2 w-1.5 h-1.5 bg-violet-400/50 rounded-full shadow-lg shadow-violet-400/30"></div>
        <div className="absolute animate-float delay-300 top-2/3 left-1/5 w-1 h-1 bg-cyan-400/50 rounded-full shadow-lg shadow-cyan-400/30"></div>
        <div className="absolute animate-float delay-1200 top-1/5 left-4/5 w-2 h-2 bg-fuchsia-400/40 rounded-full shadow-lg shadow-fuchsia-400/30"></div>
      </div>

      
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-24">
            <div className="mb-8 relative">
              <div className="text-8xl mb-4 relative inline-block animate-float">
                <span className="relative z-10">🐱</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 blur-3xl opacity-30 animate-glow"></div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 bg-gradient-to-r from-purple-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent leading-tight">
              Yuum.Ai Dashboard
            </h1>
            
            <p className="text-xl md:text-3xl text-landing-text-primary mb-8 font-medium">
              Professional challenge tracking for League of Legends Yuumi Mains
            </p>
            
            <p className="text-lg md:text-xl text-landing-text-secondary/80 max-w-3xl mx-auto mb-16 leading-relaxed">
              Track your progress, compete with friends, and excel as an enchanter 
              in the Yuumi Mains Discord community. Master the art of support gameplay 
              with advanced analytics and community challenges.
            </p>
            
            <div className="relative inline-block group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <Button 
                asChild 
                size="lg" 
                className="relative text-lg px-12 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 rounded-2xl font-semibold shadow-2xl transform hover:scale-105 transition-all duration-300"
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
                gradient: "from-purple-500/20 to-pink-500/20"
              },
              {
                icon: "🏆",
                title: "Leaderboards",
                description: "Compete with other Yuumi players and climb the community rankings across multiple game modes",
                gradient: "from-blue-500/20 to-cyan-500/20"
              },
              {
                icon: "📊",
                title: "Game Analytics",
                description: "Get deep insights into your gameplay with detailed match history, statistics, and improvement recommendations",
                gradient: "from-indigo-500/20 to-purple-500/20"
              },
              {
                icon: "🖼️",
                title: "Rule Gallery",
                description: "Browse and share Discord server rule GIFs with short links for easy embedding",
                gradient: "from-cyan-500/20 to-teal-500/20",
                href: "/gallery"
              }
            ].map((feature, index) => (
              <div key={index} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/50 to-blue-500/50 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                {feature.href ? (
                  <Link href={feature.href}>
                    <Card className={`relative backdrop-blur-md bg-gradient-to-br ${feature.gradient} border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer`}>
                      <CardHeader className="text-center">
                        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                          {feature.icon}
                        </div>
                        <CardTitle className="text-white text-xl font-bold">
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-landing-text-primary/80 text-center leading-relaxed">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <Card className={`relative backdrop-blur-md bg-gradient-to-br ${feature.gradient} border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl`}>
                    <CardHeader className="text-center">
                      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-white text-xl font-bold">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-landing-text-primary/80 text-center leading-relaxed">
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
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-3xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
            <Card className="relative backdrop-blur-md bg-gradient-to-br from-purple-600/30 to-blue-600/30 border border-white/30 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10"></div>
              <CardHeader className="relative text-center pb-4">
                <CardTitle className="text-white text-3xl font-bold mb-2">
                  Join the Yuumi Mains Discord
                </CardTitle>
                <CardDescription className="text-landing-text-primary text-lg">
                  Connect with thousands of Yuumi players worldwide
                </CardDescription>
              </CardHeader>
              <CardContent className="relative text-center">
                <p className="mb-8 text-landing-text-primary text-lg leading-relaxed">
                  You must be a member of our Discord server to access the dashboard. 
                  Join our community to unlock challenges, leaderboards, and connect with fellow enchanters.
                </p>
                <div className="relative inline-block group/btn">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl blur opacity-75 group-hover/btn:opacity-100 transition duration-300"></div>
                  <Button 
                    asChild 
                    variant="secondary"
                    className="relative bg-white/90 hover:bg-white text-purple-700 hover:text-purple-800 font-semibold px-8 py-3 rounded-xl transform hover:scale-105 transition-all duration-300 shadow-xl"
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