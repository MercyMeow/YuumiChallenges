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

    // For now, return a working fallback that can be enhanced later
    // This ensures Discord embeds work immediately
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            backgroundColor: '#0a0a0f',
            backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            color: 'white',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Left panel */}
          <div
            style={{
              width: 400,
              height: '100%',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(147,51,234,0.2) 100%)',
              borderRight: '3px solid #3B82F6',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: '#fff',
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              Match Details
            </div>
            <div
              style={{
                fontSize: 24,
                color: '#93C5FD',
                marginBottom: 40,
              }}
            >
              #{matchId}
            </div>
            <div
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                color: '#fff',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              View Full Stats
            </div>
          </div>

          {/* Right panel */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '40px',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                background: 'linear-gradient(90deg, #a855f7, #3b82f6, #10b981)',
                backgroundClip: 'text',
                color: 'transparent',
                marginBottom: 20,
              }}
            >
              Yuumi Challenges
            </div>
            <div style={{ fontSize: 24, color: '#E5E7EB', marginBottom: 16 }}>
              League of Legends Match Analysis
            </div>
            <div style={{ fontSize: 18, color: '#9CA3AF', marginBottom: 32 }}>
              Comprehensive stats, champion builds, and performance insights
            </div>
            
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
                  background: 'rgba(168,85,247,0.2)',
                  border: '1px solid rgba(168,85,247,0.4)',
                }}
              >
                <div style={{ fontSize: 14, color: '#E9D5FF', marginBottom: 4 }}>
                  CHAMPION PERFORMANCE
                </div>
                <div style={{ fontSize: 18, color: '#C084FC' }}>
                  KDA & Build Analysis
                </div>
              </div>
              
              <div
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: 'rgba(59,130,246,0.2)',
                  border: '1px solid rgba(59,130,246,0.4)',
                }}
              >
                <div style={{ fontSize: 14, color: '#BFDBFE', marginBottom: 4 }}>
                  TEAM STATS
                </div>
                <div style={{ fontSize: 18, color: '#60A5FA' }}>
                  Victory Conditions
                </div>
              </div>
              
              <div
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: 'rgba(16,185,129,0.2)',
                  border: '1px solid rgba(16,185,129,0.4)',
                }}
              >
                <div style={{ fontSize: 14, color: '#A7F3D0', marginBottom: 4 }}>
                  DAMAGE DEALT
                </div>
                <div style={{ fontSize: 18, color: '#34D399' }}>
                  Combat Analysis
                </div>
              </div>
              
              <div
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: 'rgba(234,179,8,0.2)',
                  border: '1px solid rgba(234,179,8,0.4)',
                }}
              >
                <div style={{ fontSize: 14, color: '#FDE68A', marginBottom: 4 }}>
                  GOLD EARNED  
                </div>
                <div style={{ fontSize: 18, color: '#FBBF24' }}>
                  Economy Impact
                </div>
              </div>
            </div>
            
            <div
              style={{
                marginTop: 32,
                fontSize: 14,
                color: '#6B7280',
                textAlign: 'center',
              }}
            >
              Click to view detailed match breakdown
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
    console.error('Error generating match embed:', error);

    // Fallback error image
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
          <div style={{ fontSize: 24, color: '#9CA3AF', marginBottom: 10 }}>
            Match Details
          </div>
          <div style={{ fontSize: 16, color: '#6B7280' }}>
            Loading match data...
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