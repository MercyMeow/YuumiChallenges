import { Metadata } from 'next';
import { headers } from 'next/headers';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ matchId: string }> 
}): Promise<Metadata> {
  const { matchId } = await params;
  
  try {
    // Fetch match data for metadata
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    
    const response = await fetch(`${baseUrl}/api/match-details/${matchId}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return {
        title: 'Match Details - Yuumi Challenges',
        description: 'View detailed League of Legends match statistics',
      };
    }
    
    const data = await response.json();
    const matchData = data.matchData;
    
    if (!matchData) {
      return {
        title: 'Match Details - Yuumi Challenges',
        description: 'View detailed League of Legends match statistics',
      };
    }
    
    // Extract key match information
    const gameDuration = Math.floor(matchData.info.gameDuration / 60);
    const gameMode = matchData.info.gameMode;
    const blueTeam = matchData.info.participants.filter((p: any) => p.teamId === 100);
    const redTeam = matchData.info.participants.filter((p: any) => p.teamId === 200);
    const blueTeamData = matchData.info.teams.find((t: any) => t.teamId === 100);
    
    // Calculate team KDA
    const blueKills = blueTeam.reduce((sum: number, p: any) => sum + p.kills, 0);
    const redKills = redTeam.reduce((sum: number, p: any) => sum + p.kills, 0);
    
    // Get MVP (highest KDA)
    const mvp = matchData.info.participants.reduce((best: any, player: any) => {
      const kda = player.deaths === 0 
        ? player.kills + player.assists 
        : (player.kills + player.assists) / player.deaths;
      const bestKda = best.deaths === 0 
        ? best.kills + best.assists 
        : (best.kills + best.assists) / best.deaths;
      return kda > bestKda ? player : best;
    });
    
    const winner = blueTeamData?.win ? 'Blue Team' : 'Red Team';
    const winnerColor = blueTeamData?.win ? '🔵' : '🔴';
    
    // Build description
    const title = `${winnerColor} ${winner} Victory | ${gameMode} - ${gameDuration}m`;
    const description = `Score: ${blueKills} - ${redKills} | MVP: ${mvp.riotIdGameName || mvp.summonerName} (${mvp.championName}) ${mvp.kills}/${mvp.deaths}/${mvp.assists} | View comprehensive stats, timeline, and player comparisons`;
    
    // Generate embed image URL using working endpoint that avoids Turbopack issues
    const embedImageUrl = `${baseUrl}/api/match-embed-working/${matchId}.png`;
    
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
          }
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
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Match Details - Yuumi Challenges',
      description: 'View detailed League of Legends match statistics',
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