import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

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
    const blueTeam = matchData.info.participants.filter((p: any) => p.teamId === 100);
    const redTeam = matchData.info.participants.filter((p: any) => p.teamId === 200);
    const blueTeamData = matchData.info.teams.find((t: any) => t.teamId === 100);
    
    // Calculate team stats
    const blueKills = blueTeam.reduce((sum: number, p: any) => sum + p.kills, 0);
    const blueDeaths = blueTeam.reduce((sum: number, p: any) => sum + p.deaths, 0);
    const blueAssists = blueTeam.reduce((sum: number, p: any) => sum + p.assists, 0);
    
    const redKills = redTeam.reduce((sum: number, p: any) => sum + p.kills, 0);
    const redDeaths = redTeam.reduce((sum: number, p: any) => sum + p.deaths, 0);
    const redAssists = redTeam.reduce((sum: number, p: any) => sum + p.assists, 0);
    
    // Get MVP
    const mvp = matchData.info.participants.reduce((best: any, player: any) => {
      const kda = player.deaths === 0 
        ? player.kills + player.assists 
        : (player.kills + player.assists) / player.deaths;
      const bestKda = best.deaths === 0 
        ? best.kills + best.assists 
        : (best.kills + best.assists) / best.deaths;
      return kda > bestKda ? player : best;
    });
    
    const winner = blueTeamData?.win ? 'BLUE' : 'RED';
    const winnerColor = blueTeamData?.win ? '#3B82F6' : '#EF4444';
    
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
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
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
          </div>
          
          {/* Winner Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 30,
              padding: '10px 30px',
              borderRadius: 10,
              backgroundColor: winnerColor,
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 'bold', color: 'white' }}>
              {winner} TEAM VICTORY
            </div>
          </div>
          
          {/* Score */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 40,
              marginBottom: 40,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 72, fontWeight: 'bold', color: '#3B82F6' }}>
                {blueKills}
              </div>
              <div style={{ fontSize: 18, color: '#9CA3AF' }}>Blue Team</div>
            </div>
            
            <div style={{ fontSize: 48, color: '#6B7280' }}>vs</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 72, fontWeight: 'bold', color: '#EF4444' }}>
                {redKills}
              </div>
              <div style={{ fontSize: 18, color: '#9CA3AF' }}>Red Team</div>
            </div>
          </div>
          
          {/* Team KDA */}
          <div
            style={{
              display: 'flex',
              gap: 60,
              marginBottom: 40,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 24, color: '#3B82F6' }}>
                {blueKills}/{blueDeaths}/{blueAssists}
              </div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>KDA</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 24, color: '#EF4444' }}>
                {redKills}/{redDeaths}/{redAssists}
              </div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>KDA</div>
            </div>
          </div>
          
          {/* MVP */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px 40px',
              borderRadius: 10,
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              border: '2px solid rgba(168, 85, 247, 0.3)',
            }}
          >
            <div style={{ fontSize: 16, color: '#9CA3AF', marginBottom: 8 }}>MVP</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#F3F4F6' }}>
              {mvp.riotIdGameName || mvp.summonerName}
            </div>
            <div style={{ fontSize: 20, color: '#D1D5DB' }}>
              {mvp.championName} - {mvp.kills}/{mvp.deaths}/{mvp.assists}
            </div>
          </div>
          
          {/* Game Info */}
          <div
            style={{
              display: 'flex',
              gap: 30,
              marginTop: 40,
              fontSize: 18,
              color: '#9CA3AF',
            }}
          >
            <div>Duration: {gameDuration}m</div>
            <div>•</div>
            <div>{matchData.info.gameMode}</div>
            <div>•</div>
            <div>Match ID: {matchId}</div>
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
            backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
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