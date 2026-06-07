'use client';

import Link from 'next/link';
import { YuumiIcon } from '@/components/ui/datadragon-image';
import { MagicalBackground } from '@/components/ui/magical-background';
import { Home, AlertCircle, Search } from 'lucide-react';

const EXAMPLE_MATCH_URL = '/match/EUW1_7481411158?useExample=1';

export default function NotFound() {
  return (
    <MagicalBackground className="flex items-center justify-center">
      <div className="px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="relative mb-8 inline-block">
            <div className="relative z-10 overflow-hidden rounded-3xl opacity-50">
              <YuumiIcon
                size="xl"
                className="rounded-3xl border-2 border-red-500/30 shadow-2xl"
              />
            </div>
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-red-500 to-orange-500 opacity-20 blur-3xl"></div>
          </div>

          <h1 className="animate-gradient mb-4 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-8xl font-bold text-transparent md:text-9xl">
            404
          </h1>

          <div className="mb-8 rounded-2xl border border-red-500/20 bg-black/30 p-8 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-center">
              <AlertCircle className="mr-2 h-6 w-6 text-red-400" />
              <h2 className="text-2xl font-semibold text-landing-text-primary">
                Oops! Yuumi can&apos;t find that page
              </h2>
            </div>
            <p className="text-lg text-landing-text-secondary">
              Looks like our magical cat wandered off somewhere. The page
              you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="group relative inline-flex items-center justify-center"
            >
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-yuumi-purple to-yuumi-blue opacity-75 blur transition duration-300 group-hover:opacity-100"></div>
              <div className="relative flex transform items-center rounded-xl bg-gradient-to-r from-yuumi-purple to-yuumi-blue px-6 py-3 font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105">
                <Home className="mr-2 h-5 w-5" />
                Return Home
              </div>
            </Link>

            <Link
              href={EXAMPLE_MATCH_URL}
              className="group relative inline-flex items-center justify-center"
            >
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-500/50 to-blue-500/50 opacity-50 blur transition duration-300 group-hover:opacity-75"></div>
              <div className="relative flex transform items-center rounded-xl border border-purple-500/30 bg-black/50 px-6 py-3 font-semibold text-landing-text-primary backdrop-blur-md transition-all duration-300 hover:scale-105">
                <Search className="mr-2 h-5 w-5" />
                Load Example Match
              </div>
            </Link>
          </div>
        </div>
      </div>
    </MagicalBackground>
  );
}
