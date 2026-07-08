// Matchup and synergy data extracted from page.tsx for refactor.
// This module will progressively be enriched with comprehensive per champion guidance.
// NOTE: Avoid using the em dash character. Use regular hyphens only.

export type SupportMatchup = {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tips: string[]; // concise actionable bullet points (no leading symbols here)
  recommendedRunes: string; // short rationale for rune page adjustments
  recommendedItems: string; // itemization or situational items callouts
  earlyItems?: string[]; // optional early purchase notes (e.g., ['Early Null-Magic Mantle vs heavy poke'])
  notes?: string; // free form extra context
};

export type BotLaneSynergy = {
  synergy:
    'Excellent' | 'Very Good' | 'Good' | 'Average' | 'Poor' | 'Situational';
  tips: string[];
  playstyle: string; // succinct play pattern summary
  optimalAttachTargets?: string; // if not always the bot laner (e.g., roam to jungler)
  buildAdjustments?: string[]; // optional build tweak suggestions
};

export const SUPPORT_CHAMPIONS: string[] = [
  'Alistar',
  'Amumu',
  'Annie',
  'Ashe',
  'Bard',
  'Blitzcrank',
  'Brand',
  'Braum',
  'Fiddlesticks',
  'Galio',
  'Heimerdinger',
  'Hwei',
  'Janna',
  'Karma',
  'Leona',
  'Lulu',
  'Lux',
  'Maokai',
  'Milio',
  'Morgana',
  'Nami',
  'Nautilus',
  'Neeko',
  'Poppy',
  'Pyke',
  'Rakan',
  'Rell',
  'Renata',
  'Senna',
  'Seraphine',
  'Sett',
  'Sona',
  'Soraka',
  'Swain',
  'TahmKench',
  'Taliyah',
  'Taric',
  'Thresh',
  'Velkoz',
  'Xerath',
  'Yuumi',
  'Zilean',
  'Zyra',
];

// Expanded to include ALL common bot lane picks: traditional marksmen, skirmishers, enchanter carries (Seraphine), melee (Yasuo, Yone, Nilah), mages (Ziggs, Veigar, Karthus, Syndra, Cassiopeia, Vladimir), artillery (Velkoz, Xerath), specialists (Heimerdinger, Swain), on hit (KogMaw, Teemo), and emerging picks (Smolder, Yunara).
export const ADC_CHAMPIONS: string[] = [
  // Core marksmen
  'Aphelios',
  'Ashe',
  'Caitlyn',
  'Draven',
  'Ezreal',
  'Jhin',
  'Jinx',
  'Kaisa',
  'Kalista',
  'KogMaw',
  'Lucian',
  'MissFortune',
  'Nilah',
  'Samira',
  'Sivir',
  'Smolder',
  'Tristana',
  'Twitch',
  'Varus',
  'Vayne',
  'Xayah',
  'Yunara',
  'Zeri',
  // Hybrids / Fighters / Skirmishers seen bot
  'Quinn',
  'Yasuo',
  'Yone',
  // Mage and artillery bot lanes
  'Ziggs',
  'Veigar',
  'Karthus',
  'Syndra',
  'Cassiopeia',
  'Swain',
  'Heimerdinger',
  'Velkoz',
  'Xerath',
  'TwistedFate',
  'Teemo',
  'Vladimir',
  'Taliyah',
];

// Import all per-champion matchup data
import * as supportMatchups from './matchups/supports';
import * as adcMatchups from './matchups/adcs';

// Aggregate support matchups into a single object
export const SUPPORT_MATCHUPS: Record<string, SupportMatchup> = {
  Alistar: supportMatchups.Alistar,
  Amumu: supportMatchups.Amumu,
  Annie: supportMatchups.Annie,
  Ashe: supportMatchups.Ashe,
  Bard: supportMatchups.Bard,
  Blitzcrank: supportMatchups.Blitzcrank,
  Brand: supportMatchups.Brand,
  Braum: supportMatchups.Braum,
  Fiddlesticks: supportMatchups.Fiddlesticks,
  Galio: supportMatchups.Galio,
  Heimerdinger: supportMatchups.Heimerdinger,
  Hwei: supportMatchups.Hwei,
  Janna: supportMatchups.Janna,
  Karma: supportMatchups.Karma,
  Leona: supportMatchups.Leona,
  Lulu: supportMatchups.Lulu,
  Lux: supportMatchups.Lux,
  Maokai: supportMatchups.Maokai,
  Milio: supportMatchups.Milio,
  Morgana: supportMatchups.Morgana,
  Nami: supportMatchups.Nami,
  Nautilus: supportMatchups.Nautilus,
  Neeko: supportMatchups.Neeko,
  Poppy: supportMatchups.Poppy,
  Pyke: supportMatchups.Pyke,
  Rakan: supportMatchups.Rakan,
  Rell: supportMatchups.Rell,
  Renata: supportMatchups.Renata,
  Senna: supportMatchups.Senna,
  Seraphine: supportMatchups.Seraphine,
  Sett: supportMatchups.Sett,
  Sona: supportMatchups.Sona,
  Soraka: supportMatchups.Soraka,
  Swain: supportMatchups.Swain,
  TahmKench: supportMatchups.TahmKench,
  Taliyah: supportMatchups.Taliyah,
  Taric: supportMatchups.Taric,
  Thresh: supportMatchups.Thresh,
  Velkoz: supportMatchups.Velkoz,
  Xerath: supportMatchups.Xerath,
  Yuumi: supportMatchups.Yuumi,
  Zilean: supportMatchups.Zilean,
  Zyra: supportMatchups.Zyra,
};

// Aggregate ADC synergies into a single object
export const ADC_MATCHUPS: Record<string, BotLaneSynergy> = {
  Aphelios: adcMatchups.Aphelios,
  Ashe: adcMatchups.Ashe,
  Caitlyn: adcMatchups.Caitlyn,
  Cassiopeia: adcMatchups.Cassiopeia,
  Draven: adcMatchups.Draven,
  Ezreal: adcMatchups.Ezreal,
  Jhin: adcMatchups.Jhin,
  Jinx: adcMatchups.Jinx,
  Kaisa: adcMatchups.Kaisa,
  Kalista: adcMatchups.Kalista,
  Karthus: adcMatchups.Karthus,
  KogMaw: adcMatchups.KogMaw,
  Lucian: adcMatchups.Lucian,
  MissFortune: adcMatchups.MissFortune,
  Nilah: adcMatchups.Nilah,
  Quinn: adcMatchups.Quinn,
  Samira: adcMatchups.Samira,
  Sivir: adcMatchups.Sivir,
  Smolder: adcMatchups.Smolder,
  Syndra: adcMatchups.Syndra,
  Taliyah: adcMatchups.Taliyah,
  Teemo: adcMatchups.Teemo,
  Tristana: adcMatchups.Tristana,
  TwistedFate: adcMatchups.TwistedFate,
  Twitch: adcMatchups.Twitch,
  Varus: adcMatchups.Varus,
  Vayne: adcMatchups.Vayne,
  Veigar: adcMatchups.Veigar,
  Vladimir: adcMatchups.Vladimir,
  Xayah: adcMatchups.Xayah,
  Yasuo: adcMatchups.Yasuo,
  Yone: adcMatchups.Yone,
  Yunara: adcMatchups.Yunara,
  Zeri: adcMatchups.Zeri,
  Ziggs: adcMatchups.Ziggs,
};
