'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { YuumiIcon } from '@/components/ui/datadragon-image';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

const errorMessages = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification token has expired or has already been used.',
  Default: 'An error occurred during authentication.',
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') as keyof typeof errorMessages;
  
  const errorMessage = errorMessages[error] || errorMessages.Default;

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
        <div className="absolute animate-subtle-pulse top-1/4 left-1/4 w-1.5 h-1.5 bg-red-500/40 rounded-full shadow-lg shadow-red-500/20"></div>
        <div className="absolute animate-subtle-pulse delay-1000 top-3/4 left-3/4 w-1 h-1 bg-orange-500/40 rounded-full shadow-lg shadow-orange-500/20"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/30 to-orange-500/30 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            <Card className="relative backdrop-blur-md bg-gradient-to-br from-card/80 to-card/60 border border-red-500/20 rounded-3xl shadow-2xl">
              <CardHeader className="text-center pb-6 pt-8">
                {/* Animated Yuumi Icon with error styling */}
                <div className="mb-6 relative">
                  <div className="relative inline-block animate-subtle-float">
                    <div className="relative z-10 rounded-3xl overflow-hidden opacity-70">
                      <YuumiIcon size="lg" className="rounded-3xl shadow-2xl border-2 border-red-500/30" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 blur-2xl opacity-20 animate-pulse"></div>
                  </div>
                  <div className="absolute -top-2 -right-2 p-2 bg-red-500/20 rounded-full backdrop-blur-sm">
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                  </div>
                </div>
                
                <CardTitle className="text-3xl font-bold mb-3 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  Authentication Error
                </CardTitle>
                <CardDescription className="text-landing-text-secondary text-lg">
                  Something went wrong during sign in
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 px-8 pb-8">
                <div className="text-center">
                  <div className="bg-black/30 backdrop-blur-md border border-red-500/20 rounded-xl p-4 mb-4">
                    <p className="text-landing-text-secondary">
                      {errorMessage}
                    </p>
                  </div>
                  
                  {error === 'AccessDenied' && (
                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4 backdrop-blur-md">
                      <p className="text-sm text-yellow-300">
                        💎 You must be a member of the Yuumi Mains Discord server to access this application.
                      </p>
                      <a 
                        href="https://discord.gg/yuumi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center mt-2 text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                      >
                        Join Discord Server →
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="relative group/btn">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-yuumi-purple to-yuumi-blue rounded-xl blur opacity-50 group-hover/btn:opacity-75 transition duration-300"></div>
                    <Button asChild className="relative w-full bg-gradient-to-r from-yuumi-purple to-yuumi-blue hover:from-yuumi-purple/90 hover:to-yuumi-blue/90 text-white font-semibold py-3 rounded-xl transform hover:scale-[1.01] transition-all duration-300 shadow-xl">
                      <Link href="/auth/signin" className="flex items-center justify-center">
                        <RefreshCw className="h-5 w-5 mr-2" />
                        Try Again
                      </Link>
                    </Button>
                  </div>
                  
                  <Button asChild variant="outline" className="w-full backdrop-blur-md bg-black/30 hover:bg-black/50 text-landing-text-primary border border-purple-500/30 hover:border-purple-500/50 py-3 rounded-xl transition-all duration-300">
                    <Link href="/" className="flex items-center justify-center">
                      <Home className="h-5 w-5 mr-2" />
                      Go Home
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {/* Magical Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(147,51,234,0.3)_0%,_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.3)_0%,_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(139,69,234,0.2)_0%,_transparent_50%)]"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yuumi-purple mx-auto"></div>
          <p className="mt-4 text-landing-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}