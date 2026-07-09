import { Metadata } from 'next';
import { headers } from 'next/headers';
import { fetchMatchSummary, resolveBaseUrl } from './match-summary';

// og:image / twitter:image come from the opengraph-image.tsx and
// twitter-image.tsx file conventions in this segment — do not add image
// URLs here (a previous hardcoded /api/match-embed URL 404'd and broke
// Discord embeds entirely).
// openGraph/twitter are set explicitly so error paths don't inherit the
// parent layout's guide-wide social text on match URLs.
const FALLBACK_TITLE = 'Match Details - Yuumi Challenges';
const FALLBACK_DESCRIPTION = 'View detailed League of Legends match statistics';
const FALLBACK_METADATA: Metadata = {
  title: FALLBACK_TITLE,
  description: FALLBACK_DESCRIPTION,
  openGraph: {
    title: FALLBACK_TITLE,
    description: FALLBACK_DESCRIPTION,
    type: 'website',
    siteName: 'Yuumi Challenges',
  },
  twitter: {
    card: 'summary_large_image',
    title: FALLBACK_TITLE,
    description: FALLBACK_DESCRIPTION,
    site: '@YuumiChallenges',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ matchId: string }>;
}): Promise<Metadata> {
  const { matchId } = await params;

  try {
    const headersList = await headers();
    const baseUrl = resolveBaseUrl(headersList);
    const summary = await fetchMatchSummary(matchId, baseUrl);
    if (!summary) return FALLBACK_METADATA;

    const winner = summary.blueWin ? 'Blue Team' : 'Red Team';
    const winnerColor = summary.blueWin ? '🔵' : '🔴';
    const title = `${winnerColor} ${winner} Victory | ${summary.gameMode} - ${summary.gameDurationMin}m`;
    const description = `Score: ${summary.blueKills} - ${summary.redKills} | MVP: ${summary.mvp.name} (${summary.mvp.champion}) ${summary.mvp.kills}/${summary.mvp.deaths}/${summary.mvp.assists} | View comprehensive stats, timeline, and player comparisons`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        siteName: 'Yuumi Challenges',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        site: '@YuumiChallenges',
      },
      other: {
        'discord:color': summary.blueWin ? '#3B82F6' : '#EF4444',
        'theme-color': summary.blueWin ? '#3B82F6' : '#EF4444',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return FALLBACK_METADATA;
  }
}

export default function MatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
