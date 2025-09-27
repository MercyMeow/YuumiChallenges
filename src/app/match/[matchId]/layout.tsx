import { Metadata } from 'next';
import { headers } from 'next/headers';
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

type MatchDetailsErrorPayload = {
  success?: false;
  error?: string;
};

type MatchDetailsApiResponse =
  | MatchDetailsSuccessPayload
  | MatchDetailsErrorPayload
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

type HeaderGetter = {
  get(name: string): string | null;
};

function resolveBaseUrl(headersList: HeaderGetter): string {
  // Primary: explicit production domain
  const envBase = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envBase) return envBase.replace(/\/+$/, '');

  // Fallback: derive from request headers
  const host =
    headersList.get('x-forwarded-host') ||
    headersList.get('host') ||
    'localhost:3000';
  const protoHeader = headersList.get('x-forwarded-proto');
  const protocol =
    protoHeader ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  return `${protocol}://${host}`.replace(/\/+$/, '');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ matchId: string }>;
}): Promise<Metadata> {
  const { matchId } = await params;

  try {
    const headersList = await headers();

    // Use provided production domain "yuumi.quest" as primary base via env,
    // otherwise resolve from headers. This guarantees absolute og:image.
    const configuredBase =
      process.env.NEXT_PUBLIC_APP_URL &&
      process.env.NEXT_PUBLIC_APP_URL.length > 0
        ? process.env.NEXT_PUBLIC_APP_URL
        : 'https://yuumi.quest';
    const baseUrl = configuredBase || resolveBaseUrl(headersList);

    // Fetch match data for metadata
    const response = await fetch(`${baseUrl}/api/match-details/${matchId}`, {
      // Ensure always dynamic for crawlers
      cache: 'no-store',
      headers: {
        'User-Agent': 'YuumiChallenges-OG/1.0',
      },
    });

    if (!response.ok) {
      return {
        title: 'Match Details - Yuumi Challenges',
        description: 'View detailed League of Legends match statistics',
        openGraph: {
          images: [
            {
              url: `${baseUrl}/api/test-embed`,
              width: 1200,
              height: 630,
              alt: 'Embed Preview',
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          images: [`${baseUrl}/api/test-embed`],
        },
      };
    }

    const data = (await response.json()) as MatchDetailsApiResponse;
    if (!isMatchDetailsSuccess(data)) {
      return {
        title: 'Match Details - Yuumi Challenges',
        description: 'View detailed League of Legends match statistics',
        openGraph: {
          images: [
            {
              url: `${baseUrl}/api/test-embed`,
              width: 1200,
              height: 630,
              alt: 'Embed Preview',
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          images: [`${baseUrl}/api/test-embed`],
        },
      };
    }

    const matchData = data.matchData;

    // Extract key match information
    const gameDuration = Math.floor(matchData.info.gameDuration / 60);
    const gameMode = matchData.info.gameMode;
    const participants = matchData.info
      .participants as DetailedMatchParticipant[];
    if (participants.length === 0) {
      return {
        title: 'Match Details - Yuumi Challenges',
        description: 'View detailed League of Legends match statistics',
      };
    }
    const blueTeam = participants.filter((p) => p.teamId === 100);
    const redTeam = participants.filter((p) => p.teamId === 200);
    const blueTeamData = matchData.info.teams.find(
      (team: DetailedMatchTeam) => team.teamId === 100
    );

    // Calculate team KDA
    const blueKills = blueTeam.reduce((sum, player) => sum + player.kills, 0);
    const redKills = redTeam.reduce((sum, player) => sum + player.kills, 0);

    // Get MVP (highest KDA)
    const firstParticipant = participants[0]!;
    const remainingParticipants = participants.slice(1);
    const mvp = remainingParticipants.reduce<DetailedMatchParticipant>(
      (best, player) => {
        const kda =
          player.deaths === 0
            ? player.kills + player.assists
            : (player.kills + player.assists) / player.deaths;
        const bestKda =
          best.deaths === 0
            ? best.kills + best.assists
            : (best.kills + best.assists) / best.deaths;
        return kda > bestKda ? player : best;
      },
      firstParticipant
    );

    const winner = blueTeamData?.win ? 'Blue Team' : 'Red Team';
    const winnerColor = blueTeamData?.win ? '🔵' : '🔴';

    // Build description
    const title = `${winnerColor} ${winner} Victory | ${gameMode} - ${gameDuration}m`;
    const description = `Score: ${blueKills} - ${redKills} | MVP: ${mvp.riotIdGameName || mvp.summonerName} (${mvp.championName}) ${mvp.kills}/${mvp.deaths}/${mvp.assists} | View comprehensive stats, timeline, and player comparisons`;

    // Generate embed image URL using main endpoint with rich features
    const embedImageUrl = `${baseUrl}/api/match-embed/${matchId}.png`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        siteName: 'Yuumi Challenges',
        images: [
          {
            url: embedImageUrl,
            width: 1200,
            height: 630,
            alt: `Match ${matchId} - ${winner} Victory`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [embedImageUrl],
        site: '@YuumiChallenges',
      },
      other: {
        'discord:color': blueTeamData?.win ? '#3B82F6' : '#EF4444',
        'theme-color': blueTeamData?.win ? '#3B82F6' : '#EF4444',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    // Safe static fallback with absolute test image
    const fallbackBase =
      process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://yuumi.quest';
    return {
      title: 'Match Details - Yuumi Challenges',
      description: 'View detailed League of Legends match statistics',
      openGraph: {
        images: [
          {
            url: `${fallbackBase}/api/test-embed`,
            width: 1200,
            height: 630,
            alt: 'Embed Preview',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        images: [`${fallbackBase}/api/test-embed`],
      },
    };
  }
}

export default function MatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
