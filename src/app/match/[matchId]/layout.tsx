import { Metadata } from 'next';
import { headers } from 'next/headers';

function resolveBaseUrl(headersList: Headers): string {
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

    const data = await response.json();
    const matchData = data.matchData;

    if (!matchData) {
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

    // Extract key match information
    const gameDuration = Math.floor(matchData.info.gameDuration / 60);
    const gameMode = matchData.info.gameMode;
    const blueTeam = matchData.info.participants.filter(
      (p: any) => p.teamId === 100
    );
    const redTeam = matchData.info.participants.filter(
      (p: any) => p.teamId === 200
    );
    const blueTeamData = matchData.info.teams.find(
      (t: any) => t.teamId === 100
    );

    // Calculate team KDA
    const blueKills = blueTeam.reduce(
      (sum: number, p: any) => sum + p.kills,
      0
    );
    const redKills = redTeam.reduce((sum: number, p: any) => sum + p.kills, 0);

    // Get MVP (highest KDA)
    const mvp = matchData.info.participants.reduce((best: any, player: any) => {
      const kda =
        player.deaths === 0
          ? player.kills + player.assists
          : (player.kills + player.assists) / player.deaths;
      const bestKda =
        best.deaths === 0
          ? best.kills + best.assists
          : (best.kills + best.assists) / best.deaths;
      return kda > bestKda ? player : best;
    });

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
