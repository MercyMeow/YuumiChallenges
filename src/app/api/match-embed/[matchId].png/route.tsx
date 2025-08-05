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
    const redKills = redTeam.reduce((sum: number, p: any) => sum + p.kills, 0);

    // Get MVP (consider win status as tiebreaker)
    const mvp = matchData.info.participants.reduce((best: any, player: any) => {
      const kda =
        player.deaths === 0
          ? player.kills + player.assists
          : (player.kills + player.assists) / player.deaths;
      const bestKda =
        best.deaths === 0
          ? best.kills + best.assists
          : (best.kills + best.assists) / best.deaths;
      
      // If KDA is equal, prefer player from winning team
      if (kda === bestKda) {
        return player.win ? player : best;
      }
      return kda > bestKda ? player : best;
    });

    const winner = blueTeamData?.win ? 'BLUE' : 'RED';
    const winnerColor = blueTeamData?.win ? '#3B82F6' : '#EF4444';
    
    // Calculate additional MVP stats
    const mvpTeamKills = mvp.teamId === 100 ? blueKills : redKills;
    const killParticipation = mvpTeamKills > 0 
      ? Math.round(((mvp.kills + mvp.assists) / mvpTeamKills) * 100)
      : 0;
    
    const mvpDamage = mvp.totalDamageDealtToChampions || 0;
    const mvpVisionScore = mvp.visionScore || 0;
    const mvpKillParticipation = `${killParticipation}%`;
    
    // Calculate team damage percentages
    const mvpTeammates = matchData.info.participants.filter(
      (p: any) => p.teamId === mvp.teamId
    );
    const totalTeamDamage = mvpTeammates.reduce(
      (sum: number, p: any) => sum + (p.totalDamageDealtToChampions || 0),
      0
    );
    const mvpDamagePercent = totalTeamDamage > 0
      ? Math.round((mvpDamage / totalTeamDamage) * 100)
      : 0;
    
    // Get KDA ratio
    const kdaRatio = mvp.deaths === 0 
      ? 'Perfect' 
      : ((mvp.kills + mvp.assists) / mvp.deaths).toFixed(2);

    // Prepare MVP fields for preview card
    const cs = (mvp.totalMinionsKilled || 0) + (mvp.neutralMinionsKilled || 0);
    const gold = mvp.goldEarned || 0;
    const csPerMin = gameDuration > 0 ? (cs / gameDuration).toFixed(1) : '0';

    // Items: get all 6 main items (exclude trinket item6 and 0)
    const allItems = [
      mvp.item0,
      mvp.item1,
      mvp.item2,
      mvp.item3,
      mvp.item4,
      mvp.item5,
    ].filter((i: number) => i && i > 0);
    
    // Get key stats for display
    const pentaKills = mvp.pentaKills || 0;
    const quadraKills = mvp.quadraKills || 0; 
    const tripleKills = mvp.tripleKills || 0;
    const doubleKills = mvp.doubleKills || 0;
    const firstBlood = mvp.firstBloodKill || false;

    // Fetch DataDragon images for enhanced visual appeal
    const championIconUrl = await serverSideImageManager.getChampionIcon(mvp.championName);
    const itemIconUrls = await serverSideImageManager.getMultipleItemIcons(allItems);

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
            backgroundColor: '#050507',
            backgroundImage:
              'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(59,130,246,0.05) 25%, rgba(34,197,94,0.03) 50%, rgba(251,146,60,0.05) 75%, rgba(239,68,68,0.08) 100%)',
            color: '#E5E7EB',
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto',
            position: 'relative',
          }}
        >
          {/* Animated particles effect overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                radial-gradient(circle at 20% 50%, rgba(168,85,247,0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 50%, rgba(59,130,246,0.15) 0%, transparent 50%),
                radial-gradient(circle at 50% 20%, rgba(251,146,60,0.1) 0%, transparent 40%)
              `,
              opacity: 0.7,
            }}
          />
          {/* Left panel: Champion showcase with enhanced gradient */}
          <div
            style={{
              width: 420,
              height: '100%',
              background:
                'linear-gradient(135deg, rgba(168,85,247,0.25) 0%, rgba(59,130,246,0.15) 100%)',
              borderRight: '2px solid rgba(168,85,247,0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 32,
                left: 32,
                padding: '8px 16px',
                borderRadius: 12,
                background: `linear-gradient(135deg, ${winnerColor}, ${winnerColor}dd)`,
                color: '#fff',
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 0.8,
                boxShadow: `0 4px 20px ${winnerColor}40`,
                textTransform: 'uppercase',
              }}
            >
              {winner} Victory
            </div>
            
            {/* Champion Icon with glow effect */}
            <div
              style={{
                position: 'absolute',
                top: 100,
                left: 50,
                width: 140,
                height: 140,
                borderRadius: 20,
                overflow: 'hidden',
                border: '3px solid rgba(168,85,247,0.5)',
                boxShadow: '0 12px 40px rgba(168,85,247,0.4), 0 0 80px rgba(168,85,247,0.2)',
              }}
            >
              <img 
                src={championIconUrl}
                alt={`${mvp.championName} champion icon`}
                width={140}
                height={140}
                style={{ objectFit: 'cover' }}
              />
            </div>
            
            {/* Champion name with gradient text */}
            <div
              style={{
                fontSize: 100,
                fontWeight: 900,
                lineHeight: 1.0,
                letterSpacing: -2,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                textAlign: 'center',
                textTransform: 'uppercase',
                marginTop: 60,
              }}
            >
              {mvp.championName}
            </div>
            
            {/* MVP Badge */}
            <div
              style={{
                position: 'absolute',
                top: 100,
                right: 40,
                padding: '6px 14px',
                borderRadius: 999,
                background: 'linear-gradient(135deg, #EAB308, #F59E0B)',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                boxShadow: '0 4px 20px rgba(234,179,8,0.4)',
              }}
            >
              MVP
            </div>
            {/* KDA Display with styling */}
            <div
              style={{
                position: 'absolute',
                bottom: 140,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 900,
                  color: '#fff',
                  textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                }}
              >
                {mvp.kills}/{mvp.deaths}/{mvp.assists}
              </div>
              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: kdaRatio === 'Perfect' 
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : parseFloat(kdaRatio) >= 5 
                    ? 'linear-gradient(135deg, #F59E0B, #EAB308)'
                    : parseFloat(kdaRatio) >= 3
                    ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                    : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {kdaRatio} KDA
              </div>
            </div>
            
            {/* Level badge */}
            <div
              style={{
                position: 'absolute',
                bottom: 32,
                right: 32,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(168,85,247,0.3)',
                fontSize: 18,
                color: '#E5E7EB',
                fontWeight: 600,
              }}
            >
              Level {mvp.champLevel ?? 18}
            </div>
          </div>

          {/* Right panel: Enhanced stats layout */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '36px 40px',
              gap: 16,
              position: 'relative',
            }}
          >
            {/* Header with enhanced branding */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 12,
                borderBottom: '1px solid rgba(168,85,247,0.2)',
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #A855F7, #3B82F6, #10B981)',
                  backgroundClip: 'text',
                  color: 'transparent',
                  letterSpacing: -0.5,
                }}
              >
                Yuumi Challenges
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Pill bg="rgba(168,85,247,0.15)" color="#E9D5FF">
                  {matchData.info.gameMode}
                </Pill>
                <Pill bg="rgba(59,130,246,0.15)" color="#BFDBFE">
                  {gameDuration}m {Math.floor(matchData.info.gameDuration % 60)}s
                </Pill>
              </div>
            </div>

            {/* Summoner info with team indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: mvp.teamId === 100 
                    ? 'rgba(59,130,246,0.2)' 
                    : 'rgba(239,68,68,0.2)',
                  border: `1px solid ${mvp.teamId === 100 ? 'rgba(59,130,246,0.4)' : 'rgba(239,68,68,0.4)'}`,
                  fontSize: 14,
                  fontWeight: 600,
                  color: mvp.teamId === 100 ? '#93C5FD' : '#FCA5A5',
                }}
              >
                {mvp.teamId === 100 ? 'BLUE' : 'RED'}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#F3F4F6' }}>
                {(mvp.riotIdGameName || mvp.summonerName) as string}
              </div>
              <div style={{ fontSize: 18, color: '#9CA3AF' }}>
                {mvp.riotIdTagline ? `#${mvp.riotIdTagline}` : ''}
              </div>
              {firstBlood && (
                <div
                  style={{
                    marginLeft: 'auto',
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))',
                    border: '1px solid rgba(239,68,68,0.4)',
                    color: '#FCA5A5',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  First Blood
                </div>
              )}
            </div>

            {/* Core Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                padding: '16px 0',
              }}
            >
              {/* Damage dealt */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ fontSize: 13, color: '#FCA5A5', fontWeight: 600 }}>
                  DAMAGE DEALT
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
                  {mvpDamage.toLocaleString()}
                </div>
                <div style={{ fontSize: 14, color: '#F87171' }}>
                  {mvpDamagePercent}% of team
                </div>
              </div>
              
              {/* CS and Gold */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(234,179,8,0.08)',
                  border: '1px solid rgba(234,179,8,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ fontSize: 13, color: '#FDE68A', fontWeight: 600 }}>
                  ECONOMY
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
                  {gold.toLocaleString()}g
                </div>
                <div style={{ fontSize: 14, color: '#FCD34D' }}>
                  {cs} CS ({csPerMin}/min)
                </div>
              </div>
              
              {/* Kill Participation */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(168,85,247,0.08)',
                  border: '1px solid rgba(168,85,247,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ fontSize: 13, color: '#E9D5FF', fontWeight: 600 }}>
                  KILL PARTICIPATION
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
                  {mvpKillParticipation}
                </div>
                <div style={{ fontSize: 14, color: '#C084FC' }}>
                  Vision: {mvpVisionScore}
                </div>
              </div>
            </div>

            {/* Multi-kill indicators */}
            {(pentaKills > 0 || quadraKills > 0 || tripleKills > 0 || doubleKills > 0) && (
              <div style={{ display: 'flex', gap: 8, margin: '4px 0' }}>
                {pentaKills > 0 && (
                  <div
                    style={{
                      padding: '4px 12px',
                      borderRadius: 999,
                      background: 'linear-gradient(135deg, #DC2626, #EF4444)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                      boxShadow: '0 2px 12px rgba(220,38,38,0.4)',
                    }}
                  >
                    PENTAKILL
                  </div>
                )}
                {quadraKills > 0 && pentaKills === 0 && (
                  <div
                    style={{
                      padding: '4px 12px',
                      borderRadius: 999,
                      background: 'linear-gradient(135deg, #EA580C, #F97316)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    QUADRA KILL
                  </div>
                )}
                {tripleKills > 0 && quadraKills === 0 && pentaKills === 0 && (
                  <div
                    style={{
                      padding: '4px 12px',
                      borderRadius: 999,
                      background: 'linear-gradient(135deg, #9333EA, #A855F7)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    TRIPLE KILL
                  </div>
                )}
              </div>
            )}

            {/* Items showcase */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(168,85,247,0.2)',
              }}
            >
              <div style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 10, fontWeight: 600 }}>
                BUILD
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {itemIconUrls.length > 0 ? (
                  itemIconUrls.map((url: string, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: '2px solid rgba(168,85,247,0.3)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        background: 'rgba(0,0,0,0.5)',
                      }}
                    >
                      <img 
                        src={url}
                        alt={`Item ${idx + 1}`}
                        width={52}
                        height={52}
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#6B7280' }}>No items purchased</div>
                )}
              </div>
            </div>

            {/* Team score and match ID */}
            <div
              style={{
                marginTop: 'auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 12,
                borderTop: '1px solid rgba(168,85,247,0.15)',
              }}
            >
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 16px',
                    borderRadius: 10,
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.2)',
                  }}
                >
                  <div style={{ fontSize: 13, color: '#93C5FD', fontWeight: 600 }}>
                    BLUE
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#3B82F6' }}>
                    {blueKills}
                  </div>
                </div>
                
                <div style={{ fontSize: 16, color: '#6B7280', fontWeight: 600 }}>
                  VS
                </div>
                
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 16px',
                    borderRadius: 10,
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#EF4444' }}>
                    {redKills}
                  </div>
                  <div style={{ fontSize: 13, color: '#FCA5A5', fontWeight: 600 }}>
                    RED
                  </div>
                </div>
              </div>
              
              <div
                style={{
                  fontSize: 12,
                  color: '#6B7280',
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.05)',
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
