'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { TopNav } from './TopNav';
import { SideRail } from './SideRail';

/**
 * LoL-client chrome for public pages: top bar + left rail around the page
 * content. Admin routes render bare and keep their own console styling.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 gap-6 px-4 md:px-6">
        <SideRail />
        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>
      <footer className="mt-auto border-t border-hx-gold-dark/40 bg-hx-black/60">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-hx-gold/50 md:px-6">
          <span>
            Made with <span className="text-hx-magic">✦</span> for Yuumi mains
            worldwide · yuumi.quest
          </span>
          <span>
            Not affiliated with Riot Games · Data from OP.GG, Lolalytics, U.GG
          </span>
        </div>
      </footer>
    </div>
  );
}
