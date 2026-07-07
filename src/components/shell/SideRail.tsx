'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Crown,
  Home,
  ImageIcon,
  Layers,
  Sparkles,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { PawEmblem } from './PawEmblem';
import { isActiveLink } from './nav';
import { useLivePatch } from '@/lib/hooks/use-live-patch';

const GUIDE_LINKS = [
  { label: 'Overview', href: '/', icon: Home },
  { label: 'Builds & Runes', href: '/#builds', icon: Layers },
  { label: 'Matchups', href: '/#matchups', icon: Users },
] as const;

const RESOURCE_LINKS = [
  { label: 'High Elo Games', href: '/games', icon: Trophy },
  { label: 'Yuumi Players', href: '/players', icon: Crown },
  { label: 'Match Viewer', href: '/match', icon: Swords },
  { label: 'Mythic Shop', href: '/mythic-shop', icon: Sparkles },
  { label: 'Rule Gallery', href: '/gallery', icon: ImageIcon },
  { label: 'Guide Admin', href: '/admin', icon: BookOpen },
] as const;

/** Left rail: Yuumi medallion, engraved nav groups, live patch crystal. */
export function SideRail() {
  const pathname = usePathname();
  const patch = useLivePatch();

  return (
    <aside className="sticky top-[4.5rem] hidden max-h-[calc(100vh-4.5rem)] w-60 shrink-0 hex-scroll self-start overflow-y-auto py-6 pr-1 xl:block">
      <div className="hex-card hex-corners rounded-sm">
        {/* Medallion */}
        <div className="flex flex-col items-center gap-3 border-b border-hx-gold-dark/40 px-4 py-6">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full bg-hx-magic/20 blur-xl"
              aria-hidden
            />
            <PawEmblem size={72} className="relative" />
          </div>
          <div className="text-center">
            <div className="hex-title text-sm text-hx-gold-bright">
              Yuumi Guide
            </div>
            <div className="mt-0.5 text-[11px] tracking-wide text-hx-gold/60">
              The Magical Cat · Support
            </div>
          </div>
        </div>

        {/* Nav groups */}
        <nav className="px-2 py-4">
          <p className="px-3 pb-2 hex-label">Guide</p>
          {GUIDE_LINKS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="hex-rail-link rounded-sm"
              data-active={isActiveLink(pathname, href)}
            >
              <Icon className="h-3.5 w-3.5 opacity-80" aria-hidden />
              {label}
            </Link>
          ))}
          <p className="px-3 pt-4 pb-2 hex-label">Resources</p>
          {RESOURCE_LINKS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="hex-rail-link rounded-sm"
              data-active={isActiveLink(pathname, href)}
            >
              <Icon className="h-3.5 w-3.5 opacity-80" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>

        {/* Patch crystal */}
        <div className="border-t border-hx-gold-dark/40 px-4 py-4">
          <div className="flex items-center gap-3 rounded-sm px-3 py-2.5 hex-card-inset">
            <span
              className="h-2.5 w-2.5 shrink-0 rotate-45 animate-gem-pulse bg-hx-magic"
              aria-hidden
            />
            <div className="min-w-0">
              <div className="hex-label text-hx-magic-bright">
                Patch {patch ?? '…'}
              </div>
              <div className="text-[10px] tracking-wide text-hx-gold/50 uppercase">
                Live on the Rift
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
