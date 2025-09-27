// Aggregated exports for matchups (supports + ADC synergies)
import * as SupportModules from './supports';
import * as ADCModules from './adcs';
export * from './types';
export * from './championLists';

import type { SupportMatchup, BotLaneSynergy } from './types';

// Build maps from individual champion exports. Each champion file exports a const named after the champion.
// This lets us keep one small aggregation surface while keeping data split per file.

export const SUPPORT_MATCHUPS: Record<string, SupportMatchup> =
  Object.fromEntries(
    Object.entries(SupportModules).map(([k, v]) => [k, v as SupportMatchup])
  );

export const ADC_MATCHUPS: Record<string, BotLaneSynergy> = Object.fromEntries(
  Object.entries(ADCModules).map(([k, v]) => [k, v as BotLaneSynergy])
);

// Also re export namespaces for any advanced usage
export { SupportModules as SupportMatchups, ADCModules as ADCSynergies };
