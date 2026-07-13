'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gem, LogIn, LogOut, Menu, Settings, X } from 'lucide-react';
import { PawEmblem } from './PawEmblem';
import { discordAvatarUrl, useWebUser } from '@/lib/hooks/use-web-user';
import { HOME_SECTION_IDS, isGuideLinkActive } from './nav';
import { useActiveSection } from '@/lib/hooks/use-active-section';
import { useLivePatch } from '@/lib/hooks/use-live-patch';
import { cn } from '@/lib/utils';

const NAV_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'Overview', href: '/' },
  { label: 'Builds', href: '/#builds' },
  { label: 'Spells', href: '/#abilities' },
  { label: 'Matchups', href: '/#matchups' },
  { label: 'High Elo', href: '/games' },
  { label: 'Stats', href: '/stats' },
  { label: 'Match Viewer', href: '/match' },
  { label: 'Gallery', href: '/gallery' },
];

/**
 * Discord sign-in / signed-in avatar for the top bar. The menu is a
 * simple hover/focus popover in the hextech language — no new deps.
 */
function AccountCluster() {
  const pathname = usePathname();
  const { user, loading, logout } = useWebUser();

  if (loading) return null;
  if (!user) {
    return (
      <a
        href={`/api/auth/discord/login?return=${encodeURIComponent(pathname)}`}
        className="btn-hextech hidden items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs sm:inline-flex"
      >
        <LogIn className="h-3.5 w-3.5" aria-hidden />
        Sign in
      </a>
    );
  }
  return (
    <div className="group relative hidden sm:block">
      <button
        type="button"
        className="flex items-center gap-2 rounded-sm border border-hx-gold-dark/40 px-2 py-1 transition-colors hover:border-hx-gold"
      >
        {/* Discord CDN isn't in next.config remotePatterns; plain img. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={discordAvatarUrl(user)}
          alt=""
          width={22}
          height={22}
          className="rounded-full"
        />
        <span className="max-w-24 truncate text-xs text-hx-gold-bright">
          {user.globalName ?? user.username}
        </span>
        {user.subscribed && (
          <Gem className="h-3.5 w-3.5 text-hx-magic" aria-label="Supporter" />
        )}
      </button>
      <div className="invisible absolute top-full right-0 z-50 mt-1 w-44 rounded-sm border border-hx-gold-dark/60 bg-[oklch(0.11_0.03_247_/_0.97)] opacity-0 shadow-lg backdrop-blur-md transition-all duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        {user.subscribed ? (
          <div className="flex items-center gap-2 border-b border-hx-gold-dark/40 px-3 py-2 text-xs text-hx-magic-bright">
            <Gem className="h-3.5 w-3.5" aria-hidden /> Supporter
          </div>
        ) : (
          <div className="border-b border-hx-gold-dark/40 px-3 py-2 text-[11px] tracking-wide text-hx-gold/60">
            Support on your linked profile page — 1€/mo
          </div>
        )}
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-hx-gold/70 transition-colors hover:bg-hx-gold/5 hover:text-hx-gold-bright"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
        </button>
      </div>
    </div>
  );
}

/** Drawer variant of the account controls, for viewports below `sm`. */
function MobileAccountRow({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const { user, loading, logout } = useWebUser();
  if (loading) return null;
  if (!user) {
    return (
      <a
        href={`/api/auth/discord/login?return=${encodeURIComponent(pathname)}`}
        className="hex-rail-link"
        onClick={onNavigate}
      >
        <LogIn className="h-3.5 w-3.5" aria-hidden />
        Sign in with Discord
      </a>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2 border-t border-hx-gold-dark/40 pt-2">
      <span className="flex min-w-0 items-center gap-2 px-3 py-2 text-xs text-hx-gold-bright">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={discordAvatarUrl(user)}
          alt=""
          width={20}
          height={20}
          className="rounded-full"
        />
        <span className="truncate">{user.globalName ?? user.username}</span>
        {user.subscribed && (
          <Gem
            className="h-3.5 w-3.5 shrink-0 text-hx-magic"
            aria-label="Supporter"
          />
        )}
      </span>
      <button
        type="button"
        onClick={() => {
          void logout();
          onNavigate();
        }}
        className="flex items-center gap-1.5 px-3 py-2 text-xs text-hx-gold/60 hover:text-hx-gold-bright"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
      </button>
    </div>
  );
}

/** Old-client top bar: wordmark, gold nav links, live patch crystal. */
export function TopNav() {
  const pathname = usePathname();
  const patch = useLivePatch();
  const activeSection = useActiveSection(HOME_SECTION_IDS, pathname === '/');
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile drawer on any route change (incl. back/forward), not
  // just link clicks. Render-time adjustment keeps the React Compiler happy.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (menuOpen) setMenuOpen(false);
  }

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
          <nav className="hidden items-center gap-4 lg:flex xl:gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hex-nav-link"
                data-active={isGuideLinkActive(
                  pathname,
                  link.href,
                  activeSection
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-3">
            <AccountCluster />
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
              data-active={isGuideLinkActive(
                pathname,
                link.href,
                activeSection
              )}
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
          <MobileAccountRow onNavigate={() => setMenuOpen(false)} />
        </nav>
      </div>
    </header>
  );
}
