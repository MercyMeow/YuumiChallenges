import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

// Use Node.js runtime for better compatibility and error handling
export const runtime = 'nodejs';

interface MatchParticipant {
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  teamId: number;
  win: boolean;
  riotIdGameName?: string;
  summonerName?: string;
  riotIdTagline?: string;
  champLevel?: number;
  totalDamageDealtToChampions?: number;
  goldEarned?: number;
  totalMinionsKilled?: number;
  neutralMinionsKilled?: number;
  visionScore?: number;
  firstBloodKill?: boolean;
  pentaKills?: number;
  quadraKills?: number;
  tripleKills?: number;
  doubleKills?: number;
  item0?: number;
  item1?: number;
  item2?: number;
  item3?: number;
  item4?: number;
  item5?: number;
}

interface MatchData {
  info: {
    gameDuration: number;
    gameMode: string;
    participants: MatchParticipant[];
    teams: Array<{
      teamId: number;
      win: boolean;
    }>;
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const resolvedParams = await params;
    const matchIdWithExt = resolvedParams.matchId;
    const matchId = matchIdWithExt.replace('.png', '');

    // Validate matchId format
    if (!matchId || matchId.length < 3) {
      return await generateErrorImage('Invalid match ID', matchId);
    }

    // Fetch match data with comprehensive error handling
    const matchData = await fetchMatchData(matchId);
    
    if (!matchData) {
      return await generateErrorImage('Match not found', matchId);
    }

    // Generate the enhanced embed image
    return await generateMatchEmbed(matchData, matchId);
    
  } catch (error) {
    console.error('Error in match embed generation:', error);
    return await generateErrorImage('Image generation failed', 'unknown');
  }
}

async function fetchMatchData(matchId: string): Promise<MatchData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  
  try {
    const response = await fetch(`${baseUrl}/api/match-details/${matchId}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'YuumiChallenges-EmbedGenerator/1.0',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`Match API returned ${response.status} for match ${matchId}`);
      return null;
    }

    const data = await response.json();
    return data.matchData as MatchData;
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`Match data fetch timed out for ${matchId}`);
    } else {
      console.warn(`Match data fetch failed for ${matchId}:`, error instanceof Error ? error.message : String(error));
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function generateMatchEmbed(matchData: MatchData, matchId: string): Promise<ImageResponse> {
  // Extract match information
  const gameDuration = Math.floor(matchData.info.gameDuration / 60);
  const gameSeconds = Math.floor(matchData.info.gameDuration % 60);
  const blueTeam = matchData.info.participants.filter(p => p.teamId === 100);
  const redTeam = matchData.info.participants.filter(p => p.teamId === 200);
  const blueTeamData = matchData.info.teams.find(t => t.teamId === 100);

  // Calculate team stats
  const blueKills = blueTeam.reduce((sum, p) => sum + p.kills, 0);
  const redKills = redTeam.reduce((sum, p) => sum + p.kills, 0);

  // Get MVP with improved logic
  const mvp = matchData.info.participants.reduce((best, player) => {
    const kda = player.deaths === 0
      ? player.kills + player.assists
      : (player.kills + player.assists) / player.deaths;
    const bestKda = best.deaths === 0
      ? best.kills + best.assists
      : (best.kills + best.assists) / best.deaths;
    
    // Prefer winning team MVP if KDA is close
    if (Math.abs(kda - bestKda) < 0.5) {
      return player.win ? player : best;
    }
    return kda > bestKda ? player : best;
  });

  const winner = blueTeamData?.win ? 'BLUE' : 'RED';
  const winnerColor = blueTeamData?.win ? '#3B82F6' : '#EF4444';
  const winnerBg = blueTeamData?.win ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)';
  
  // Calculate advanced MVP stats
  const mvpTeamKills = mvp.teamId === 100 ? blueKills : redKills;
  const killParticipation = mvpTeamKills > 0 
    ? Math.round(((mvp.kills + mvp.assists) / mvpTeamKills) * 100)
    : 0;
  
  const kdaRatio = mvp.deaths === 0 
    ? 'Perfect' 
    : ((mvp.kills + mvp.assists) / mvp.deaths).toFixed(2);

  const cs = (mvp.totalMinionsKilled || 0) + (mvp.neutralMinionsKilled || 0);
  const csPerMin = gameDuration > 0 ? (cs / gameDuration).toFixed(1) : '0.0';
  const damage = mvp.totalDamageDealtToChampions || 0;
  const gold = mvp.goldEarned || 0;
  const vision = mvp.visionScore || 0;

  // Multi-kill detection
  const multiKill = mvp.pentaKills ? 'PENTAKILL!'
    : mvp.quadraKills ? 'QUADRA KILL'
    : mvp.tripleKills ? 'TRIPLE KILL'
    : mvp.doubleKills ? 'DOUBLE KILL'
    : null;

  // Use CDN URLs for champion images with fallback
  const championIconUrl = `https://ddragon.leagueoflegends.com/cdn/14.23.1/img/champion/${mvp.championName}.png`;

  // Items
  const items = [mvp.item0, mvp.item1, mvp.item2, mvp.item3, mvp.item4, mvp.item5]
    .filter(item => item && item > 0);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          backgroundColor: '#0a0a0f',
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(147, 51, 234, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
            linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)
          `,
          color: '#E5E7EB',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        }}
      >
        {/* Left panel: Champion showcase */}
        <div
          style={{
            width: 420,
            height: '100%',
            background: `linear-gradient(135deg, ${winnerBg} 0%, rgba(16,16,32,0.8) 100%)`,
            borderRight: `3px solid ${winnerColor}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Victory Badge */}
          <div
            style={{
              position: 'absolute',
              top: 32,
              left: 32,
              padding: '10px 20px',
              borderRadius: 12,
              background: `linear-gradient(135deg, ${winnerColor}, ${winnerColor}dd)`,
              color: '#fff',
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 1,
              boxShadow: `0 6px 25px ${winnerColor}60`,
              textTransform: 'uppercase',
            }}
          >
            {winner} Victory
          </div>
          
          {/* Champion Icon */}
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 20,
              overflow: 'hidden',
              border: `4px solid ${winnerColor}`,
              boxShadow: `0 15px 50px ${winnerColor}50, 0 0 100px ${winnerColor}30`,
              marginBottom: 20,
            }}
          >
            <img 
              src={championIconUrl}
              alt={mvp.championName}
              width={140}
              height={140}
              style={{ objectFit: 'cover' }}
            />
          </div>
          
          {/* Champion name */}
          <div
            style={{
              fontSize: 42,
              fontWeight: 900,
              color: '#fff',
              textAlign: 'center',
              marginBottom: 16,
              textShadow: '0 4px 20px rgba(0,0,0,0.8)',
            }}
          >
            {mvp.championName}
          </div>
          
          {/* KDA Display */}
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: '#fff',
              marginBottom: 12,
              textShadow: '0 4px 20px rgba(0,0,0,0.8)',
            }}
          >
            {mvp.kills}/{mvp.deaths}/{mvp.assists}
          </div>
          
          <div
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              background: kdaRatio === 'Perfect' 
                ? 'linear-gradient(135deg, #10B981, #059669)'
                : parseFloat(kdaRatio) >= 5 
                ? 'linear-gradient(135deg, #F59E0B, #EAB308)'
                : parseFloat(kdaRatio) >= 3
                ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                : 'linear-gradient(135deg, #6B7280, #4B5563)',
              color: '#fff',
              fontSize: 18,
              fontWeight: 700,
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            }}
          >
            {kdaRatio} KDA
          </div>

          {/* Multi-kill badge */}
          {multiKill && (
            <div
              style={{
                position: 'absolute',
                top: 120,
                right: 32,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                boxShadow: '0 4px 15px rgba(220,38,38,0.5)',
                transform: 'rotate(-5deg)',
              }}
            >
              {multiKill}
            </div>
          )}
          
          {/* Level badge */}
          <div
            style={{
              position: 'absolute',
              bottom: 32,
              right: 32,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: 16,
              color: '#E5E7EB',
              fontWeight: 600,
            }}
          >
            Level {mvp.champLevel || 18}
          </div>
        </div>

        {/* Right panel: Enhanced stats */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '40px',
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
              borderBottom: '2px solid rgba(59,130,246,0.3)',
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontWeight: 900,
                background: 'linear-gradient(135deg, #A855F7, #3B82F6, #10B981)',
                backgroundClip: 'text',
                color: 'transparent',
                letterSpacing: -1,
              }}
            >
              Yuumi Challenges
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: 'rgba(168,85,247,0.2)',
                  color: '#E9D5FF',
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {matchData.info.gameMode}
              </div>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: 'rgba(59,130,246,0.2)',
                  color: '#BFDBFE',
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {gameDuration}m {gameSeconds}s
              </div>
            </div>
          </div>

          {/* Summoner info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: mvp.teamId === 100 ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.3)',
                border: `2px solid ${mvp.teamId === 100 ? '#3B82F6' : '#EF4444'}`,
                color: mvp.teamId === 100 ? '#93C5FD' : '#FCA5A5',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {mvp.teamId === 100 ? 'BLUE' : 'RED'}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#F3F4F6' }}>
              {mvp.riotIdGameName || mvp.summonerName}
            </div>
            {mvp.riotIdTagline && (
              <div style={{ fontSize: 18, color: '#9CA3AF' }}>
                #{mvp.riotIdTagline}
              </div>
            )}
            {mvp.firstBloodKill && (
              <div
                style={{
                  marginLeft: 'auto',
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                First Blood
              </div>
            )}
          </div>

          {/* Enhanced Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              flex: 1,
            }}
          >
            {/* Damage */}
            <div
              style={{
                padding: '16px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1))',
                border: '2px solid rgba(239,68,68,0.3)',
              }}
            >
              <div style={{ fontSize: 12, color: '#FCA5A5', fontWeight: 700, marginBottom: 6 }}>
                DAMAGE TO CHAMPIONS
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                {damage.toLocaleString()}
              </div>
            </div>
            
            {/* Economy */}
            <div
              style={{
                padding: '16px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(202,138,4,0.1))',
                border: '2px solid rgba(234,179,8,0.3)',
              }}
            >
              <div style={{ fontSize: 12, color: '#FDE68A', fontWeight: 700, marginBottom: 6 }}>
                GOLD EARNED
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                {gold.toLocaleString()}g
              </div>
              <div style={{ fontSize: 14, color: '#FCD34D' }}>
                {cs} CS ({csPerMin}/min)
              </div>
            </div>
            
            {/* Kill Participation */}
            <div
              style={{
                padding: '16px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(147,51,234,0.1))',
                border: '2px solid rgba(168,85,247,0.3)',
              }}
            >
              <div style={{ fontSize: 12, color: '#E9D5FF', fontWeight: 700, marginBottom: 6 }}>
                KILL PARTICIPATION
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                {killParticipation}%
              </div>
              <div style={{ fontSize: 14, color: '#C084FC' }}>
                Vision: {vision}
              </div>
            </div>
          </div>

          {/* Items Section */}
          {items.length > 0 && (
            <div
              style={{
                padding: '16px',
                borderRadius: 12,
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(168,85,247,0.3)',
              }}
            >
              <div style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 12, fontWeight: 600 }}>
                BUILD ({items.length} ITEMS)
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {items.slice(0, 6).map((itemId, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(168,85,247,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      color: '#9CA3AF',
                    }}
                  >
                    #{itemId}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer with team scores */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 16,
              borderTop: '2px solid rgba(59,130,246,0.3)',
            }}
          >
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderRadius: 10,
                  background: 'rgba(59,130,246,0.2)',
                  border: '2px solid rgba(59,130,246,0.4)',
                }}
              >
                <div style={{ fontSize: 14, color: '#93C5FD', fontWeight: 700 }}>
                  BLUE
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#3B82F6' }}>
                  {blueKills}
                </div>
              </div>
              
              <div style={{ fontSize: 18, color: '#6B7280', fontWeight: 700 }}>
                VS
              </div>
              
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderRadius: 10,
                  background: 'rgba(239,68,68,0.2)',
                  border: '2px solid rgba(239,68,68,0.4)',
                }}
              >
                <div style={{ fontSize: 32, fontWeight: 900, color: '#EF4444' }}>
                  {redKills}
                </div>
                <div style={{ fontSize: 14, color: '#FCA5A5', fontWeight: 700 }}>
                  RED
                </div>
              </div>
            </div>
            
            <div
              style={{
                fontSize: 12,
                color: '#6B7280',
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Match #{matchId}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: Buffer.from([]), // In production, load actual font data
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );
}

async function generateErrorImage(errorMessage: string, matchId: string): Promise<ImageResponse> {
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
          color: 'white',
          fontFamily: 'Inter, sans-serif',
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
        <div style={{ fontSize: 24, color: '#EF4444', marginBottom: 10 }}>
          {errorMessage}
        </div>
        <div style={{ fontSize: 16, color: '#6B7280' }}>
          Match #{matchId}
        </div>
        <div style={{ fontSize: 14, color: '#9CA3AF', marginTop: 20 }}>
          Please try again later
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}