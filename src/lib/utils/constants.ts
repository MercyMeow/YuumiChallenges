export const REGIONS = {
  NA1: 'na1',
  EUW1: 'euw1',
  EUN1: 'eun1',
  KR: 'kr',
  JP1: 'jp1',
  BR1: 'br1',
  LA1: 'la1',
  LA2: 'la2',
  OC1: 'oc1',
  TR1: 'tr1',
  RU: 'ru',
  PH2: 'ph2',
  SG2: 'sg2',
  TH2: 'th2',
  TW2: 'tw2',
  VN2: 'vn2'
} as const;

export const REGION_NAMES = {
  [REGIONS.NA1]: 'North America',
  [REGIONS.EUW1]: 'Europe West',
  [REGIONS.EUN1]: 'Europe Nordic & East',
  [REGIONS.KR]: 'Korea',
  [REGIONS.JP1]: 'Japan',
  [REGIONS.BR1]: 'Brazil',
  [REGIONS.LA1]: 'Latin America North',
  [REGIONS.LA2]: 'Latin America South',
  [REGIONS.OC1]: 'Oceania',
  [REGIONS.TR1]: 'Turkey',
  [REGIONS.RU]: 'Russia',
  [REGIONS.PH2]: 'Philippines',
  [REGIONS.SG2]: 'Singapore',
  [REGIONS.TH2]: 'Thailand',
  [REGIONS.TW2]: 'Taiwan',
  [REGIONS.VN2]: 'Vietnam'
} as const;

export const ROUTES = {
  AMERICAS: 'americas',
  ASIA: 'asia',
  EUROPE: 'europe',
  SEA: 'sea'
} as const;

export const REGION_TO_ROUTE = {
  [REGIONS.NA1]: ROUTES.AMERICAS,
  [REGIONS.BR1]: ROUTES.AMERICAS,
  [REGIONS.LA1]: ROUTES.AMERICAS,
  [REGIONS.LA2]: ROUTES.AMERICAS,
  [REGIONS.OC1]: ROUTES.SEA,
  [REGIONS.KR]: ROUTES.ASIA,
  [REGIONS.JP1]: ROUTES.ASIA,
  [REGIONS.EUW1]: ROUTES.EUROPE,
  [REGIONS.EUN1]: ROUTES.EUROPE,
  [REGIONS.TR1]: ROUTES.EUROPE,
  [REGIONS.RU]: ROUTES.EUROPE,
  [REGIONS.PH2]: ROUTES.SEA,
  [REGIONS.SG2]: ROUTES.SEA,
  [REGIONS.TH2]: ROUTES.SEA,
  [REGIONS.TW2]: ROUTES.SEA,
  [REGIONS.VN2]: ROUTES.SEA
} as const;

export const DISCORD_SCOPES = [
  'identify',
  'guilds',
  'guilds.members.read'
] as const;

export const YUUMI_DISCORD_SERVER_ID = process.env.YUUMI_DISCORD_SERVER_ID || '';

export const CHALLENGE_TYPES = {
  KDA: 'kda',
  WINSTREAK: 'winstreak',
  CHAMPION_MASTERY: 'champion_mastery',
  RANKED_CLIMB: 'ranked_climb',
  GAMES_PLAYED: 'games_played',
  PERFECT_GAME: 'perfect_game'
} as const;
