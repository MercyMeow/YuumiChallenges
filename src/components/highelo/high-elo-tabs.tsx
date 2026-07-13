'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Games', href: '/games' },
  { label: 'Players', href: '/players' },
  { label: 'Meta Stats', href: '/stats' },
];

export function HighEloTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex justify-center gap-1">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-sm border px-4 py-1.5 text-xs tracking-widest uppercase transition-colors',
              active
                ? 'border-hx-gold bg-hx-gold/10 text-hx-gold-bright'
                : 'border-hx-gold-dark/40 text-hx-gold/60 hover:text-hx-gold'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
