'use client';

import { signIn, getSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already signed in
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleDiscordSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('discord', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

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
      </div>


      {/* Back to Home Link */}
      <div className="fixed top-6 left-6 z-50">
        <Button 
          asChild
          variant="ghost" 
          size="sm"
          className="backdrop-blur-md bg-card/50 text-landing-text-primary hover:bg-card/70 hover:text-landing-text-primary border border-border/50"
        >
          <Link href="/">
            ← Back to Home
          </Link>
        </Button>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Main Sign In Card */}
          <div className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-yuumi-purple/30 to-yuumi-blue/30 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            <Card className="relative backdrop-blur-md bg-gradient-to-br from-card/80 to-card/60 border border-border/50 rounded-3xl shadow-2xl">
              <CardHeader className="text-center pb-6 pt-8">
                {/* Animated Yuumi Icon */}
                <div className="mb-6 relative">
                  <div className="text-6xl mb-4 relative inline-block animate-subtle-float">
                    <span className="relative z-10">🐱</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yuumi-purple to-yuumi-blue blur-2xl opacity-20 animate-glow"></div>
                  </div>
                </div>
                
                <CardTitle className="text-3xl font-bold mb-3 bg-gradient-to-r from-landing-text-primary to-yuumi-blue bg-clip-text text-transparent">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-landing-text-secondary text-lg leading-relaxed">
                  Sign in with Discord to access your Yuumi Mains challenge dashboard and track your League progress
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 px-8 pb-8">
                {/* Discord Sign In Button */}
                <div className="relative group/btn">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#5865F2] to-[#4752C4] rounded-xl blur opacity-50 group-hover/btn:opacity-75 transition duration-300"></div>
                  <Button
                    onClick={handleDiscordSignIn}
                    disabled={isLoading}
                    className="relative w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold py-4 text-lg rounded-xl transform hover:scale-[1.01] transition-all duration-300 shadow-xl"
                    size="lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Connecting to Discord...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                        </svg>
                        <span>Continue with Discord</span>
                      </div>
                    )}
                  </Button>
                </div>

                {/* Features Preview */}
                <div className="mt-8 pt-6 border-t border-border/50">
                  <p className="text-center text-landing-text-secondary/80 text-sm mb-4 font-medium">
                    What awaits you:
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="group">
                      <div className="text-2xl mb-2 group-hover:scale-105 transition-transform duration-300">🎯</div>
                      <p className="text-xs text-landing-text-secondary/70">Challenges</p>
                    </div>
                    <div className="group">
                      <div className="text-2xl mb-2 group-hover:scale-105 transition-transform duration-300">🏆</div>
                      <p className="text-xs text-landing-text-secondary/70">Leaderboards</p>
                    </div>
                    <div className="group">
                      <div className="text-2xl mb-2 group-hover:scale-105 transition-transform duration-300">📊</div>
                      <p className="text-xs text-landing-text-secondary/70">Analytics</p>
                    </div>
                  </div>
                </div>

                {/* Terms and Requirements */}
                <div className="text-center space-y-2 pt-4">
                  <p className="text-xs text-landing-text-secondary/60">
                    By signing in, you agree to our terms of service
                  </p>
                  <p className="text-xs text-landing-text-secondary/60 font-medium">
                    💎 Yuumi Mains Discord membership required
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Discord CTA */}
          <div className="text-center">
            <p className="text-landing-text-secondary/80 text-sm mb-4">
              Not a member yet?
            </p>
            <Button 
              asChild
              variant="outline"
              size="sm"
              className="backdrop-blur-md bg-card/30 hover:bg-card/50 text-landing-text-primary border border-border/50 hover:border-border/70"
            >
              <a 
                href="https://discord.gg/yuumi" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2"
              >
                <span>Join Discord Server</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}