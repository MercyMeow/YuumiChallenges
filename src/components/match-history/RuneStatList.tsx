'use client';

import { useState, useMemo } from 'react';
import { formatRuneStat, RuneDetail } from '@/lib/utils/runes';
import { cn } from '@/lib/utils';

interface RuneStatListProps {
  details?: RuneDetail[];
  maxCollapsed?: number;
  className?: string;
  emptyHint?: string;
}

export function RuneStatList({
  details,
  maxCollapsed = 4,
  className = '',
  emptyHint = 'No recorded impact',
}: RuneStatListProps) {
  const [expanded, setExpanded] = useState(false);

  const list = useMemo(() => {
    if (!Array.isArray(details) || details.length === 0) return [];
    return details.map((d, idx) => ({
      key: `${d.statType}-${idx}`,
      text: formatRuneStat(d.statType, d.value),
      value: d.value,
    }));
  }, [details]);

  if (!list.length) {
    return (
      <div
        className={cn(
          'w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/50',
          className
        )}
      >
        {emptyHint}
      </div>
    );
  }

  const visible = expanded ? list : list.slice(0, maxCollapsed);
  const hiddenCount = Math.max(0, list.length - visible.length);

  return (
    <div
      className={cn(
        'w-full rounded-md border border-white/10 bg-white/5 p-2 text-[11px] text-white/80',
        className
      )}
    >
      <ul className="space-y-1">
        {visible.map((l) => (
          <li
            key={l.key}
            className={cn(l.value >= 0 ? 'text-green-300' : 'text-red-300')}
          >
            {l.text}
          </li>
        ))}
      </ul>

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-[11px] text-purple-300 underline-offset-2 hover:underline"
        >
          {expanded ? 'Show less' : `+${hiddenCount} more`}
        </button>
      )}
    </div>
  );
}

export default RuneStatList;
