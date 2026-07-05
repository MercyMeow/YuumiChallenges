'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Settings, X } from 'lucide-react';
import { PawEmblem } from './PawEmblem';
import { useLivePatch } from '@/lib/hooks/use-live-patch';
import { cn } from '@/lib/utils';

const NAV_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'Overview', href: '/' },
  { label: 'Builds', href: '/#builds' },
  { label: 'Matchups', href: '/#matchups' },
  { label: 'Match Viewer', href: '/match' },
  { label: 'Mythic Shop', href: '/mythic-shop' },
  { label: 'Gallery', href: '/gallery' },
];

function isActiveLink(pathname: string, href: string): boolean {
  if (href.includes('#')) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Old-client top bar: wordmark, gold nav links, live patch crystal. */
export function TopNav() {
  const pathname = usePathname();
  const patch = useLivePatch();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-hx-gold-dark/70 bg-[oklch(0.11_0.03_247_/_0.92)] shadow-[0_8px_24px_oklch(0_0_0_/_0.5)] backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6">
          {/* Wordmark */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5"
            onClick={() => setMenuOpen(false)}
          >
            <PawEmblem
              size={38}
              className="transition-transform duration-300 group-hover:rotate-[15deg]"
            />
            <span className="text-gradient-gold text-xl font-bold tracking-wide">
              yuumi.quest
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hex-nav-link"
                data-active={isActiveLink(pathname, link.href)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-3">
            <span className="hex-chip-magic hidden sm:inline-flex">
              <span
                className="h-1.5 w-1.5 rotate-45 animate-gem-pulse bg-hx-magic"
                aria-hidden
              />
              Patch {patch ?? '…'}
            </span>
            <Link
              href="/admin"
              aria-label="Admin console"
              className="hidden text-hx-gold/50 transition-colors hover:text-hx-gold-bright sm:block"
            >
              <Settings className="h-4.5 w-4.5" />
            </Link>
            <button
              type="button"
              className="btn-hextech rounded-sm p-2 lg:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="hex-divider" aria-hidden />

      {/* Mobile menu */}
      <div
        className={cn(
          'absolute inset-x-0 top-full origin-top border-b border-hx-gold-dark/70 bg-[oklch(0.1_0.03_247_/_0.97)] backdrop-blur-md transition-all duration-200 lg:hidden',
          menuOpen
            ? 'visible scale-y-100 opacity-100'
            : 'invisible scale-y-95 opacity-0'
        )}
      >
        <nav className="mx-auto flex max-w-[1600px] flex-col px-4 py-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hex-rail-link"
              data-active={isActiveLink(pathname, link.href)}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="hex-rail-link"
            data-active={pathname.startsWith('/admin')}
            onClick={() => setMenuOpen(false)}
          >
            <Settings className="h-3.5 w-3.5" aria-hidden />
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
