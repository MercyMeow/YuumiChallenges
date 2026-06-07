'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MagicalBackground } from '@/components/ui/magical-background';

// Rule GIFs available in /public. Discord-friendly links point at /rule{n}.gif.
const RULE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15];

// Prefer the configured public site URL so copied links work for Discord embeds.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? '';

interface GifCardProps {
  rule: number;
  isCopied: boolean;
  onCopyLink: (rule: number) => void;
}

function GifCard({ rule, isCopied, onCopyLink }: GifCardProps) {
  return (
    <button
      type="button"
      onClick={() => onCopyLink(rule)}
      className="group relative text-left"
    >
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-500/50 to-teal-500/50 opacity-30 blur transition duration-300 group-hover:opacity-60" />
      <Card className="relative overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-2xl">
        <CardContent className="p-0">
          <div className="relative overflow-hidden rounded-lg bg-black/20 backdrop-blur-sm">
            {isCopied && (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg border-2 border-green-400 bg-green-500/20">
                <div className="flex items-center gap-2 rounded-lg bg-black/60 px-3 py-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="font-medium text-green-300">Copied!</span>
                </div>
              </div>
            )}

            <div className="relative flex h-48 w-full items-center justify-center p-4">
              <Image
                src={`/rule${rule}.gif`}
                alt={`Rule ${rule} GIF`}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
                className="object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            <div className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-1 backdrop-blur-sm">
              <span className="text-xs font-medium text-cyan-300">
                Rule {rule}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export default function GalleryPage() {
  const [copiedRule, setCopiedRule] = useState<number | null>(null);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show the "Copied!" indicator for the given rule, resetting any pending
  // timer so rapid clicks on different rules don't clear it prematurely.
  const showCopied = (rule: number) => {
    setCopiedRule(rule);
    if (copyResetTimer.current) {
      clearTimeout(copyResetTimer.current);
    }
    copyResetTimer.current = setTimeout(() => setCopiedRule(null), 2000);
  };

  const handleCopyLink = async (rule: number) => {
    const base =
      SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const shortUrl = `${base}/rule${rule}.gif`;

    try {
      await navigator.clipboard.writeText(shortUrl);
      showCopied(rule);
    } catch {
      // Fallback for browsers without async clipboard support.
      const textArea = document.createElement('textarea');
      textArea.value = shortUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        if (document.execCommand('copy')) {
          showCopied(rule);
        }
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <MagicalBackground>
      <div className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-yuumi-purple transition-colors hover:text-yuumi-blue"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>

            <h1 className="mb-6 bg-gradient-to-r from-landing-text-primary via-yuumi-teal to-yuumi-blue bg-clip-text text-4xl font-bold leading-tight text-transparent md:text-6xl">
              Yuumi Rule Gallery
            </h1>
            <p className="mb-2 text-lg text-landing-text-secondary">
              Click any rule to copy its Discord-friendly link
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {RULE_NUMBERS.map((rule) => (
              <GifCard
                key={rule}
                rule={rule}
                isCopied={copiedRule === rule}
                onCopyLink={handleCopyLink}
              />
            ))}
          </div>
        </div>
      </div>
    </MagicalBackground>
  );
}
