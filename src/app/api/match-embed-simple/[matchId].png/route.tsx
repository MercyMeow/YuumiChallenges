import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const resolvedParams = await params;
    const matchIdWithExt = resolvedParams.matchId;
    const matchId = matchIdWithExt.replace('.png', '');

    // Fetch match data with timeout handling
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    let response;
    try {
      response = await fetch(`${baseUrl}/api/match-details/${matchId}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      clearTimeout(timeoutId);
      console.log('Fetch error:', error);
      // Return fallback image immediately on fetch failure
      return generateFallbackImage(matchId);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      console.log('Response not ok:', response.status);
      return generateFallbackImage(matchId);
    }

    const data = await response.json();
    const matchData = data.matchData;

    if (!matchData) {
      console.log('No match data found');
      return generateFallbackImage(matchId);
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
    const redKills = redTeam.reduce((sum: number, p: any) => sum + p.kills, 0);

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
      
      if (kda === bestKda) {
        return player.win ? player : best;
      }
      return kda > bestKda ? player : best;
    });

    const winner = blueTeamData?.win ? 'BLUE' : 'RED';
    const winnerColor = blueTeamData?.win ? '#3B82F6' : '#EF4444';
    
    // Calculate MVP stats
    const mvpTeamKills = mvp.teamId === 100 ? blueKills : redKills;
    const killParticipation = mvpTeamKills > 0 
      ? Math.round(((mvp.kills + mvp.assists) / mvpTeamKills) * 100)
      : 0;
    
    const kdaRatio = mvp.deaths === 0 
      ? 'Perfect' 
      : ((mvp.kills + mvp.assists) / mvp.deaths).toFixed(2);

    const cs = (mvp.totalMinionsKilled || 0) + (mvp.neutralMinionsKilled || 0);
    const csPerMin = gameDuration > 0 ? (cs / gameDuration).toFixed(1) : '0';

    // Use direct DataDragon URLs
    const championIconUrl = `https://ddragon.leagueoflegends.com/cdn/14.23.1/img/champion/${mvp.championName}.png`;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            backgroundColor: '#0a0a0a',
            backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            color: '#E5E7EB',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Left panel: Champion showcase */}
          <div
            style={{
              width: 400,
              height: '100%',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(147,51,234,0.2) 100%)',
              borderRight: '2px solid rgba(59,130,246,0.5)',
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
                top: 32,
                left: 32,
                padding: '8px 16px',
                borderRadius: 8,
                background: winnerColor,
                color: '#fff',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {winner} VICTORY
            </div>
            
            {/* Champion Icon */}
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 16,
                overflow: 'hidden',
                border: '3px solid rgba(59,130,246,0.7)',
                marginBottom: 20,
              }}
            >
              <img 
                src={championIconUrl}
                alt={mvp.championName}
                width={120}
                height={120}
                style={{ objectFit: 'cover' }}
              />
            </div>
            
            {/* Champion name */}
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: '#fff',
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              {mvp.championName}
            </div>
            
            {/* KDA */}
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: '#fff',
                marginBottom: 8,
              }}
            >
              {mvp.kills}/{mvp.deaths}/{mvp.assists}
            </div>
            
            <div
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                background: kdaRatio === 'Perfect' 
                  ? '#059669'
                  : parseFloat(kdaRatio) >= 3
                  ? '#3B82F6'
                  : '#6B7280',
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {kdaRatio} KDA
            </div>
          </div>

          {/* Right panel: Stats */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '32px',
              gap: 20,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 16,
                borderBottom: '1px solid rgba(59,130,246,0.3)',
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  background: 'linear-gradient(45deg, #A855F7, #3B82F6)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Yuumi Challenges
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: '#9CA3AF',
                }}
              >
                {gameDuration}m • {matchData.info.gameMode}
              </div>
            </div>

            {/* Summoner info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: mvp.teamId === 100 ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.3)',
                  color: mvp.teamId === 100 ? '#93C5FD' : '#FCA5A5',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {mvp.teamId === 100 ? 'BLUE' : 'RED'}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#F3F4F6' }}>
                {mvp.riotIdGameName || mvp.summonerName}
              </div>
            </div>

            {/* Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 16,
              }}
            >
              <div
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                }}
              >
                <div style={{ fontSize: 14, color: '#FCA5A5', marginBottom: 4 }}>
                  DAMAGE
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
                  {(mvp.totalDamageDealtToChampions || 0).toLocaleString()}
                </div>
              </div>
              
              <div
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: 'rgba(234,179,8,0.15)',
                  border: '1px solid rgba(234,179,8,0.3)',
                }}
              >
                <div style={{ fontSize: 14, color: '#FDE68A', marginBottom: 4 }}>
                  GOLD & CS
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
                  {(mvp.goldEarned || 0).toLocaleString()}g
                </div>
                <div style={{ fontSize: 14, color: '#FCD34D' }}>
                  {cs} CS ({csPerMin}/min)
                </div>
              </div>
              
              <div
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: 'rgba(168,85,247,0.15)',
                  border: '1px solid rgba(168,85,247,0.3)',
                }}
              >
                <div style={{ fontSize: 14, color: '#E9D5FF', marginBottom: 4 }}>
                  KP & VISION
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
                  {killParticipation}%
                </div>
                <div style={{ fontSize: 14, color: '#C084FC' }}>
                  Vision: {mvp.visionScore || 0}
                </div>
              </div>
              
              <div
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.3)',
                }}
              >
                <div style={{ fontSize: 14, color: '#A7F3D0', marginBottom: 4 }}>
                  LEVEL
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
                  {mvp.champLevel || 18}
                </div>
              </div>
            </div>

            {/* Team Score */}
            <div
              style={{
                marginTop: 'auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 16,
                borderTop: '1px solid rgba(59,130,246,0.3)',
              }}
            >
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'rgba(59,130,246,0.2)',
                  }}
                >
                  <span style={{ color: '#93C5FD', fontSize: 14 }}>BLUE</span>
                  <span style={{ color: '#3B82F6', fontSize: 24, fontWeight: 800 }}>
                    {blueKills}
                  </span>
                </div>
                
                <span style={{ color: '#6B7280', fontSize: 16 }}>VS</span>
                
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'rgba(239,68,68,0.2)',
                  }}
                >
                  <span style={{ color: '#EF4444', fontSize: 24, fontWeight: 800 }}>
                    {redKills}
                  </span>
                  <span style={{ color: '#FCA5A5', fontSize: 14 }}>RED</span>
                </div>
              </div>
              
              <div
                style={{
                  fontSize: 12,
                  color: '#6B7280',
                  padding: '4px 8px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 4,
                }}
              >
                #{matchId}
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
    return generateFallbackImage('unknown');
  }
}

function generateFallbackImage(matchId: string) {
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
          backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #a855f7, #3b82f6)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: 20,
          }}
        >
          Yuumi Challenges
        </div>
        <div style={{ fontSize: 24, color: '#9CA3AF', marginBottom: 10 }}>
          Match Details
        </div>
        <div style={{ fontSize: 16, color: '#6B7280' }}>
          Match #{matchId}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}