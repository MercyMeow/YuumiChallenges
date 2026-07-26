import type { MayhemTier } from './types';

const LABELS: Record<MayhemTier, string> = {
  1: 'S',
  2: 'A',
  3: 'B',
  4: 'C',
  5: 'D',
};

/** Map feed tier 1–5 to S–D display letter. */
export function tierLabel(tier: MayhemTier): string {
  return LABELS[tier];
}

/** Clamp unknown numbers into MayhemTier (defaults to 5). */
export function asMayhemTier(value: number): MayhemTier {
  if (value === 1 || value === 2 || value === 3 || value === 4 || value === 5) {
    return value;
  }
  return 5;
}

/** Chip class progression: gold (S) → steel (D). */
export function tierChipClass(tier: MayhemTier): string {
  switch (tier) {
    case 1:
      return 'hex-chip border-hx-gold/50 text-hx-gold-bright';
    case 2:
      return 'hex-chip border-hx-gold-dark/50 text-hx-gold';
    case 3:
      return 'hex-chip border-hx-steel/50 text-hx-parchment';
    case 4:
      return 'hex-chip border-hx-steel/40 text-hx-steel';
    case 5:
      return 'hex-chip border-hx-navy/60 text-hx-steel/80';
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}
