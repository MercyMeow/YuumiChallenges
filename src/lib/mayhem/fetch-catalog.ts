import { getLiveDdragonVersion } from '@/lib/utils/live-patch';
import { buildAugmentCatalog } from './enrich';
import type {
  CherryAugment,
  IesAugmentsPayload,
  MayhemAugmentsResponse,
  MayhemChampion,
} from './types';

const IES_URL =
  'https://data.v2.iesdev.com/api/v1/query_objects/prod/lol/aram_mayhem_augments';
const CHERRY_URL =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json';
const SUMMARY_URL =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json';

type ChampionSummary = {
  id: number;
  name: string;
  alias: string;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        'User-Agent': 'YuumiChallenges/1.0',
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`${url} responded ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Build champion id → MayhemChampion map from CDragon summary + DD squares. */
export async function loadChampionLookup(): Promise<{
  byId: Map<string, MayhemChampion>;
  list: MayhemChampion[];
}> {
  const [summary, version] = await Promise.all([
    fetchJson<ChampionSummary[]>(SUMMARY_URL),
    getLiveDdragonVersion(),
  ]);

  const list: MayhemChampion[] = summary
    .filter((c) => c.id > 0)
    .map((c) => ({
      id: String(c.id),
      key: c.alias,
      name: c.name,
      squareUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.alias}.png`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    byId: new Map(list.map((c) => [c.id, c])),
    list,
  };
}

/** Fetch IESDev + catalogs and return the public API payload. */
export async function loadMayhemAugments(): Promise<MayhemAugmentsResponse> {
  const [ies, cherry, champs] = await Promise.all([
    fetchJson<IesAugmentsPayload>(IES_URL, { next: { revalidate: 3600 } }),
    fetchJson<CherryAugment[]>(CHERRY_URL, { next: { revalidate: 3600 } }),
    loadChampionLookup(),
  ]);

  const rows = ies.data ?? [];
  const patch = rows[0]?.patch ?? '';
  const augments = buildAugmentCatalog(rows, cherry, champs.byId);

  return {
    patch,
    generatedAt: ies.meta?.generated_at ?? new Date().toISOString(),
    champions: champs.list,
    augments,
  };
}
