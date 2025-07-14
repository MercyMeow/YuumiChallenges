'use client';

import Link from 'next/link';
import { YuumiIcon } from '@/components/ui/datadragon-image';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
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
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
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
    </div>
  );
}