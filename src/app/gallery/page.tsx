'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { CheckCircle, Link2 } from 'lucide-react';
import { OrnateHeading } from '@/components/ui/hextech-panel';

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
      className="group relative block w-full text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-hx-gold"
    >
      <div className="absolute -inset-0.5 rounded-sm bg-linear-to-r from-hx-gold/40 to-hx-magic/30 opacity-25 blur-sm transition duration-300 group-hover:opacity-60" />
      <div className="hex-card hex-corners relative overflow-hidden rounded-sm transition-all duration-300 hover:-translate-y-1 hover:border-hx-gold">
        {isCopied && (
          <div className="absolute inset-0 z-20 flex items-center justify-center border border-emerald-400/70 bg-emerald-500/15 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-sm border border-emerald-400/50 bg-hx-black/80 px-3 py-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <span className="hex-title text-xs text-emerald-300">
                Link copied
              </span>
            </div>
          </div>
        )}

        <div className="relative flex h-48 w-full items-center justify-center bg-hx-black/40 p-4">
          <Image
            src={`/rule${rule}.gif`}
            alt={`Rule ${rule} GIF`}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
            className="object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="flex items-center justify-between border-t border-hx-gold-dark/40 bg-hx-black/70 px-3 py-2">
          <span className="hex-title text-xs text-hx-gold">Rule {rule}</span>
          <span className="flex items-center gap-1 text-[10px] tracking-wide text-hx-gold/50 uppercase transition-colors group-hover:text-hx-magic-bright">
            <Link2 className="h-3 w-3" />
            Copy link
          </span>
        </div>
      </div>
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
    <div className="py-10 md:py-14">
      <OrnateHeading eyebrow="The sacred laws of the cat" as="h1">
        Yuumi Rule Gallery
      </OrnateHeading>
      <p className="mt-3 mb-12 text-center text-sm text-landing-text-secondary">
        Click any rule to copy its Discord-friendly link.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {RULE_NUMBERS.map((rule, index) => (
          <div
            key={rule}
            className="duration-500 animate-in fade-in fill-mode-both slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <GifCard
              rule={rule}
              isCopied={copiedRule === rule}
              onCopyLink={handleCopyLink}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
