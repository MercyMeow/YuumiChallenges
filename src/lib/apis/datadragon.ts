/**
 * DataDragon API utilities for League of Legends static data and assets
 * Official CDN: https://ddragon.leagueoflegends.com/cdn/
 */

// DataDragon API base URL
const DATADRAGON_BASE_URL = "https://ddragon.leagueoflegends.com";

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
    const latest = versions[0]; // First version is always the latest
    
    // Cache the results
    cachedVersions = versions;
    cachedLatestVersion = latest;
    
    return { versions, latest };
  } catch (error) {
    console.error("Error fetching DataDragon versions:", error);
    // Fallback to a reasonable default if the API fails
    return { versions: ["14.23.1"], latest: "14.23.1" };
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
    return `${DATADRAGON_BASE_URL}/cdn/${version}/img/passive/${passiveId}.png`;
  },

  /**
   * Gets the champion spell icon URL
   */
  spell: async (spellId: string): Promise<string> => {
    const version = await getLatestVersion();
    return `${DATADRAGON_BASE_URL}/cdn/${version}/img/spell/${spellId}.png`;
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
 * Rune Image URLs
 */
export const runeImages = {
  /**
   * Gets the rune icon URL
   */
  icon: async (runeId: string): Promise<string> => {
    const version = await getLatestVersion();
    return `${DATADRAGON_BASE_URL}/cdn/${version}/img/perk/${runeId}.png`;
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
 * Fetches champion data from DataDragon
 */
export async function getChampionData(locale: string = "en_US"): Promise<Record<string, ChampionData>> {
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
    console.error("Error fetching champion data:", error);
    throw error;
  }
}

/**
 * Fetches detailed champion data for a specific champion
 */
export async function getChampionDetails(championId: string, locale: string = "en_US"): Promise<ChampionData> {
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
    console.error("Error fetching champion details:", error);
    throw error;
  }
}

/**
 * Fetches item data from DataDragon
 */
export async function getItemData(locale: string = "en_US"): Promise<Record<string, ItemData>> {
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
    console.error("Error fetching item data:", error);
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
export async function getChampionImageUrls(championId: string, skinNum: number = 0) {
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
  YUUMI: "Yuumi",
  // Popular support champions
  LULU: "Lulu",
  NAMI: "Nami",
  SORAKA: "Soraka",
  JANNA: "Janna",
  THRESH: "Thresh",
  LEONA: "Leona",
  MORGANA: "Morgana",
  // Popular ADC champions that work well with Yuumi
  JINX: "Jinx",
  EZREAL: "Ezreal",
  VAYNE: "Vayne",
  KAISA: "Kaisa",
  TWITCH: "Twitch",
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
 * These are the base icons (0-29) that every League of Legends account has access to
 */
export const BASIC_SUMMONER_ICONS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29,
] as const;

/**
 * Selects a random basic summoner icon, excluding the current one
 */
export function selectRandomIcon(currentIconId: number): number {
  const availableIcons = BASIC_SUMMONER_ICONS.filter(id => id !== currentIconId);
  
  if (availableIcons.length === 0) {
    // Fallback if somehow current icon is not in basic icons or array is empty
    return BASIC_SUMMONER_ICONS[0];
  }
  
  const randomIndex = Math.floor(Math.random() * availableIcons.length);
  return availableIcons[randomIndex];
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
export const FALLBACK_IMAGE = "/images/champion-placeholder.png";