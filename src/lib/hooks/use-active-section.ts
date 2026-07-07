'use client';

// Scroll spy for the guide page's in-page nav: reports which section anchor
// the viewport is currently inside, so TopNav/SideRail can highlight hash
// links (`/#builds`) that plain pathname matching can never activate.

import { useEffect, useState } from 'react';

/**
 * Returns the id of the last section whose top has scrolled past the upper
 * third of the viewport, or `null` while still above the first section.
 * Pass a module-level constant for `sectionIds` so the effect binds once.
 */
export function useActiveSection(
  sectionIds: readonly string[],
  enabled: boolean
): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const threshold = window.innerHeight / 3;
      let current: string | null = null;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= threshold) current = id;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [sectionIds, enabled]);

  // Stale readings from a previous enable are never surfaced.
  return enabled ? active : null;
}
