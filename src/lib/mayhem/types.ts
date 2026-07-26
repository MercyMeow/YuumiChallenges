/** Meta / champ-specific tier from IESDev (1 = best). */
export type MayhemTier = 1 | 2 | 3 | 4 | 5;

export type MayhemChampion = {
  id: string;
  key: string;
  name: string;
  squareUrl: string;
};

export type MayhemTopChampion = MayhemChampion & {
  tier: MayhemTier;
};

export type MayhemAugment = {
  id: string;
  name: string;
  iconUrl: string;
  rarity?: string;
  metaTier: MayhemTier;
  topChampions: MayhemTopChampion[];
};

export type MayhemAugmentsResponse = {
  patch: string;
  generatedAt: string;
  champions: MayhemChampion[];
  augments: MayhemAugment[];
};

/** Raw IESDev row (subset). */
export type IesAugmentRow = {
  augment_id: string;
  patch: string;
  dt: string;
  stats: {
    tier: number;
    top_champions: Array<{ champion_id: string; tier: number }>;
  };
};

export type IesAugmentsPayload = {
  data: IesAugmentRow[];
  meta: { count: number; generated_at: string };
};

/** CommunityDragon cherry-augments.json entry. */
export type CherryAugment = {
  id: number;
  augmentNameId: string;
  nameTRA: string;
  augmentSmallIconPath: string;
  rarity?: string;
};
