import { asMayhemTier } from './tiers';
import type {
  CherryAugment,
  IesAugmentRow,
  MayhemAugment,
  MayhemChampion,
  MayhemTopChampion,
} from './types';

const CDRAGON_ASSETS =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default';

/** Convert lol-game-data asset path to a raw.communitydragon URL (large icon). */
export function cherryIconUrl(smallPath: string): string {
  const large = smallPath.replace(/_small(\.[a-z]+)$/i, '_large$1');
  const stripped = large
    .replace(/^\/lol-game-data\/assets\//i, '')
    .toLowerCase();
  return `${CDRAGON_ASSETS}/${stripped}`;
}

/** Humanize AugmentNameId when nameTRA is empty. */
export function fallbackAugmentName(augmentNameId: string, id: string): string {
  let name = augmentNameId || `Augment ${id}`;
  if (name.startsWith('ARAM_')) name = name.slice(5);
  // Insert spaces before capitals without lookbehind (broader JS target).
  name = name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim();
  return name;
}

type ChampionLookup = Map<string, MayhemChampion>;

/** Join one IES row with cherry catalog + champion lookup. */
export function enrichAugmentRow(
  row: IesAugmentRow,
  cherryById: Map<number, CherryAugment>,
  championsById: ChampionLookup
): MayhemAugment {
  const id = String(row.augment_id);
  const cherry = cherryById.get(Number(id));
  const name = cherry?.nameTRA?.trim()
    ? cherry.nameTRA.trim()
    : fallbackAugmentName(cherry?.augmentNameId ?? '', id);
  const iconUrl = cherry?.augmentSmallIconPath
    ? cherryIconUrl(cherry.augmentSmallIconPath)
    : `${CDRAGON_ASSETS}/v1/champion-icons/-1.png`;

  const topChampions: MayhemTopChampion[] = (row.stats.top_champions ?? []).map(
    (entry) => {
      const champ = championsById.get(String(entry.champion_id));
      if (!champ) {
        return {
          id: String(entry.champion_id),
          key: String(entry.champion_id),
          name: `Champion ${entry.champion_id}`,
          squareUrl: `https://cdn.communitydragon.org/latest/champion/${entry.champion_id}/square`,
          tier: asMayhemTier(entry.tier),
        };
      }
      return { ...champ, tier: asMayhemTier(entry.tier) };
    }
  );

  return {
    id,
    name,
    iconUrl,
    ...(cherry?.rarity ? { rarity: cherry.rarity } : {}),
    metaTier: asMayhemTier(row.stats.tier),
    topChampions,
  };
}

/** Build full enriched list from feed + catalogs. */
export function buildAugmentCatalog(
  rows: IesAugmentRow[],
  cherry: CherryAugment[],
  championsById: ChampionLookup
): MayhemAugment[] {
  const cherryById = new Map(cherry.map((a) => [a.id, a]));
  return rows.map((row) => enrichAugmentRow(row, cherryById, championsById));
}

/** Augments where champ appears in topChampions, sorted by champ tier then meta. */
export function filterBestForChampion(
  augments: MayhemAugment[],
  championId: string
): MayhemAugment[] {
  return augments
    .filter((a) => a.topChampions.some((c) => c.id === championId))
    .slice()
    .sort((a, b) => {
      const aTier = a.topChampions.find((c) => c.id === championId)?.tier ?? 5;
      const bTier = b.topChampions.find((c) => c.id === championId)?.tier ?? 5;
      if (aTier !== bTier) return aTier - bTier;
      return a.metaTier - b.metaTier;
    });
}

/** Sort all augments by overall meta tier ascending. */
export function sortByMetaTier(augments: MayhemAugment[]): MayhemAugment[] {
  return augments.slice().sort((a, b) => a.metaTier - b.metaTier);
}
