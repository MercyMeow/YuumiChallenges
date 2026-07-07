import { ImageResponse } from 'next/og';
import { fetchProfile } from './profile-data';

export const alt = 'Yuumi player profile — season stats and ladder rank';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

const GOLD = '#C8AA6E';
const TEAL = '#0AC8B9';

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 40px',
        borderRadius: 20,
        border: '1px solid #785A28aa',
        backgroundColor: '#00000055',
      }}
    >
      <div style={{ display: 'flex', fontSize: 52, fontWeight: 800 }}>
        {value}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 24,
          color: GOLD,
          marginTop: 8,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default async function OpengraphImage(props: {
  params: Promise<{ region: string; riotId: string }>;
}) {
  const params = await props.params;
  const profile = await fetchProfile(params);

  if (!profile) {
    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A1428',
          border: `4px solid ${GOLD}`,
          color: 'white',
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 84, fontWeight: 800 }}>
          yuumi.quest
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            color: GOLD,
            marginTop: 16,
          }}
        >
          Master+ Yuumi ladder
        </div>
      </div>,
      size
    );
  }

  const { player } = profile;
  const winrate =
    player.gamesCount > 0
      ? Math.round((player.wins / player.gamesCount) * 100)
      : 0;
  const kda =
    player.deathsTotal === 0
      ? 'Perfect'
      : (
          (player.killsTotal + player.assistsTotal) /
          player.deathsTotal
        ).toFixed(2);
  const showPosition =
    typeof player.position === 'number' && player.position > 0;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '56px 64px',
        background: '#0A1428',
        border: `4px solid ${GOLD}`,
        color: 'white',
        fontFamily: 'serif',
      }}
    >
      {/* Name */}
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <div style={{ display: 'flex', fontSize: 72, fontWeight: 800 }}>
          {player.gameName}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 44,
            color: '#9ca3af',
            marginLeft: 16,
          }}
        >
          #{player.tagLine}
        </div>
      </div>

      {/* Tier + LP line */}
      <div
        style={{
          display: 'flex',
          fontSize: 34,
          color: GOLD,
          marginTop: 12,
        }}
      >
        {`${player.tier} · ${player.lp} LP${
          showPosition ? ` · #${player.position} Yuumi worldwide` : ''
        }`}
      </div>

      {/* Stat blocks */}
      <div style={{ display: 'flex', gap: 28, marginTop: 56 }}>
        <StatBlock label="Winrate" value={`${winrate}%`} />
        <StatBlock label="Games" value={`${player.gamesCount}`} />
        <StatBlock label="KDA" value={kda} />
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          fontSize: 28,
          color: TEAL,
          marginTop: 'auto',
        }}
      >
        yuumi.quest · Master+ Yuumi ladder
      </div>
    </div>,
    size
  );
}
