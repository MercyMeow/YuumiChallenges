'use client';

import Link from 'next/link';
import { YuumiIcon } from '@/components/ui/datadragon-image';
import { MagicalBackground } from '@/components/ui/magical-background';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <MagicalBackground className="flex items-center justify-center">
      <div className="px-6">
        <div className="text-center max-w-2xl mx-auto">
          {/* Yuumi Icon with glow effect */}
          <div className="mb-8 relative inline-block">
            <div className="relative z-10 rounded-3xl overflow-hidden opacity-50">
              <YuumiIcon size="xl" className="rounded-3xl shadow-2xl border-2 border-red-500/30" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 blur-3xl opacity-20 animate-pulse"></div>
          </div>
          
          {/* 404 Text with gradient */}
          <h1 className="text-8xl md:text-9xl font-bold mb-4 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent animate-gradient">
            404
          </h1>
          
          {/* Error Message */}
          <div className="bg-black/30 backdrop-blur-md border border-red-500/20 rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-400 mr-2" />
              <h2 className="text-2xl font-semibold text-landing-text-primary">
                Oops! Yuumi can&apos;t find that page
              </h2>
            </div>
            <p className="text-landing-text-secondary text-lg">
              Looks like our magical cat wandered off somewhere. The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="group relative inline-flex items-center justify-center"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yuumi-purple to-yuumi-blue rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative flex items-center px-6 py-3 bg-gradient-to-r from-yuumi-purple to-yuumi-blue text-white font-semibold rounded-xl transform hover:scale-105 transition-all duration-300 shadow-xl">
                <Home className="h-5 w-5 mr-2" />
                Return Home
              </div>
            </Link>
            
            <Link
              href="/dashboard"
              className="group relative inline-flex items-center justify-center"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/50 to-blue-500/50 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative flex items-center px-6 py-3 bg-black/50 backdrop-blur-md border border-purple-500/30 text-landing-text-primary font-semibold rounded-xl transform hover:scale-105 transition-all duration-300">
                Go to Dashboard
              </div>
            </Link>
          </div>
        </div>
      </div>
    </MagicalBackground>
  );
}
