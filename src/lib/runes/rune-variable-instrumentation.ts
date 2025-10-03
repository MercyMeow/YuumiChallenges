/**
 * Rune Variable Instrumentation Utility
 *
 * Captures unknown / uncertain rune variable exports so we can
 * empirically refine mapping in later passes without polluting UI.
 *
 * Activated only when NEXT_PUBLIC_RUNE_DEBUG === '1'. In production
 * this becomes a no-op (tree-shaken by Next.js if env var absent).
 */

export type RuneVarSample = {
  runeId: number;
  var: 'var1' | 'var2' | 'var3';
  value: number;
  matchId?: string;
  championId?: number;
  timestamp?: number;
};

const samples: RuneVarSample[] = [];

function isEnabled() {
  return (
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_RUNE_DEBUG === '1'
  );
}

export function recordUnknownRuneVar(sample: RuneVarSample) {
  if (!isEnabled()) return;
  // Ignore zero values – usually unused
  if (sample.value === 0) return;

  samples.push({ ...sample, timestamp: Date.now() });
  // Basic console output for now (debug build only). Could be replaced with
  // POST to an internal endpoint if needed later.
  console.debug('[RuneVar][Unknown]', sample);
}

export function getRecordedRuneVarSamples() {
  return [...samples];
}
