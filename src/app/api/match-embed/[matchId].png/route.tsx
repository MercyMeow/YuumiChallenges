import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import { serverSideImageManager } from '@/lib/server-side-images';

export const runtime = 'edge';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const resolvedParams = await params;
    const matchIdWithExt = resolvedParams.matchId;
    const matchId = matchIdWithExt.replace('.png', '');

    // Fetch match data
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/match-details/${matchId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch match data');
    }

    const data = await response.json();
    const matchData = data.matchData;

    if (!matchData) {
      throw new Error('No match data found');
    }

    // Extract match information
    const gameDuration = Math.floor(matchData.info.gameDuration / 60);
    const blueTeam = matchData.info.participants.filter(
      (p: any) => p.teamId === 100
    );
    const redTeam = matchData.info.participants.filter(
      (p: any) => p.teamId === 200
    );
    const blueTeamData = matchData.info.teams.find(
      (t: any) => t.teamId === 100
    );

    // Calculate team stats
    const blueKills = blueTeam.reduce(
      (sum: number, p: any) => sum + p.kills,
      0
    );
    const blueDeaths = blueTeam.reduce(
      (sum: number, p: any) => sum + p.deaths,
      0
    );
    const blueAssists = blueTeam.reduce(
      (sum: number, p: any) => sum + p.assists,
      0
    );

    const redKills = redTeam.reduce((sum: number, p: any) => sum + p.kills, 0);
    const redDeaths = redTeam.reduce(
      (sum: number, p: any) => sum + p.deaths,
      0
    );
    const redAssists = redTeam.reduce(
      (sum: number, p: any) => sum + p.assists,
      0
    );

    // Get MVP
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

    const winner = blueTeamData?.win ? 'BLUE' : 'RED';
    const winnerColor = blueTeamData?.win ? '#3B82F6' : '#EF4444';

    // Prepare MVP fields for preview card
    const cs = (mvp.totalMinionsKilled || 0) + (mvp.neutralMinionsKilled || 0);
    const gold = mvp.goldEarned || 0;

    // Items: pick top 3 from item0..item5 (exclude trinket item6 and 0)
    const allItems = [
      mvp.item0,
      mvp.item1,
      mvp.item2,
      mvp.item3,
      mvp.item4,
      mvp.item5,
    ].filter((i: number) => i && i > 0);
    const previewItems = allItems.slice(0, 3);

    // Fetch DataDragon images for enhanced visual appeal
    const championIconUrl = await serverSideImageManager.getChampionIcon(mvp.championName);
    const itemIconUrls = await serverSideImageManager.getMultipleItemIcons(previewItems);

    // Helper to render rounded pill
    const Pill = ({
      children,
      bg = 'rgba(255,255,255,0.06)',
      color = '#E5E7EB',
    }: any) => (
      <div
        style={{
          padding: '6px 12px',
          borderRadius: 999,
          background: bg,
          color,
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {children}
      </div>
    );

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            backgroundColor: '#0B0B10',
            backgroundImage:
              'linear-gradient(180deg, rgba(16,16,28,1) 0%, rgba(11,11,16,1) 100%)',
            color: '#E5E7EB',
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto',
          }}
        >
          {/* Left panel: Champion tile with gradient */}
          <div
            style={{
              width: 380,
              height: '100%',
              background:
                'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(168,85,247,0.2))',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 28,
                left: 28,
                padding: '6px 12px',
                borderRadius: 8,
                background: winnerColor,
                color: '#fff',
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 0.4,
              }}
            >
              {winner} WIN
            </div>
            
            {/* Champion Icon */}
            <div
              style={{
                position: 'absolute',
                top: 80,
                left: 40,
                width: 120,
                height: 120,
                borderRadius: 16,
                overflow: 'hidden',
                border: '3px solid rgba(255,255,255,0.25)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <img 
                src={championIconUrl}
                alt={`${mvp.championName} champion icon`}
                width={120}
                height={120}
                style={{ objectFit: 'cover' }}
              />
            </div>
            
            <div
              style={{
                fontSize: 110,
                fontWeight: 900,
                lineHeight: 1.0,
                letterSpacing: -2,
                color: 'rgba(255,255,255,0.12)',
                textAlign: 'center',
                textTransform: 'uppercase',
              }}
            >
              {mvp.championName}
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 28,
                right: 28,
                padding: '6px 10px',
                borderRadius: 6,
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: 16,
                color: '#E5E7EB',
              }}
            >
              Lv {mvp.champLevel ?? 18}
            </div>
          </div>

          {/* Right panel: Stats */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: 40,
              gap: 20,
            }}
          >
            {/* Header brand + queue/duration */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  background: 'linear-gradient(90deg, #A855F7, #3B82F6)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Yuumi Challenges
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Pill>{matchData.info.gameMode}</Pill>
                <Pill>{gameDuration}m</Pill>
                <Pill>Match #{matchId}</Pill>
              </div>
            </div>

            {/* Summoner + rank emblem area */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 30, fontWeight: 800 }}>
                {(mvp.riotIdGameName || mvp.summonerName) as string}
              </div>
              <div style={{ fontSize: 16, color: '#9CA3AF' }}>
                {mvp.riotIdTagline ? `#${mvp.riotIdTagline}` : ''}
              </div>
              {/* Rank emblem placeholder: we don't have rank in match data. Show 'Unranked' emblem */}
              <div
                style={{
                  marginLeft: 12,
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#D1D5DB',
                  fontSize: 14,
                }}
              >
                Unranked
              </div>
            </div>

            {/* KDA / CS / Gold row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#F3F4F6' }}>
                {mvp.kills}/{mvp.deaths}/{mvp.assists}
              </div>
              <Pill bg="rgba(59,130,246,0.12)" color="#BFDBFE">
                CS {cs}
              </Pill>
              <Pill bg="rgba(234,179,8,0.12)" color="#FDE68A">
                {gold.toLocaleString()} gold
              </Pill>
              <Pill bg="rgba(107,114,128,0.18)" color="#D1D5DB">
                Team{' '}
                {blueTeamData?.win
                  ? `${blueKills}/${blueDeaths}/${blueAssists}`
                  : `${redKills}/${redDeaths}/${redAssists}`}{' '}
                K/D/A
              </Pill>
            </div>

            {/* Divider */}
            <div
              style={{
                height: 1,
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                margin: '6px 0 2px 0',
              }}
            />

            {/* Items row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 16, color: '#9CA3AF', width: 80 }}>
                Items
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {itemIconUrls.length > 0 ? (
                  itemIconUrls.map((url: string, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      <img 
                        src={url}
                        alt={`Item ${idx + 1}`}
                        width={48}
                        height={48}
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#6B7280' }}>No items</div>
                )}
              </div>
            </div>

            {/* Team score compact */}
            <div
              style={{
                marginTop: 'auto',
                display: 'flex',
                gap: 18,
                alignItems: 'center',
                color: '#9CA3AF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div
                  style={{ fontSize: 26, fontWeight: 800, color: '#3B82F6' }}
                >
                  {blueKills}
                </div>
                <div style={{ fontSize: 14 }}>Blue</div>
              </div>
              <div style={{ opacity: 0.5 }}>vs</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div
                  style={{ fontSize: 26, fontWeight: 800, color: '#EF4444' }}
                >
                  {redKills}
                </div>
                <div style={{ fontSize: 14 }}>Red</div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating embed image:', error);

    // Return a fallback image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            backgroundImage:
              'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          }}
        >
          <div
            style={{
              fontSize: 60,
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #a855f7, #3b82f6)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Yuumi Challenges
          </div>
          <div style={{ fontSize: 24, color: '#9CA3AF', marginTop: 20 }}>
            Match Details
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
