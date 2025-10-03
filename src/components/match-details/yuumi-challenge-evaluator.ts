import challengeDataRaw from '@/data/yuumi-challenges';

const challengeData = ((
  challengeDataRaw as { default?: typeof challengeDataRaw }
).default ??
  (challengeDataRaw as typeof challengeDataRaw)) as typeof challengeDataRaw;
import { ExtendedMatchData, ExtendedMatchParticipant } from './types';
import { ParticipantPerkStyleSelection } from '@/lib/types';

type CategoryKey = keyof (typeof challengeData)['categories'];
type RoleKey = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';

const ROLE_ALIASES: Record<RoleKey, string[]> = {
  TOP: ['TOP'],
  JUNGLE: ['JUNGLE'],
  MIDDLE: ['MIDDLE', 'MID'],
  BOTTOM: ['BOTTOM', 'BOT', 'ADC'],
  UTILITY: ['UTILITY', 'SUPPORT'],
};

const CATEGORY_ORDER: CategoryKey[] = [
  'seasonal',
  'bonus',
  'unique',
  'regular',
  'color',
];

const manualChallengeNames = new Set<string>([
  'Little Pakiti',
  'Rainbow Yuumi',
  'Yuumi of All Trades',
  'Victorious Yuumi',
  'Top Purrcentile',
  'CATaclysm',
  'TFT Yuumi Carry',
]);
const manualCategoryKeys = new Set<CategoryKey>(['color']);

const STYLE_NAMES: Record<number, string> = {
  8000: 'Precision',
  8100: 'Domination',
  8200: 'Sorcery',
  8300: 'Inspiration',
  8400: 'Resolve',
};

const getStyleName = (styleId?: number) =>
  styleId != null ? (STYLE_NAMES[styleId] ?? `Style ${styleId}`) : 'Unknown';

type ChallengeDefinition = {
  name: string;
  requirement: string;
  category: CategoryKey;
  runes?: string[];
  items?: string[];
  build?: string;
  gamemode?: string;
};

const RAW_CHALLENGES: ChallengeDefinition[] = [
  ...challengeData.seasonalChallenges,
  ...challengeData.colorChallenges,
  ...challengeData.bonusChallenges,
  ...challengeData.uniqueChallenges,
  ...challengeData.regularChallenges,
].map((challenge) => ({
  ...challenge,
  category: challenge.category as CategoryKey,
}));

export type ChallengeStatus = 'achieved' | 'likely' | 'manual' | 'not_met';

export const CHALLENGE_STATUS_PRIORITY: Record<ChallengeStatus, number> = {
  achieved: 0,
  likely: 1,
  manual: 2,
  not_met: 3,
};

export interface ChallengeEvidence {
  label: string;
  value: string;
  accent?: 'positive' | 'negative' | undefined;
}

export interface EvaluatedChallenge {
  id: string;
  name: string;
  requirement: string;
  categoryKey: CategoryKey;
  status: ChallengeStatus;
  note?: string | undefined;
  evidence: ChallengeEvidence[];
  manual: boolean;
  meta: {
    runes?: string[] | undefined;
    items?: string[] | undefined;
    build?: string | undefined;
    gamemode?: string | undefined;
  };
}

export interface EvaluatedCategory {
  key: CategoryKey;
  name: string;
  description: string;
  active: boolean;
  stats: {
    total: number;
    achieved: number;
    likely: number;
    manual: number;
  };
  challenges: EvaluatedChallenge[];
}

interface ComputedContext {
  participant: ExtendedMatchParticipant;
  matchData: ExtendedMatchData;
  durationSeconds: number;
  durationMinutes: number;
  kills: number;
  assists: number;
  deaths: number;
  takedowns: number;
  killScore: number;
  takedownsPerMinute: number;
  totalDamage: number;
  physicalDamage: number;
  magicDamage: number;
  shielding: number;
  healing: number;
  dragonKills: number;
  turretDamage: number;
  ccScore: number;
  visionScore: number;
  visionPerMinute: number;
  teamPosition?: string | undefined;
  enemyByRole: (role: RoleKey) => ExtendedMatchParticipant | undefined;
  runeSelections: Map<number, ParticipantPerkStyleSelection>;
  keystone?: ParticipantPerkStyleSelection | undefined;
  primaryStyleId?: number | undefined;
  secondaryStyleId?: number | undefined;
  isArena: boolean;
  isUltimateSpellbook: boolean;
  isTft: boolean;
  gameMode?: string | undefined;
  queueId?: number | undefined;
}

const formatNumber = (value: number, digits = 0) =>
  value.toLocaleString('en-US', { maximumFractionDigits: digits });
const formatRate = (value: number, digits = 2) =>
  value.toLocaleString('en-US', { maximumFractionDigits: digits });
const percent = (portion: number, total: number) =>
  total > 0 ? (portion / total) * 100 : 0;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildContext = (
  participant: ExtendedMatchParticipant,
  matchData: ExtendedMatchData
): ComputedContext => {
  const rawDuration =
    typeof participant.timePlayed === 'number' && participant.timePlayed > 0
      ? participant.timePlayed
      : typeof matchData.info?.gameDuration === 'number'
        ? matchData.info.gameDuration
        : 0;
  const durationSeconds = rawDuration > 0 ? rawDuration : 0;
  const durationMinutes = Math.max(durationSeconds / 60, 1);

  const kills = participant.kills ?? 0;
  const assists = participant.assists ?? 0;
  const deaths = participant.deaths ?? 0;
  const takedowns = kills + assists;
  const killScore = takedowns - deaths;
  const takedownsPerMinute = takedowns / durationMinutes;

  const totalDamage = participant.totalDamageDealtToChampions ?? 0;
  const physicalDamage = participant.physicalDamageDealtToChampions ?? 0;
  const magicDamage = participant.magicDamageDealtToChampions ?? 0;
  const shielding =
    participant.totalDamageShieldedOnTeammates ??
    participant.challenges?.totalDamageShieldedOnTeammates ??
    0;
  const healing = participant.totalHealsOnTeammates ?? 0;
  const dragonKills =
    participant.dragonKills ?? participant.challenges?.dragonTakedowns ?? 0;
  const turretDamage = participant.damageDealtToTurrets ?? 0;
  const ccScore =
    participant.challenges?.crowdControlScore ??
    participant.timeCCingOthers ??
    0;
  const visionScore =
    participant.visionScore ?? participant.challenges?.visionScore ?? 0;
  const visionPerMinute =
    participant.challenges?.visionScorePerMinute ??
    visionScore / durationMinutes;

  const teamPositionRaw =
    participant.teamPosition ?? participant.individualPosition;
  const teamPosition = teamPositionRaw
    ? teamPositionRaw.toString().toUpperCase()
    : undefined;

  const allParticipants = matchData.info?.participants ?? [];
  const enemyTeam = allParticipants.filter(
    (member) => member.teamId !== participant.teamId
  );

  const runeSelections = new Map<number, ParticipantPerkStyleSelection>();
  const styles = participant.perks?.styles ?? [];
  let primaryStyleId: number | undefined;
  let secondaryStyleId: number | undefined;
  let keystone: ParticipantPerkStyleSelection | undefined;

  for (const style of styles) {
    if (!style || !Array.isArray(style.selections)) {
      continue;
    }
    if (style.description === 'primaryStyle') {
      primaryStyleId = style.style;
      keystone = style.selections[0];
    } else if (style.description === 'subStyle') {
      secondaryStyleId = style.style;
    }
    for (const selection of style.selections) {
      if (selection && typeof selection.perk === 'number') {
        runeSelections.set(selection.perk, selection);
      }
    }
  }

  const gameMode = matchData.info?.gameMode;
  const queueId = matchData.info?.queueId;
  const normalizedMode = gameMode
    ? gameMode.toString().toUpperCase()
    : undefined;

  const isArena = normalizedMode === 'CHERRY' || queueId === 1700;
  const isUltimateSpellbook = normalizedMode === 'ULTBOOK' || queueId === 1400;
  const isTft =
    normalizedMode === 'TFT' ||
    normalizedMode === 'CHERRY_TFT' ||
    queueId === 1100;

  const enemyByRole = (role: RoleKey) => {
    const aliases = ROLE_ALIASES[role];
    return enemyTeam.find((member) => {
      const pos = (member.teamPosition ?? member.individualPosition ?? '')
        .toString()
        .toUpperCase();
      return aliases.includes(pos);
    });
  };

  return {
    participant,
    matchData,
    durationSeconds,
    durationMinutes,
    kills,
    assists,
    deaths,
    takedowns,
    killScore,
    takedownsPerMinute,
    totalDamage,
    physicalDamage,
    magicDamage,
    shielding,
    healing,
    dragonKills,
    turretDamage,
    ccScore,
    visionScore,
    visionPerMinute,
    teamPosition,
    enemyByRole,
    runeSelections,
    keystone,
    primaryStyleId,
    secondaryStyleId,
    isArena,
    isUltimateSpellbook,
    isTft,
    gameMode,
    queueId,
  };
};

const evaluateDefinition = (
  definition: ChallengeDefinition,
  ctx: ComputedContext,
  previous: Map<string, EvaluatedChallenge>
): EvaluatedChallenge => {
  const categoryKey = definition.category;
  const manual =
    manualChallengeNames.has(definition.name) ||
    manualCategoryKeys.has(categoryKey);

  let status: ChallengeStatus = manual ? 'manual' : 'not_met';
  let note: string | undefined;
  const evidence: ChallengeEvidence[] = [];

  const addEvidence = (
    label: string,
    value?: string | number,
    accent?: 'positive' | 'negative'
  ) => {
    if (value == null) {
      return;
    }
    evidence.push({
      label,
      value:
        typeof value === 'number'
          ? value.toLocaleString('en-US', { maximumFractionDigits: 2 })
          : value,
      accent,
    });
  };

  switch (definition.name) {
    case "Thresh's Cat Employee": {
      const hasDarkHarvest = ctx.keystone?.perk === 8128;
      const souls =
        hasDarkHarvest && ctx.keystone?.var2 != null ? ctx.keystone.var2 : null;
      const soulsPerMinute = souls != null ? souls / ctx.durationMinutes : null;

      if (!hasDarkHarvest) {
        status = 'not_met';
        note = 'Dark Harvest was not selected.';
      } else if (soulsPerMinute == null) {
        status = 'manual';
        note = 'Dark Harvest stack data missing; confirm soul count manually.';
      } else {
        addEvidence(
          'Souls harvested',
          souls ?? undefined,
          soulsPerMinute >= 0.3 ? 'positive' : undefined
        );
        addEvidence('Souls per minute', formatRate(soulsPerMinute, 2));
        addEvidence('Required rate', '≥ 0.30');
        if (soulsPerMinute >= 0.3) {
          status = 'achieved';
        } else {
          status = 'not_met';
          note = `Reached ${formatRate(soulsPerMinute, 2)}/min, needed 0.30.`;
        }
      }
      break;
    }
    case 'Cat Creep': {
      const ghost = ctx.runeSelections.get(8120);
      const enemiesSpotted = ghost && ghost.var1 != null ? ghost.var1 : null;
      const porosSpawned = ghost && ghost.var3 != null ? ghost.var3 : null;
      const perMinute =
        enemiesSpotted != null ? enemiesSpotted / ctx.durationMinutes : null;

      if (!ghost) {
        status = 'not_met';
        note = 'Ghost Poro rune was not selected.';
      } else if (perMinute == null) {
        status = 'manual';
        note =
          'Ghost Poro tracking unavailable; confirm enemy reveals manually.';
      } else {
        addEvidence(
          'Enemies spotted',
          enemiesSpotted ?? undefined,
          perMinute >= 0.2 ? 'positive' : undefined
        );
        if (porosSpawned != null) {
          addEvidence('Poros spawned', porosSpawned ?? undefined);
        }
        addEvidence('Spots per minute', formatRate(perMinute, 2));
        addEvidence('Required rate', '≥ 0.20');
        status = perMinute >= 0.2 ? 'achieved' : 'not_met';
        if (status === 'not_met') {
          note = `Reached ${formatRate(perMinute, 2)}/min, needed 0.20.`;
        }
      }
      break;
    }
    case 'Hallowed Cat': {
      const thresh = previous.get("Thresh's Cat Employee");
      const creep = previous.get('Cat Creep');

      if (!thresh || !creep) {
        status = 'manual';
        note = 'Seasonal prerequisite checks missing.';
      } else {
        addEvidence('Thresh status', thresh.status);
        addEvidence('Cat Creep status', creep.status);
        const bothCompleted =
          thresh.status === 'achieved' && creep.status === 'achieved';
        if (bothCompleted) {
          status = 'achieved';
        } else if (
          thresh.status === 'manual' ||
          creep.status === 'manual' ||
          thresh.status === 'likely' ||
          creep.status === 'likely'
        ) {
          status = 'manual';
          note =
            'Seasonal prerequisites require manual confirmation in this match.';
        } else {
          status = 'not_met';
          note = 'Requires both Thresh and Cat Creep in the same game.';
        }
      }
      break;
    }
    case 'Red Cat': {
      const hasDomination = ctx.primaryStyleId === 8100;
      const killsMet = ctx.kills >= 5;
      addEvidence(
        'Primary rune path',
        getStyleName(ctx.primaryStyleId),
        hasDomination ? 'positive' : 'negative'
      );
      addEvidence('Kills', ctx.kills, killsMet ? 'positive' : 'negative');
      addEvidence('Required kills', '≥ 5');
      const issues: string[] = [];
      if (!hasDomination) {
        issues.push('Requires Domination as the primary rune path.');
      }
      if (!killsMet) {
        issues.push(`Needs 5 kills (current ${ctx.kills}).`);
      }
      if (issues.length > 0) {
        status = 'not_met';
        note = issues.join(' ');
      } else {
        status = 'manual';
        note =
          'Stats met. Manually verify red items (Duskblade, Eclipse, etc.).';
      }
      break;
    }
    case 'Garfield': {
      const hasDomination =
        ctx.primaryStyleId === 8100 || ctx.secondaryStyleId === 8100;
      const hasPrecision =
        ctx.primaryStyleId === 8000 || ctx.secondaryStyleId === 8000;
      const takedownsMet = ctx.takedowns >= 25;
      addEvidence(
        'Rune paths',
        `${getStyleName(ctx.primaryStyleId)} + ${getStyleName(ctx.secondaryStyleId)}`,
        hasDomination && hasPrecision ? 'positive' : undefined
      );
      addEvidence(
        'Kills + assists',
        ctx.takedowns,
        takedownsMet ? 'positive' : 'negative'
      );
      addEvidence('Required K+A', '≥ 25');
      const issues: string[] = [];
      if (!hasDomination || !hasPrecision) {
        issues.push('Requires both Domination and Precision rune trees.');
      }
      if (!takedownsMet) {
        issues.push(`Needs 25 kills + assists (current ${ctx.takedowns}).`);
      }
      if (issues.length > 0) {
        status = 'not_met';
        note = issues.join(' ');
      } else {
        status = 'manual';
        note =
          'Stats met. Manually verify orange items (Trinity Force, Hextech Rocketbelt, etc.).';
      }
      break;
    }
    case 'Yellow Cat': {
      const vpm = ctx.visionPerMinute;
      const vpmMet = vpm >= 1;
      addEvidence(
        'Vision per minute',
        formatRate(vpm, 2),
        vpmMet ? 'positive' : 'negative'
      );
      addEvidence('Vision score', ctx.visionScore);
      addEvidence('Required vision/min', '≥ 1.00');
      if (vpmMet) {
        status = 'manual';
        note =
          "Vision met. Manually verify yellow items (Control Wards, Youmuu's, etc.).";
      } else {
        status = 'not_met';
        note = `Needs at least 1.00 vision score per minute (current ${formatRate(vpm, 2)}).`;
      }
      break;
    }
    case 'Green Cat': {
      const healingMet = ctx.healing >= 7000;
      addEvidence(
        'Allied healing',
        formatNumber(ctx.healing),
        healingMet ? 'positive' : 'negative'
      );
      addEvidence('Required healing', '≥ 7,000');
      if (healingMet) {
        status = 'manual';
        note =
          'Healing met. Manually verify green items (Moonstone, Redemption, etc.).';
      } else {
        status = 'not_met';
        note = `Needs 7,000 healing on allies (current ${formatNumber(ctx.healing)}).`;
      }
      break;
    }
    case 'Blue Cat': {
      const ccMet = ctx.ccScore >= 20;
      addEvidence('CC score', ctx.ccScore, ccMet ? 'positive' : 'negative');
      addEvidence('Required CC score', '≥ 20');
      if (ccMet) {
        status = 'manual';
        note =
          'CC score met. Manually verify blue items (Frozen Heart, Evenshroud, etc.).';
      } else {
        status = 'not_met';
        note = `Needs 20 crowd control score (current ${formatNumber(ctx.ccScore)}).`;
      }
      break;
    }
    case 'Purple Cat': {
      const hasDomination =
        ctx.primaryStyleId === 8100 || ctx.secondaryStyleId === 8100;
      const hasSorcery =
        ctx.primaryStyleId === 8200 || ctx.secondaryStyleId === 8200;
      const killsMet = ctx.kills >= 5;
      addEvidence(
        'Rune paths',
        `${getStyleName(ctx.primaryStyleId)} + ${getStyleName(ctx.secondaryStyleId)}`,
        hasDomination && hasSorcery ? 'positive' : 'negative'
      );
      addEvidence('Kills', ctx.kills, killsMet ? 'positive' : 'negative');
      addEvidence('Required kills', '≥ 5');
      const issues: string[] = [];
      if (!hasDomination || !hasSorcery) {
        issues.push('Requires both Domination and Sorcery rune trees.');
      }
      if (!killsMet) {
        issues.push(`Needs 5 kills (current ${ctx.kills}).`);
      }
      if (issues.length > 0) {
        status = 'not_met';
        note = issues.join(' ');
      } else {
        status = 'manual';
        note =
          "Stats met. Manually verify purple items (Prowler's Claw, Night Harvester, etc.).";
      }
      break;
    }
    case 'Soul Healer Yuumi': {
      const heals = ctx.healing;
      addEvidence(
        'Ally healing',
        heals,
        ctx.isArena && heals >= 50000 ? 'positive' : undefined
      );
      addEvidence('Required', '≥ 50,000');
      addEvidence('Mode', ctx.gameMode ?? 'Unknown');
      if (!ctx.isArena) {
        status = 'not_met';
        note = 'Challenge only available in ARENA.';
      } else {
        status = heals >= 50000 ? 'achieved' : 'not_met';
        if (status === 'not_met') {
          note = `Needed 50,000 healing, reached ${formatNumber(heals)}.`;
        }
      }
      break;
    }
    case 'Soul Fighter Yuumi': {
      const damage = ctx.totalDamage;
      addEvidence(
        'Damage dealt',
        damage,
        ctx.isArena && damage >= 50000 ? 'positive' : undefined
      );
      addEvidence('Required', '≥ 50,000');
      addEvidence('Mode', ctx.gameMode ?? 'Unknown');
      if (!ctx.isArena) {
        status = 'not_met';
        note = 'Challenge only available in ARENA.';
      } else {
        status = damage >= 50000 ? 'achieved' : 'not_met';
        if (status === 'not_met') {
          note = `Needed 50,000 damage, reached ${formatNumber(damage)}.`;
        }
      }
      break;
    }
    case 'Yuumi Top Diff': {
      const enemyTop = ctx.enemyByRole('TOP');
      const ourScore = ctx.killScore;
      if (!enemyTop) {
        status = 'manual';
        note = 'Enemy top laner not identified.';
      } else {
        const enemyScore =
          (enemyTop.kills ?? 0) +
          (enemyTop.assists ?? 0) -
          (enemyTop.deaths ?? 0);
        const diff = ourScore - enemyScore;
        addEvidence('Your K+A-D', ourScore, diff > 0 ? 'positive' : undefined);
        addEvidence('Enemy top K+A-D', enemyScore);
        addEvidence(
          'Difference',
          diff >= 0 ? `+${diff}` : diff.toString(),
          diff > 0 ? 'positive' : diff < 0 ? 'negative' : undefined
        );
        status = diff > 0 ? 'achieved' : 'not_met';
        if (status === 'not_met') {
          note = 'Needed to outperform enemy top in K+A-D.';
        }
      }
      break;
    }
    case 'Jungle Cat': {
      addEvidence('Role', ctx.teamPosition ?? 'Unknown');
      addEvidence(
        'Dragon kills',
        ctx.dragonKills,
        ctx.dragonKills >= 2 ? 'positive' : undefined
      );
      if (!ROLE_ALIASES.JUNGLE.includes(ctx.teamPosition ?? '')) {
        status = 'not_met';
        note = 'Requires playing jungle position.';
      } else {
        status = ctx.dragonKills >= 2 ? 'achieved' : 'not_met';
        if (status === 'not_met') {
          note = 'Need at least two dragon takedowns.';
        }
      }
      break;
    }
    case 'CATaclysm': {
      addEvidence('Mode', ctx.gameMode ?? 'Unknown');
      status = ctx.isUltimateSpellbook ? 'manual' : 'not_met';
      note =
        "Tracked stats for Cho'Gath stacks are unavailable; verify manually if played in Ultimate Spellbook.";
      break;
    }
    case 'TFT Yuumi Carry': {
      addEvidence('Mode', ctx.gameMode ?? 'Unknown');
      status = ctx.isTft ? 'manual' : 'not_met';
      note =
        'Requires TFT-specific tracking; confirm carry performance manually.';
      break;
    }
    case 'Little Pakiti': {
      status = 'manual';
      note =
        'Practice tool timing is not tracked; record jungle clear manually.';
      break;
    }
    case "Bopped 'em All": {
      const pentas = ctx.participant.pentaKills ?? 0;
      addEvidence('Penta kills', pentas, pentas > 0 ? 'positive' : undefined);
      status = pentas > 0 ? 'achieved' : 'not_met';
      if (status === 'not_met') {
        note = 'Requires a Yuumi pentakill.';
      }
      break;
    }
    case 'Claws Out': {
      const damage = ctx.totalDamage;
      const physicalShare = percent(ctx.physicalDamage, damage);
      const nonSupport =
        ctx.teamPosition !== 'UTILITY' && ctx.teamPosition !== 'SUPPORT';
      const adLean = ctx.physicalDamage >= ctx.magicDamage;
      addEvidence(
        'Damage to champions',
        damage,
        damage >= 10000 ? 'positive' : undefined
      );
      addEvidence('Physical share', `${formatRate(physicalShare, 1)}%`);
      addEvidence('Role', ctx.teamPosition ?? 'Unknown');

      if (!nonSupport) {
        status = adLean && damage >= 10000 ? 'manual' : 'not_met';
        note =
          'Challenge requires leaving the support role; confirm lane swap manually.';
      } else if (damage >= 10000 && adLean) {
        status = 'achieved';
      } else if (damage >= 10000) {
        status = 'likely';
        note = 'Damage threshold met; verify full AD itemization manually.';
      } else {
        status = 'not_met';
        note = 'Needs 10,000 damage as full AD Yuumi.';
      }
      break;
    }
    case 'Post Scratched': {
      const towerDamage = ctx.turretDamage;
      addEvidence(
        'Tower damage',
        towerDamage,
        towerDamage >= 5000 ? 'positive' : undefined
      );
      addEvidence('Required', '≥ 5,000');
      status = towerDamage >= 5000 ? 'achieved' : 'not_met';
      if (status === 'not_met') {
        note = 'Needs 5,000 tower damage in a single game.';
      }
      break;
    }
    case 'Rainbow Yuumi': {
      status = 'manual';
      note =
        'Requires completing every color challenge; evaluate item/rune combinations manually.';
      break;
    }
    case 'Yuumi of All Trades': {
      status = 'manual';
      note =
        'Needs wins across every challenge role; requires account history.';
      break;
    }
    case 'Zoomies 2': {
      const shields = ctx.shielding;
      addEvidence(
        'Shielding',
        shields,
        shields >= 7000 ? 'positive' : undefined
      );
      addEvidence('Required', '≥ 7,000');
      status = shields >= 7000 ? 'achieved' : 'not_met';
      if (status === 'not_met') {
        note = 'Reached less than 7,000 shielding this match.';
      }
      break;
    }
    case 'Catnip Acquired': {
      const heals = ctx.healing;
      addEvidence('Healing', heals, heals >= 12000 ? 'positive' : undefined);
      addEvidence('Required', '≥ 12,000');
      status = heals >= 12000 ? 'achieved' : 'not_met';
      if (status === 'not_met') {
        note = 'Need 12,000 healing dealt to allies.';
      }
      break;
    }
    case 'Out on the Prowl': {
      const kills = ctx.kills;
      const magicShare = percent(ctx.magicDamage, ctx.totalDamage);
      addEvidence('Kills', kills, kills >= 7 ? 'positive' : undefined);
      addEvidence('Magic damage share', `${formatRate(magicShare, 1)}%`);
      if (kills >= 7 && ctx.magicDamage >= ctx.physicalDamage) {
        status = 'achieved';
      } else if (kills >= 7) {
        status = 'likely';
        note = 'Kill requirement met; confirm AP-focused build from items.';
      } else {
        status = 'not_met';
        note = 'Needs at least 7 kills with AP build.';
      }
      break;
    }
    case 'Yuumi Diff': {
      const enemySupport = ctx.enemyByRole('UTILITY');
      const ourScore = ctx.killScore;
      if (!enemySupport) {
        status = 'manual';
        note = 'Enemy support not detected.';
      } else {
        const enemyScore =
          (enemySupport.kills ?? 0) +
          (enemySupport.assists ?? 0) -
          (enemySupport.deaths ?? 0);
        const diff = ourScore - enemyScore;
        addEvidence(
          'Your K+A-D',
          ourScore,
          diff >= 10 ? 'positive' : undefined
        );
        addEvidence('Enemy support K+A-D', enemyScore);
        addEvidence(
          'Difference',
          diff >= 0 ? `+${diff}` : diff.toString(),
          diff >= 10 ? 'positive' : diff < 0 ? 'negative' : undefined
        );
        status = diff >= 10 ? 'achieved' : 'not_met';
        if (status === 'not_met') {
          note = 'Need a 10-point lead over the enemy support.';
        }
      }
      break;
    }
    case 'Brightest Light': {
      const vpm = ctx.visionPerMinute;
      addEvidence(
        'Vision per minute',
        formatRate(vpm, 2),
        vpm >= 1.75 ? 'positive' : undefined
      );
      addEvidence('Required', '≥ 1.75');
      status = vpm >= 1.75 ? 'achieved' : 'not_met';
      if (status === 'not_met') {
        note = `Reached ${formatRate(vpm, 2)} vision per minute.`;
      }
      break;
    }
    case 'Victorious Yuumi': {
      status = 'manual';
      note = 'Requires verifying a 5-game winstreak outside this match.';
      break;
    }
    case 'Cat Got Your Tongue': {
      const cc = ctx.ccScore;
      addEvidence('CC score', cc, cc >= 20 ? 'positive' : undefined);
      addEvidence('Required', '≥ 20');
      status = cc >= 20 ? 'achieved' : 'not_met';
      if (status === 'not_met') {
        note = 'Need 20 crowd control score.';
      }
      break;
    }
    case 'Top Purrcentile': {
      status = 'manual';
      note =
        'Support quest completion timing not available; confirm finish before 14:00 manually.';
      break;
    }
    case 'We Got This': {
      const rate = ctx.takedownsPerMinute;
      addEvidence(
        'Kills+Assists per minute',
        formatRate(rate, 2),
        rate >= 1.2 ? 'positive' : undefined
      );
      addEvidence('Required', '≥ 1.20');
      status = rate >= 1.2 ? 'achieved' : 'not_met';
      if (status === 'not_met') {
        note = `Reached ${formatRate(rate, 2)} K+A per minute.`;
      }
      break;
    }
    default: {
      if (!note && manualCategoryKeys.has(categoryKey)) {
        note =
          'Color challenge evaluation depends on themed item builds; verify manually.';
        status = 'manual';
      } else if (!note) {
        note = 'No automated evaluator available yet.';
      }
      break;
    }
  }

  if (manual && !note) {
    note = 'Requires manual verification.';
  }

  return {
    id: slugify(`${categoryKey}-${definition.name}`),
    name: definition.name,
    requirement: definition.requirement,
    categoryKey,
    status,
    note,
    evidence,
    manual,
    meta: {
      runes: definition.runes,
      items: definition.items,
      build: definition.build,
      gamemode: definition.gamemode,
    },
  };
};

export const evaluateYuumiChallenges = ({
  participant,
  matchData,
}: {
  participant: ExtendedMatchParticipant;
  matchData: ExtendedMatchData;
}): EvaluatedCategory[] => {
  const context = buildContext(participant, matchData);
  const previous = new Map<string, EvaluatedChallenge>();
  const grouped = new Map<CategoryKey, EvaluatedChallenge[]>();

  for (const definition of RAW_CHALLENGES) {
    const result = evaluateDefinition(definition, context, previous);
    previous.set(definition.name, result);
    const existing = grouped.get(result.categoryKey) ?? [];
    existing.push(result);
    grouped.set(result.categoryKey, existing);
  }

  return CATEGORY_ORDER.map((key) => {
    const meta = challengeData.categories[key];
    const challenges = grouped.get(key) ?? [];
    challenges.sort((a, b) => {
      const diff =
        CHALLENGE_STATUS_PRIORITY[a.status] -
        CHALLENGE_STATUS_PRIORITY[b.status];
      if (diff !== 0) {
        return diff;
      }
      return a.name.localeCompare(b.name);
    });
    const stats = {
      total: challenges.length,
      achieved: challenges.filter((item) => item.status === 'achieved').length,
      likely: challenges.filter((item) => item.status === 'likely').length,
      manual: challenges.filter((item) => item.manual).length,
    };
    return {
      key,
      name: meta?.name ?? key,
      description: meta?.description ?? '',
      active: true,
      stats,
      challenges,
    };
  });
};
