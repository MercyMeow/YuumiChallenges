'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { YuumiIcon } from '@/components/ui/datadragon-image';

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
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {/* Magical Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(147,51,234,0.3)_0%,_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.3)_0%,_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(139,69,234,0.2)_0%,_transparent_50%)]"></div>
        </div>
        
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yuumi-purple"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-yuumi-purple/30"></div>
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

      {/* Subtle Animated Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute animate-subtle-pulse top-1/4 left-1/4 w-1.5 h-1.5 bg-yuumi-purple/40 rounded-full shadow-lg shadow-yuumi-purple/20"></div>
        <div className="absolute animate-subtle-pulse delay-1000 top-3/4 left-3/4 w-1 h-1 bg-yuumi-blue/40 rounded-full shadow-lg shadow-yuumi-blue/20"></div>
        <div className="absolute animate-subtle-pulse delay-2000 top-1/2 left-1/6 w-1.5 h-1.5 bg-yuumi-teal/40 rounded-full shadow-lg shadow-yuumi-teal/20"></div>
        <div className="absolute animate-subtle-pulse delay-500 top-1/6 left-2/3 w-1 h-1 bg-yuumi-pink/40 rounded-full shadow-lg shadow-yuumi-pink/20"></div>
        <div className="absolute animate-subtle-float delay-700 top-1/3 left-1/2 w-1.5 h-1.5 bg-primary/40 rounded-full shadow-lg shadow-primary/20"></div>
        <div className="absolute animate-subtle-float delay-300 top-2/3 left-1/5 w-1 h-1 bg-yuumi-teal/40 rounded-full shadow-lg shadow-yuumi-teal/20"></div>
        <div className="absolute animate-float delay-500 top-5/6 left-5/6 w-2 h-2 bg-yuumi-purple/30 rounded-full shadow-lg shadow-yuumi-purple/20"></div>
        <div className="absolute animate-float delay-1000 top-1/6 left-1/3 w-1.5 h-1.5 bg-yuumi-blue/30 rounded-full shadow-lg shadow-yuumi-blue/20"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-24">
            <div className="mb-8 relative">
              <div className="relative inline-block animate-subtle-float">
                <div className="relative z-10 rounded-3xl overflow-hidden">
                  <YuumiIcon size="xl" className="rounded-3xl shadow-2xl border-2 border-yuumi-purple/30" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-yuumi-purple to-yuumi-blue blur-3xl opacity-30 animate-glow"></div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 bg-gradient-to-r from-landing-text-primary via-yuumi-blue to-yuumi-purple bg-clip-text text-transparent leading-tight animate-gradient">
              Yuum.Ai Dashboard
            </h1>
            
            <p className="text-xl md:text-3xl text-landing-text-primary mb-8 font-medium">
              Professional challenge tracking for League of Legends Yuumi Mains
            </p>
            
            <p className="text-lg md:text-xl text-landing-text-secondary max-w-3xl mx-auto mb-16 leading-relaxed">
              Track your progress, compete with friends, and excel as an enchanter 
              in the Yuumi Mains Discord community. Master the art of support gameplay 
              with advanced analytics and community challenges.
            </p>
            
            <div className="relative inline-block group">
              <div className="absolute -inset-1 bg-gradient-to-r from-yuumi-purple to-yuumi-blue rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <Button 
                asChild 
                size="lg" 
                className="relative text-lg px-12 py-4 bg-gradient-to-r from-yuumi-purple to-yuumi-blue hover:from-yuumi-purple/90 hover:to-yuumi-blue/90 text-white border-0 rounded-2xl font-semibold shadow-2xl transform hover:scale-105 transition-all duration-300"
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
                gradient: "from-yuumi-purple/10 to-yuumi-purple/5",
                borderColor: "yuumi-purple"
              },
              {
                icon: "🏆",
                title: "Leaderboards",
                description: "Compete with other Yuumi players and climb the community rankings across multiple game modes",
                gradient: "from-yuumi-blue/10 to-yuumi-blue/5",
                borderColor: "yuumi-blue"
              },
              {
                icon: "📊",
                title: "Game Analytics",
                description: "Get deep insights into your gameplay with detailed match history, statistics, and improvement recommendations",
                gradient: "from-yuumi-teal/10 to-yuumi-teal/5",
                borderColor: "yuumi-teal"
              },
              {
                icon: "🖼️",
                title: "Rule Gallery",
                description: "Browse and share Discord server rule GIFs with short links for easy embedding",
                gradient: "from-yuumi-pink/10 to-yuumi-pink/5",
                borderColor: "yuumi-pink",
                href: "/gallery"
              }
            ].map((feature, index) => {
              const borderGradient = feature.borderColor === 'yuumi-purple' 
                ? 'from-yuumi-purple/50 to-yuumi-purple/30' 
                : feature.borderColor === 'yuumi-blue'
                ? 'from-yuumi-blue/50 to-yuumi-blue/30'
                : feature.borderColor === 'yuumi-teal'
                ? 'from-yuumi-teal/50 to-yuumi-teal/30'
                : 'from-yuumi-pink/50 to-yuumi-pink/30';
              
              const borderClass = feature.borderColor === 'yuumi-purple'
                ? 'border-yuumi-purple/20 hover:border-yuumi-purple/40'
                : feature.borderColor === 'yuumi-blue'
                ? 'border-yuumi-blue/20 hover:border-yuumi-blue/40'
                : feature.borderColor === 'yuumi-teal'
                ? 'border-yuumi-teal/20 hover:border-yuumi-teal/40'
                : 'border-yuumi-pink/20 hover:border-yuumi-pink/40';

              return (
                <div key={index} className="group relative">
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${borderGradient} rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300`}></div>
                  {feature.href ? (
                    <Link href={feature.href}>
                      <Card className={`relative backdrop-blur-md bg-gradient-to-br ${feature.gradient} border ${borderClass} transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer h-full`}>
                        <CardHeader className="text-center">
                          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                            {feature.icon}
                          </div>
                          <CardTitle className="text-landing-text-primary text-xl font-bold">
                            {feature.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-landing-text-secondary text-center leading-relaxed">
                            {feature.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </Link>
                  ) : (
                    <Card className={`relative backdrop-blur-md bg-gradient-to-br ${feature.gradient} border ${borderClass} transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl h-full`}>
                      <CardHeader className="text-center">
                        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                          {feature.icon}
                        </div>
                        <CardTitle className="text-landing-text-primary text-xl font-bold">
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-landing-text-secondary text-center leading-relaxed">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>

          {/* Discord CTA */}
          <div className="relative group max-w-4xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-yuumi-purple via-yuumi-blue to-yuumi-teal rounded-3xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
            <Card className="relative backdrop-blur-md bg-gradient-to-br from-card/60 to-card/40 border border-yuumi-purple/30 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yuumi-purple/10 to-yuumi-blue/5"></div>
              <CardHeader className="relative text-center pb-4">
                <CardTitle className="text-landing-text-primary text-3xl font-bold mb-2">
                  Join the Yuumi Mains Discord
                </CardTitle>
                <CardDescription className="text-landing-text-secondary text-lg">
                  Connect with thousands of Yuumi players worldwide
                </CardDescription>
              </CardHeader>
              <CardContent className="relative text-center">
                <p className="mb-8 text-landing-text-secondary text-lg leading-relaxed">
                  You must be a member of our Discord server to access the dashboard. 
                  Join our community to unlock challenges, leaderboards, and connect with fellow enchanters.
                </p>
                <div className="relative inline-block group/btn">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#5865F2] to-[#4752C4] rounded-xl blur opacity-75 group-hover/btn:opacity-100 transition duration-300"></div>
                  <Button 
                    asChild 
                    variant="secondary"
                    className="relative bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold px-8 py-3 rounded-xl transform hover:scale-105 transition-all duration-300 shadow-xl"
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
            <div className="inline-flex items-center gap-4 text-landing-text-secondary/60 text-sm">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-yuumi-purple/50"></div>
              <span>Crafted with 💜 for the Yuumi Community</span>
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-yuumi-purple/50"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}