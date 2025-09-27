/**
 * DataDragon API utilities for League of Legends static data and assets
 * Official CDN: https://ddragon.leagueoflegends.com/cdn/
 */

// DataDragon API base URL
const DATADRAGON_BASE_URL = 'https://ddragon.leagueoflegends.com';

// Cache for storing versions to avoid repeated API calls
let cachedVersions: string[] | null = null;
let cachedLatestVersion: string | null = null;

export interface DDragonVersions {
  versions: string[];
  latest: string;
}

export interface ChampionData {
  id: string;
  name: string;
  title: string;
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  tags: string[];
  stats: Record<string, number>;
  passive?: {
    name: string;
    description: string;
    image: {
      full: string;
      sprite: string;
      group: string;
      x: number;
      y: number;
      w: number;
      h: number;
    };
  };
  spells?: Array<{
    id: string;
    name: string;
    description: string;
    tooltip: string;
    leveltip?: {
      label: string[];
      effect: string[];
    };
    maxrank: number;
    cooldown: number[];
    cooldownBurn: string;
    cost: number[];
    costBurn: string;
    datavalues: Record<string, unknown>;
    effect: (number | null)[];
    effectBurn: (string | null)[];
    vars: Array<Record<string, unknown>>;
    key: string;
    summonerLevel: number;
    modes: string[];
    costType: string;
    maxammo: string;
    range: number | number[];
    rangeBurn: string;
    image: {
      full: string;
      sprite: string;
      group: string;
      x: number;
      y: number;
      w: number;
      h: number;
    };
    resource: string;
  }>;
}

export interface ItemData {
  id: string;
  name: string;
  description: string;
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  gold: {
    base: number;
    purchasable: boolean;
    total: number;
    sell: number;
  };
}

export interface RuneData {
  id: number;
  key: string;
  icon: string;
  name: string;
  shortDesc: string;
  longDesc: string;
}

export interface RuneSlot {
  runes: RuneData[];
}

export interface RuneTree {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: RuneSlot[];
}

export interface StatShard {
  id: number;
  name: string;
  description: string;
  slot: 'offense' | 'flex' | 'defense';
}

export interface RuneSelection {
  primaryTree: number;
  keystone: number;
  slot1: number;
  slot2: number;
  slot3: number;
  secondaryTree: number;
  secondary1: number;
  secondary2: number;
  statShards: [number, number, number]; // [offense, flex, defense]
}

/**
 * Fetches the latest DataDragon versions
 */
export async function getDDragonVersions(): Promise<DDragonVersions> {
  if (cachedVersions && cachedLatestVersion) {
    return { versions: cachedVersions, latest: cachedLatestVersion };
  }

  try {
    const response = await fetch(`${DATADRAGON_BASE_URL}/api/versions.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch versions: ${response.status}`);
    }

    const versions: string[] = await response.json();
    const latest = versions[0] || '14.23.1'; // First version is always the latest

    // Cache the results
    cachedVersions = versions;
    cachedLatestVersion = latest;

    return { versions, latest };
  } catch (error) {
    console.error('Error fetching DataDragon versions:', error);
    // Fallback to a reasonable default if the API fails
    return { versions: ['14.23.1'], latest: '14.23.1' };
  }
}

/**
 * Gets the latest DataDragon version
 */
export async function getLatestVersion(): Promise<string> {
  const { latest } = await getDDragonVersions();
  return latest;
}

/**
 * Champion Image URLs
 */
export const championImages = {
  /**
   * Gets the champion icon URL
   */
  icon: async (championId: string): Promise<string> => {
    const version = await getLatestVersion();
    return `${DATADRAGON_BASE_URL}/cdn/${version}/img/champion/${championId}.png`;
  },

  /**
   * Gets the champion splash art URL
   */
  splash: (championId: string, skinNum: number = 0): string => {
    return `${DATADRAGON_BASE_URL}/cdn/img/champion/splash/${championId}_${skinNum}.jpg`;
  },

  /**
   * Gets the champion loading screen URL
   */
  loading: (championId: string, skinNum: number = 0): string => {
    return `${DATADRAGON_BASE_URL}/cdn/img/champion/loading/${championId}_${skinNum}.jpg`;
  },

  /**
   * Gets the champion square portrait URL (for smaller displays)
   */
  square: async (championId: string): Promise<string> => {
    const version = await getLatestVersion();
    return `${DATADRAGON_BASE_URL}/cdn/${version}/img/champion/${championId}.png`;
  },
};

/**
 * Ability Image URLs
 */
export const abilityImages = {
  /**
   * Gets the passive ability icon URL
   */
  passive: async (passiveId: string): Promise<string> => {
    const version = await getLatestVersion();
    // passiveId is a full filename like "YuumiP2.png"
    return `${DATADRAGON_BASE_URL}/cdn/${version}/img/passive/${passiveId}`;
  },

  /**
   * Gets the champion spell icon URL
   */
  spell: async (spellId: string): Promise<string> => {
    const version = await getLatestVersion();
    // spellId is a full filename like "YuumiQ.png"
    return `${DATADRAGON_BASE_URL}/cdn/${version}/img/spell/${spellId}`;
  },
};

/**
 * Item Image URLs
 */
export const itemImages = {
  /**
   * Gets the item icon URL
   */
  icon: async (itemId: string): Promise<string> => {
    const version = await getLatestVersion();
    return `${DATADRAGON_BASE_URL}/cdn/${version}/img/item/${itemId}.png`;
  },
};

/**
 * Summoner Spell Image URLs
 */
export const summonerSpellImages = {
  /**
   * Gets the summoner spell icon URL
   */
  icon: async (spellId: string): Promise<string> => {
    const version = await getLatestVersion();
    return `${DATADRAGON_BASE_URL}/cdn/${version}/img/spell/${spellId}.png`;
  },
};

/**
 * Summoner Icon Image URLs
 */
export const summonerIconImages = {
  /**
   * Gets the summoner icon URL
   */
  icon: async (iconId: number): Promise<string> => {
    const version = await getLatestVersion();
    return `${DATADRAGON_BASE_URL}/cdn/${version}/img/profileicon/${iconId}.png`;
  },
};

/**
 * Rune Image URLs
 */
export const runeImages = {
  /**
   * Gets the rune icon URL
   */
  icon: async (runeIconPath: string): Promise<string> => {
    return `${DATADRAGON_BASE_URL}/cdn/img/${runeIconPath}`;
  },

  /**
   * Gets the rune tree icon URL
   */
  treeIcon: async (treeIconPath: string): Promise<string> => {
    return `${DATADRAGON_BASE_URL}/cdn/img/${treeIconPath}`;
  },
};

/**
 * Fetches champion data from DataDragon
 */
export async function getChampionData(
  locale: string = 'en_US'
): Promise<Record<string, ChampionData>> {
  const version = await getLatestVersion();
  const url = `${DATADRAGON_BASE_URL}/cdn/${version}/data/${locale}/champion.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch champion data: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching champion data:', error);
    throw error;
  }
}

/**
 * Fetches detailed champion data for a specific champion
 */
export async function getChampionDetails(
  championId: string,
  locale: string = 'en_US'
): Promise<ChampionData> {
  const version = await getLatestVersion();
  const url = `${DATADRAGON_BASE_URL}/cdn/${version}/data/${locale}/champion/${championId}.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch champion details: ${response.status}`);
    }

    const data = await response.json();
    return data.data[championId];
  } catch (error) {
    console.error('Error fetching champion details:', error);
    throw error;
  }
}

/**
 * Fetches item data from DataDragon
 */
export async function getItemData(
  locale: string = 'en_US'
): Promise<Record<string, ItemData>> {
  const version = await getLatestVersion();
  const url = `${DATADRAGON_BASE_URL}/cdn/${version}/data/${locale}/item.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch item data: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching item data:', error);
    throw error;
  }
}

/**
 * Fetches rune data from DataDragon
 */
export async function getRuneData(
  locale: string = 'en_US'
): Promise<RuneTree[]> {
  const version = await getLatestVersion();
  const url = `${DATADRAGON_BASE_URL}/cdn/${version}/data/${locale}/runesReforged.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch rune data: ${response.status}`);
    }

    const data: RuneTree[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching rune data:', error);
    throw error;
  }
}

/**
 * Utility function to preload images for better performance
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Utility function to preload multiple images
 */
export async function preloadImages(srcs: string[]): Promise<void> {
  await Promise.all(srcs.map(preloadImage));
}

/**
 * Gets a champion's image URLs in a convenient object
 */
export async function getChampionImageUrls(
  championId: string,
  skinNum: number = 0
) {
  return {
    icon: await championImages.icon(championId),
    splash: championImages.splash(championId, skinNum),
    loading: championImages.loading(championId, skinNum),
    square: await championImages.square(championId),
  };
}

/**
 * Common champion IDs for easier usage - Yuumi-focused
 */
export const COMMON_CHAMPIONS = {
  // Main champion
  YUUMI: 'Yuumi',
  // Popular support champions
  LULU: 'Lulu',
  NAMI: 'Nami',
  SORAKA: 'Soraka',
  JANNA: 'Janna',
  THRESH: 'Thresh',
  LEONA: 'Leona',
  MORGANA: 'Morgana',
  // Popular ADC champions that work well with Yuumi
  JINX: 'Jinx',
  EZREAL: 'Ezreal',
  VAYNE: 'Vayne',
  KAISA: 'Kaisa',
  TWITCH: 'Twitch',
} as const;

/**
 * Gets Yuumi-specific champion assets
 */
export async function getYuumiAssets() {
  const yuumiId = COMMON_CHAMPIONS.YUUMI;
  return {
    icon: await championImages.icon(yuumiId),
    splash: championImages.splash(yuumiId, 0), // Base skin
    loading: championImages.loading(yuumiId, 0),
    // Popular Yuumi skins
    elderwood: {
      splash: championImages.splash(yuumiId, 1),
      loading: championImages.loading(yuumiId, 1),
    },
    bewitching: {
      splash: championImages.splash(yuumiId, 2),
      loading: championImages.loading(yuumiId, 2),
    },
    heartseeker: {
      splash: championImages.splash(yuumiId, 3),
      loading: championImages.loading(yuumiId, 3),
    },
  };
}

/**
 * Gets support champion assets that work well with Yuumi
 */
export async function getSupportChampionAssets() {
  const supportChampions = [
    COMMON_CHAMPIONS.LULU,
    COMMON_CHAMPIONS.NAMI,
    COMMON_CHAMPIONS.SORAKA,
    COMMON_CHAMPIONS.JANNA,
    COMMON_CHAMPIONS.THRESH,
    COMMON_CHAMPIONS.LEONA,
    COMMON_CHAMPIONS.MORGANA,
  ];

  const assets = await Promise.all(
    supportChampions.map(async (championId) => ({
      championId,
      icon: await championImages.icon(championId),
      splash: championImages.splash(championId, 0),
    }))
  );

  return assets;
}

/**
 * Basic summoner icons available to all users
 * These are the base icons (0-28) that every League of Legends account has access to
 * Note: Icon 29 is not selectable, so we exclude it
 */
export const BASIC_SUMMONER_ICONS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28,
] as const;

/**
 * Selects a random basic summoner icon, excluding the current one
 */
export function selectRandomIcon(currentIconId: number): number {
  const availableIcons = BASIC_SUMMONER_ICONS.filter(
    (id) => id !== currentIconId
  );

  if (availableIcons.length === 0) {
    // Fallback if somehow current icon is not in basic icons or array is empty
    return BASIC_SUMMONER_ICONS[0];
  }

  const randomIndex = Math.floor(Math.random() * availableIcons.length);
  return availableIcons[randomIndex] || BASIC_SUMMONER_ICONS[0];
}

/**
 * Gets summoner icon URL with convenience function
 */
export async function getSummonerIconUrl(iconId: number): Promise<string> {
  return summonerIconImages.icon(iconId);
}

/**
 * Default fallback image for when DataDragon images fail to load
 */
export const FALLBACK_IMAGE = '/images/champion-placeholder.png';

/**
 * Stat Shard mapping constants
 * These are not included in the runesReforged.json and need manual mapping
 */
export const STAT_SHARDS: Record<number, StatShard> = {
  // Offense Slot (First Row)
  5005: {
    id: 5005,
    name: 'Attack Speed',
    description: '+10% Attack Speed',
    slot: 'offense',
  },
  5008: {
    id: 5008,
    name: 'Adaptive Force',
    description: '+9 Adaptive Force',
    slot: 'offense',
  },
  5007: {
    id: 5007,
    name: 'Ability Haste',
    description: '+8 Ability Haste',
    slot: 'offense',
  },

  // Flex Slot (Second Row) - Note: 5008 appears in multiple slots
  5002: {
    id: 5002,
    name: 'Armor',
    description: '+10 Armor',
    slot: 'flex',
  },
  5003: {
    id: 5003,
    name: 'Magic Resist',
    description: '+8 Magic Resist',
    slot: 'flex',
  },

  // Defense Slot (Third Row)
  5001: {
    id: 5001,
    name: 'Health',
    description: '+15-140 Health (based on level)',
    slot: 'defense',
  },
};

/**
 * Stat shard options by slot position
 */
export const STAT_SHARD_SLOTS = {
  offense: [5005, 5008, 5007], // Attack Speed, Adaptive Force, Ability Haste
  flex: [5008, 5002, 5003], // Adaptive Force, Armor, Magic Resist
  defense: [5001, 5002, 5003], // Health, Armor, Magic Resist
} as const;

/**
 * Rune utility functions
 */

/**
 * Gets a rune by ID from rune tree data
 */
export function getRuneById(
  runeTrees: RuneTree[],
  runeId: number
): RuneData | null {
  for (const tree of runeTrees) {
    for (const slot of tree.slots) {
      for (const rune of slot.runes) {
        if (rune.id === runeId) {
          return rune;
        }
      }
    }
  }
  return null;
}

/**
 * Gets a rune tree by ID
 */
export function getRuneTreeById(
  runeTrees: RuneTree[],
  treeId: number
): RuneTree | null {
  return runeTrees.find((tree) => tree.id === treeId) || null;
}

/**
 * Gets stat shard info by ID
 */
export function getStatShardById(statShardId: number): StatShard | null {
  return STAT_SHARDS[statShardId] || null;
}

/**
 * Gets all runes from a specific tree and slot
 */
export function getRunesByTreeAndSlot(
  runeTrees: RuneTree[],
  treeId: number,
  slotIndex: number
): RuneData[] {
  const tree = getRuneTreeById(runeTrees, treeId);
  if (!tree || !tree.slots[slotIndex]) {
    return [];
  }
  return tree.slots[slotIndex].runes;
}

/**
 * Gets keystone runes (first slot of each tree)
 */
export function getKeystoneRunes(runeTrees: RuneTree[]): RuneData[] {
  return runeTrees.flatMap((tree) => tree.slots[0]?.runes || []);
}

/**
 * Validates a rune selection
 */
export function validateRuneSelection(
  runeTrees: RuneTree[],
  selection: RuneSelection
): boolean {
  // Check if primary tree exists
  const primaryTree = getRuneTreeById(runeTrees, selection.primaryTree);
  if (!primaryTree) return false;

  // Check if secondary tree exists and is different from primary
  const secondaryTree = getRuneTreeById(runeTrees, selection.secondaryTree);
  if (!secondaryTree || selection.secondaryTree === selection.primaryTree)
    return false;

  // Check if all runes exist in their respective trees
  const primaryRunes = [
    selection.keystone,
    selection.slot1,
    selection.slot2,
    selection.slot3,
  ];
  for (let i = 0; i < primaryRunes.length; i++) {
    const runesInSlot = getRunesByTreeAndSlot(
      runeTrees,
      selection.primaryTree,
      i
    );
    if (!runesInSlot.some((rune) => rune.id === primaryRunes[i])) {
      return false;
    }
  }

  // Check secondary runes (can be from any slot except keystone)
  const secondaryRunes = [selection.secondary1, selection.secondary2];
  for (const secondaryRuneId of secondaryRunes) {
    let found = false;
    for (let i = 1; i < secondaryTree.slots.length; i++) {
      // Skip keystone slot
      const runesInSlot = getRunesByTreeAndSlot(
        runeTrees,
        selection.secondaryTree,
        i
      );
      if (runesInSlot.some((rune) => rune.id === secondaryRuneId)) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }

  // Check stat shards
  const [offense, flex, defense] = selection.statShards;
  if (
    !(STAT_SHARD_SLOTS.offense as readonly number[]).includes(offense) ||
    !(STAT_SHARD_SLOTS.flex as readonly number[]).includes(flex) ||
    !(STAT_SHARD_SLOTS.defense as readonly number[]).includes(defense)
  ) {
    return false;
  }

  return true;
}

/**
 * Gets rune icon URL with convenience function
 */
export async function getRuneIconUrl(runeIconPath: string): Promise<string> {
  return runeImages.icon(runeIconPath);
}

/**
 * Gets rune tree icon URL with convenience function
 */
export async function getRuneTreeIconUrl(
  treeIconPath: string
): Promise<string> {
  return runeImages.treeIcon(treeIconPath);
}
