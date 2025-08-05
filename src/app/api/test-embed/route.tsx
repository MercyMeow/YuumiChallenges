import { ImageResponse } from 'next/og';

export async function GET() {
  try {
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
          <div style={{ fontSize: 24, color: '#9CA3AF' }}>
            Discord Embed Test - Working!
          </div>
          <div style={{ fontSize: 16, color: '#6B7280', marginTop: 10 }}>
            {new Date().toISOString()}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating test embed:', error);
    return new Response('Error generating image', { status: 500 });
  }
}