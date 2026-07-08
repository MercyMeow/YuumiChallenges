import {
  DetailedMatchData,
  DetailedMatchParticipant,
  DetailedMatchTeam,
} from '@/lib/types';

type MatchDetailsSuccessPayload = {
  success: true;
  matchData: DetailedMatchData;
  timelineData: unknown;
  matchId: string;
  cached?: boolean;
  example?: boolean;
};

type MatchDetailsApiResponse =
  | MatchDetailsSuccessPayload
  | { success?: false; error?: string }
  | Record<string, unknown>;

const isMatchDetailsSuccess = (
  payload: MatchDetailsApiResponse
): payload is MatchDetailsSuccessPayload => {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'success' in payload &&
    payload.success === true &&
    'matchData' in payload
  );
};

export type HeaderGetter = {
  get(name: string): string | null;
};

/**
 * Absolute base URL for self-fetching the match-details API: explicit env,
 * then request headers, then the production domain (og:image URLs must be
 * absolute for crawlers).
 */
export function resolveBaseUrl(headersList?: HeaderGetter): string {
  const envBase = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envBase) return envBase.replace(/\/+$/, '');

  const host = headersList?.get('x-forwarded-host') || headersList?.get('host');
  if (host) {
    const protoHeader = headersList?.get('x-forwarded-proto');
    const protocol =
      protoHeader ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    return `${protocol}://${host}`.replace(/\/+$/, '');
  }

  return process.env.NODE_ENV === 'production'
    ? 'https://yuumi.quest'
    : 'http://localhost:3000';
}

export type MatchSummary = {
  matchId: string;
  gameMode: string;
  gameDurationMin: number;
  blueWin: boolean;
  blueKills: number;
  redKills: number;
  blueChampions: string[];
  redChampions: string[];
  mvp: {
    name: string;
    champion: string;
    kills: number;
    deaths: number;
    assists: number;
    kdaLabel: string;
  };
};

/**
 * Server-side match fetch + summary for metadata and the OG card. Returns
 * null when the match can't be loaded — callers render their own fallback.
 */
export async function fetchMatchSummary(
  matchId: string,
  baseUrl: string
): Promise<MatchSummary | null> {
  const response = await fetch(`${baseUrl}/api/match-details/${matchId}`, {
    cache: 'no-store',
    headers: { 'User-Agent': 'YuumiChallenges-OG/1.0' },
  });
  if (!response.ok) return null;

  const data = (await response.json()) as MatchDetailsApiResponse;
  if (!isMatchDetailsSuccess(data)) return null;

  const matchData = data.matchData;
  const participants = matchData.info
    .participants as DetailedMatchParticipant[];
  if (participants.length === 0) return null;

  const blueTeam = participants.filter((p) => p.teamId === 100);
  const redTeam = participants.filter((p) => p.teamId === 200);
  const blueTeamData = matchData.info.teams.find(
    (team: DetailedMatchTeam) => team.teamId === 100
  );

  const blueKills = blueTeam.reduce((sum, player) => sum + player.kills, 0);
  const redKills = redTeam.reduce((sum, player) => sum + player.kills, 0);

  // MVP: highest KDA across both teams.
  const firstParticipant = participants[0]!;
  const mvp = participants
    .slice(1)
    .reduce<DetailedMatchParticipant>((best, player) => {
      const kda =
        player.deaths === 0
          ? player.kills + player.assists
          : (player.kills + player.assists) / player.deaths;
      const bestKda =
        best.deaths === 0
          ? best.kills + best.assists
          : (best.kills + best.assists) / best.deaths;
      return kda > bestKda ? player : best;
    }, firstParticipant);

  const kdaLabel =
    mvp.deaths === 0
      ? 'Perfect'
      : ((mvp.kills + mvp.assists) / mvp.deaths).toFixed(2);

  return {
    matchId,
    gameMode: matchData.info.gameMode,
    gameDurationMin: Math.floor(matchData.info.gameDuration / 60),
    blueWin: blueTeamData?.win === true,
    blueKills,
    redKills,
    blueChampions: blueTeam.map((p) => p.championName),
    redChampions: redTeam.map((p) => p.championName),
    mvp: {
      name: mvp.riotIdGameName || mvp.summonerName,
      champion: mvp.championName,
      kills: mvp.kills,
      deaths: mvp.deaths,
      assists: mvp.assists,
      kdaLabel,
    },
  };
}
