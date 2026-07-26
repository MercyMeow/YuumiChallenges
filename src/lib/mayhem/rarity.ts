import type { MayhemAugment } from './types';

/** Draft rarity buckets shown in Mayhem (order = in-game value). */
export const MAYHEM_RARITY_ORDER = [
  'kPrismatic',
  'kGold',
  'kSilver',
  'kBronze',
] as const;

export type MayhemRarityId = (typeof MAYHEM_RARITY_ORDER)[number];

export type MayhemRarityBucket = {
  id: MayhemRarityId | 'other';
  label: string;
  /** Top 20 for this rarity, best-first for the selected champ. */
  top20: MayhemAugment[];
  /** First 5 of top20 — featured cards. */
  featured: MayhemAugment[];
};

const RARITY_LABELS: Record<MayhemRarityId, string> = {
  kPrismatic: 'Prismatic',
  kGold: 'Gold',
  kSilver: 'Silver',
  kBronze: 'Bronze',
};

const FEATURED_COUNT = 5;
const TOTAL_COUNT = 20;

/** Normalize CDragon rarity string into a known bucket id. */
export function normalizeRarity(
  rarity: string | undefined
): MayhemRarityId | 'other' {
  if (!rarity) return 'other';
  if (
    rarity === 'kPrismatic' ||
    rarity === 'kGold' ||
    rarity === 'kSilver' ||
    rarity === 'kBronze'
  ) {
    return rarity;
  }
  return 'other';
}

/** Human label for a rarity bucket. */
export function rarityLabel(id: MayhemRarityId | 'other'): string {
  if (id === 'other') return 'Other';
  return RARITY_LABELS[id];
}

/** Sort key: champ-in-top first, then that champ's tier, then meta tier. */
function compareForChampion(
  a: MayhemAugment,
  b: MayhemAugment,
  championId: string
): number {
  const aHit = a.topChampions.find((c) => c.id === championId);
  const bHit = b.topChampions.find((c) => c.id === championId);
  if (!!aHit !== !!bHit) return aHit ? -1 : 1;
  if (aHit && bHit && aHit.tier !== bHit.tier) {
    return aHit.tier - bHit.tier;
  }
  return a.metaTier - b.metaTier;
}

/**
 * For each draft rarity, rank all augments for the champ and take top 5 / top 20.
 * Champ-specific hits float first; remaining slots fill by meta tier.
 */
export function groupBestByRarity(
  augments: MayhemAugment[],
  championId: string
): MayhemRarityBucket[] {
  const buckets = new Map<MayhemRarityId | 'other', MayhemAugment[]>();

  for (const augment of augments) {
    const id = normalizeRarity(augment.rarity);
    const list = buckets.get(id) ?? [];
    list.push(augment);
    buckets.set(id, list);
  }

  const orderedIds: Array<MayhemRarityId> = [...MAYHEM_RARITY_ORDER];

  return orderedIds
    .filter((id) => (buckets.get(id)?.length ?? 0) > 0)
    .map((id) => {
      const ranked = (buckets.get(id) ?? [])
        .slice()
        .sort((a, b) => compareForChampion(a, b, championId));
      const top20 = ranked.slice(0, TOTAL_COUNT);
      return {
        id,
        label: rarityLabel(id),
        top20,
        featured: top20.slice(0, FEATURED_COUNT),
      };
    });
}
