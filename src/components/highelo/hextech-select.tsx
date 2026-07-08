'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type HextechSelectOption = { value: string; label: string };

/**
 * Hextech-skinned dropdown for the high-elo pages. Replaces native
 * `<select>` elements whose popup list can't be themed and falls back to
 * OS styling.
 */
export function HextechSelect({
  value,
  onValueChange,
  options,
  ariaLabel,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: HextechSelectOption[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className={cn(
          'rounded-sm border-hx-gold-dark/40 bg-transparent text-xs tracking-wide text-hx-gold shadow-none hex-card-inset',
          'hover:text-hx-gold-bright focus-visible:border-hx-gold focus-visible:ring-2 focus-visible:ring-hx-gold/30',
          'dark:bg-transparent dark:hover:bg-hx-gold/5',
          '[&_svg:not([class*=text-])]:text-hx-gold/60',
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-sm border-hx-gold-dark/50 bg-hx-panel text-hx-gold shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={cn(
              'rounded-none text-xs tracking-wide text-hx-gold/80',
              'focus:bg-hx-gold/10 focus:text-hx-gold-bright',
              'data-[state=checked]:text-hx-gold-bright',
              '[&_svg:not([class*=text-])]:text-hx-gold'
            )}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
