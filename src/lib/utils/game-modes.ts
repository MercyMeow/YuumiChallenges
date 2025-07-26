/**
 * Game mode mapping utilities for League of Legends
 * Maps queue IDs to readable game mode names
 */

export interface GameModeInfo {
  id: number;
  name: string;
  description: string;
  category: 'ranked' | 'normal' | 'aram' | 'rotating' | 'custom' | 'tournament';
  isRanked: boolean;
}

/**
 * Comprehensive queue ID to game mode mapping
 * Based on Riot Games API documentation
 */
export const GAME_MODES: Record<number, GameModeInfo> = {
  // Ranked queues
  420: {
    id: 420,
    name: 'Ranked Solo/Duo',
    description: 'Summoner\'s Rift (5v5 Ranked Solo/Duo)',
    category: 'ranked',
    isRanked: true,
  },
  440: {
    id: 440,
    name: 'Ranked Flex',
    description: 'Summoner\'s Rift (5v5 Ranked Flex)',
    category: 'ranked',
    isRanked: true,
  },

  // Normal queues
  400: {
    id: 400,
    name: 'Normal Draft',
    description: 'Summoner\'s Rift (5v5 Draft Pick)',
    category: 'normal',
    isRanked: false,
  },
  430: {
    id: 430,
    name: 'Normal Blind',
    description: 'Summoner\'s Rift (5v5 Blind Pick)',
    category: 'normal',
    isRanked: false,
  },
  490: {
    id: 490,
    name: 'Normal Draft',
    description: 'Summoner\'s Rift (5v5 Draft Pick)',
    category: 'normal',
    isRanked: false,
  },

  // ARAM
  450: {
    id: 450,
    name: 'ARAM',
    description: 'Howling Abyss (5v5 All Random All Mid)',
    category: 'aram',
    isRanked: false,
  },
  
  // Rotating Game Modes
  900: {
    id: 900,
    name: 'URF',
    description: 'Summoner\'s Rift (Ultra Rapid Fire)',
    category: 'rotating',
    isRanked: false,
  },
  1010: {
    id: 1010,
    name: 'Snow URF',
    description: 'Summoner\'s Rift (Snow Battle ARURF)',
    category: 'rotating',
    isRanked: false,
  },
  1020: {
    id: 1020,
    name: 'One for All',
    description: 'Summoner\'s Rift (One for All)',
    category: 'rotating',
    isRanked: false,
  },
  1300: {
    id: 1300,
    name: 'Nexus Blitz',
    description: 'Nexus Blitz',
    category: 'rotating',
    isRanked: false,
  },
  1400: {
    id: 1400,
    name: 'Ultimate Spellbook',
    description: 'Summoner\'s Rift (Ultimate Spellbook)',
    category: 'rotating',
    isRanked: false,
  },
  1900: {
    id: 1900,
    name: 'URF',
    description: 'Summoner\'s Rift (Pick URF)',
    category: 'rotating',
    isRanked: false,
  },

  // Arena
  1700: {
    id: 1700,
    name: 'Arena',
    description: 'Arena (2v2v2v2)',
    category: 'rotating',
    isRanked: false,
  },

  // Custom and other modes
  0: {
    id: 0,
    name: 'Custom',
    description: 'Custom Game',
    category: 'custom',
    isRanked: false,
  },
  2: {
    id: 2,
    name: 'Normal Blind',
    description: 'Summoner\'s Rift (5v5 Blind Pick) - Legacy',
    category: 'normal',
    isRanked: false,
  },
  8: {
    id: 8,
    name: 'Normal Draft',
    description: 'Twisted Treeline (3v3 Normal) - Legacy',
    category: 'normal',
    isRanked: false,
  },
  9: {
    id: 9,
    name: 'Ranked Flex',
    description: 'Twisted Treeline (3v3 Ranked) - Legacy',
    category: 'ranked',
    isRanked: true,
  },
  14: {
    id: 14,
    name: 'Normal Draft',
    description: 'Summoner\'s Rift (5v5 Draft) - Legacy',
    category: 'normal',
    isRanked: false,
  },
  16: {
    id: 16,
    name: 'Dominion',
    description: 'Crystal Scar (5v5 Dominion Blind) - Legacy',
    category: 'normal',
    isRanked: false,
  },
  17: {
    id: 17,
    name: 'Dominion Draft',
    description: 'Crystal Scar (5v5 Dominion Draft) - Legacy',
    category: 'normal',
    isRanked: false,
  },
  25: {
    id: 25,
    name: 'Dominion Co-op',
    description: 'Crystal Scar (Dominion Co-op vs AI) - Legacy',
    category: 'normal',
    isRanked: false,
  },
  31: {
    id: 31,
    name: 'Co-op vs AI Intro',
    description: 'Summoner\'s Rift (Co-op vs AI Intro)',
    category: 'normal',
    isRanked: false,
  },
  32: {
    id: 32,
    name: 'Co-op vs AI Beginner',
    description: 'Summoner\'s Rift (Co-op vs AI Beginner)',
    category: 'normal',
    isRanked: false,
  },
  33: {
    id: 33,
    name: 'Co-op vs AI Intermediate',
    description: 'Summoner\'s Rift (Co-op vs AI Intermediate)',
    category: 'normal',
    isRanked: false,
  },
  41: {
    id: 41,
    name: 'Ranked Team 3v3',
    description: 'Twisted Treeline (3v3 Ranked Team) - Legacy',
    category: 'ranked',
    isRanked: true,
  },
  42: {
    id: 42,
    name: 'Ranked Team 5v5',
    description: 'Summoner\'s Rift (5v5 Ranked Team) - Legacy',
    category: 'ranked',
    isRanked: true,
  },
  52: {
    id: 52,
    name: 'Co-op vs AI ARAM',
    description: 'Twisted Treeline (Co-op vs AI) - Legacy',
    category: 'normal',
    isRanked: false,
  },
  61: {
    id: 61,
    name: 'Team Builder',
    description: 'Summoner\'s Rift (5v5 Team Builder) - Legacy',
    category: 'normal',
    isRanked: false,
  },
  65: {
    id: 65,
    name: 'ARAM',
    description: 'Howling Abyss (5v5 ARAM) - Legacy',
    category: 'aram',
    isRanked: false,
  },
  70: {
    id: 70,
    name: 'One for All',
    description: 'Summoner\'s Rift (One for All) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  72: {
    id: 72,
    name: 'Snowdown Showdown',
    description: 'Howling Abyss (1v1 Snowdown Showdown) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  73: {
    id: 73,
    name: 'Snowdown Showdown',
    description: 'Howling Abyss (2v2 Snowdown Showdown) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  75: {
    id: 75,
    name: 'Hexakill',
    description: 'Summoner\'s Rift (6v6 Hexakill) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  76: {
    id: 76,
    name: 'URF',
    description: 'Summoner\'s Rift (Ultra Rapid Fire) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  78: {
    id: 78,
    name: 'One for All: Mirror Mode',
    description: 'Howling Abyss (One For All: Mirror Mode) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  83: {
    id: 83,
    name: 'Co-op vs AI URF',
    description: 'Summoner\'s Rift (Co-op vs AI Ultra Rapid Fire) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  91: {
    id: 91,
    name: 'Doom Bots Rank 1',
    description: 'Summoner\'s Rift (Doom Bots Voting) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  92: {
    id: 92,
    name: 'Doom Bots Rank 2',
    description: 'Summoner\'s Rift (Doom Bots Standard) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  93: {
    id: 93,
    name: 'Doom Bots Rank 5',
    description: 'Summoner\'s Rift (Doom Bots Intense) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  96: {
    id: 96,
    name: 'Ascension',
    description: 'Crystal Scar (Ascension) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  98: {
    id: 98,
    name: 'Hexakill',
    description: 'Twisted Treeline (6v6 Hexakill) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  100: {
    id: 100,
    name: 'ARAM',
    description: 'Butcher\'s Bridge (5v5 ARAM) - Legacy',
    category: 'aram',
    isRanked: false,
  },
  300: {
    id: 300,
    name: 'Legend of the Poro King',
    description: 'Howling Abyss (Legend of the Poro King) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  310: {
    id: 310,
    name: 'Nemesis Draft',
    description: 'Summoner\'s Rift (Nemesis Draft) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  313: {
    id: 313,
    name: 'Black Market Brawlers',
    description: 'Summoner\'s Rift (Black Market Brawlers) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  317: {
    id: 317,
    name: 'Definitely Not Dominion',
    description: 'Crystal Scar (Definitely Not Dominion) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  318: {
    id: 318,
    name: 'ARURF',
    description: 'Summoner\'s Rift (All Random URF) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  325: {
    id: 325,
    name: 'All Random',
    description: 'Summoner\'s Rift (All Random) - Legacy',
    category: 'rotating',
    isRanked: false,
  },
  410: {
    id: 410,
    name: 'Ranked Solo',
    description: 'Summoner\'s Rift (5v5 Ranked Dynamic Queue) - Legacy',
    category: 'ranked',
    isRanked: true,
  },
  700: {
    id: 700,
    name: 'Clash',
    description: 'Summoner\'s Rift (Clash)',
    category: 'tournament',
    isRanked: false,
  },
  800: {
    id: 800,
    name: 'Co-op vs AI 3v3',
    description: 'Twisted Treeline (Co-op vs AI Intermediate) - Legacy',
    category: 'normal',
    isRanked: false,
  },
  810: {
    id: 810,
    name: 'Co-op vs AI 3v3',
    description: 'Twisted Treeline (Co-op vs AI Intro) - Legacy',
    category: 'normal',
    isRanked: false,
  },
  820: {
    id: 820,
    name: 'Co-op vs AI 3v3',
    description: 'Twisted Treeline (Co-op vs AI Beginner) - Legacy',
    category: 'normal',
    isRanked: false,
  },
  830: {
    id: 830,
    name: 'Co-op vs AI Intro',
    description: 'Summoner\'s Rift (Co-op vs AI Intro Bot)',
    category: 'normal',
    isRanked: false,
  },
  840: {
    id: 840,
    name: 'Co-op vs AI Beginner',
    description: 'Summoner\'s Rift (Co-op vs AI Beginner Bot)',
    category: 'normal',
    isRanked: false,
  },
  850: {
    id: 850,
    name: 'Co-op vs AI Intermediate',
    description: 'Summoner\'s Rift (Co-op vs AI Intermediate Bot)',
    category: 'normal',
    isRanked: false,
  },
  920: {
    id: 920,
    name: 'Legend of the Poro King',
    description: 'Howling Abyss (Legend of the Poro King)',
    category: 'rotating',
    isRanked: false,
  },
  940: {
    id: 940,
    name: 'Nexus Siege',
    description: 'Summoner\'s Rift (Nexus Siege)',
    category: 'rotating',
    isRanked: false,
  },
  950: {
    id: 950,
    name: 'Doom Bots Voting',
    description: 'Summoner\'s Rift (Doom Bots Voting)',
    category: 'rotating',
    isRanked: false,
  },
  960: {
    id: 960,
    name: 'Doom Bots Standard',
    description: 'Summoner\'s Rift (Doom Bots Standard)',
    category: 'rotating',
    isRanked: false,
  },
  980: {
    id: 980,
    name: 'Star Guardian Invasion',
    description: 'Valoran City Park (Star Guardian Invasion Normal)',
    category: 'rotating',
    isRanked: false,
  },
  990: {
    id: 990,
    name: 'Star Guardian Invasion',
    description: 'Valoran City Park (Star Guardian Invasion Onslaught)',
    category: 'rotating',
    isRanked: false,
  },
  1000: {
    id: 1000,
    name: 'PROJECT: Hunters',
    description: 'Overcharge (PROJECT: Hunters)',
    category: 'rotating',
    isRanked: false,
  },
};

/**
 * Gets game mode information by queue ID
 */
export function getGameModeInfo(queueId: number): GameModeInfo {
  return GAME_MODES[queueId] || {
    id: queueId,
    name: 'Unknown',
    description: `Unknown game mode (Queue ID: ${queueId})`,
    category: 'custom',
    isRanked: false,
  };
}

/**
 * Gets the display name for a game mode
 */
export function getGameModeDisplayName(queueId: number): string {
  const mode = getGameModeInfo(queueId);
  return mode.name;
}

/**
 * Gets the full description for a game mode
 */
export function getGameModeDescription(queueId: number): string {
  const mode = getGameModeInfo(queueId);
  return mode.description;
}

/**
 * Checks if a queue ID represents a ranked game mode
 */
export function isRankedQueue(queueId: number): boolean {
  const mode = getGameModeInfo(queueId);
  return mode.isRanked;
}

/**
 * Gets the category of a game mode
 */
export function getGameModeCategory(queueId: number): GameModeInfo['category'] {
  const mode = getGameModeInfo(queueId);
  return mode.category;
}

/**
 * Gets the color associated with a game mode category
 */
export function getGameModeCategoryColor(category: GameModeInfo['category']): string {
  switch (category) {
    case 'ranked':
      return 'text-yellow-400';
    case 'normal':
      return 'text-blue-400';
    case 'aram':
      return 'text-green-400';
    case 'rotating':
      return 'text-purple-400';
    case 'tournament':
      return 'text-red-400';
    case 'custom':
    default:
      return 'text-gray-400';
  }
}

/**
 * Gets all game modes in a specific category
 */
export function getGameModesByCategory(category: GameModeInfo['category']): GameModeInfo[] {
  return Object.values(GAME_MODES).filter(mode => mode.category === category);
}

/**
 * Gets the most common/popular game modes
 */
export function getPopularGameModes(): GameModeInfo[] {
  const popularQueueIds = [420, 440, 400, 430, 450, 1300, 1400, 900];
  return popularQueueIds.map(id => getGameModeInfo(id));
}