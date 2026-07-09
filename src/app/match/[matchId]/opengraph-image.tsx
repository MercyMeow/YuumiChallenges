import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';
import {
  fetchMatchSummary,
  resolveBaseUrl,
  MatchSummary,
} from './match-summary';

export const alt = 'League of Legends match summary — teams, score and MVP';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const GOLD = '#C8AA6E';
const TEAL = '#0AC8B9';
const BLUE = '#3B82F6';
const RED = '#EF4444';

type IconMap = Map<string, string>;

/**
 * Champion squares inlined as data URIs: satori aborts the whole render on
 * a failed <img> fetch, so a single bad champion alias would break the
 * embed. Missing icons fall back to a plain placeholder box instead.
 */
async function fetchChampionIcons(champions: string[]): Promise<IconMap> {
  const unique = [...new Set(champions)];
  const icons: IconMap = new Map();
  await Promise.all(
    unique.map(async (champion) => {
      try {
        const res = await fetch(
          `https://cdn.communitydragon.org/latest/champion/${champion}/square`
        );
        if (!res.ok) return;
        const buffer = await res.arrayBuffer();
        const type = res.headers.get('content-type') ?? 'image/png';
        icons.set(
          champion,
          `data:${type};base64,${Buffer.from(buffer).toString('base64')}`
        );
      } catch {
        // placeholder box is rendered instead
      }
    })
  );
  return icons;
}

function ChampionSquare({
  champion,
  icons,
  iconSize,
  borderColor,
}: {
  champion: string;
  icons: IconMap;
  iconSize: number;
  borderColor: string;
}) {
  const src = icons.get(champion);
  if (!src) {
    return (
      <div
        style={{
          display: 'flex',
          width: iconSize,
          height: iconSize,
          borderRadius: 10,
          border: `2px solid ${borderColor}`,
          backgroundColor: '#1E2D45',
        }}
      />
    );
  }
  return (
    <img
      src={src}
      alt={champion}
      width={iconSize}
      height={iconSize}
      style={{ borderRadius: 10, border: `2px solid ${borderColor}` }}
    />
  );
}

function FallbackCard({ matchId }: { matchId: string }) {
  return (
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
      }}
    >
      <div style={{ display: 'flex', fontSize: 84, fontWeight: 800 }}>
        yuumi.quest
      </div>
      <div
        style={{ display: 'flex', fontSize: 32, color: GOLD, marginTop: 16 }}
      >
        {`Match details — ${matchId}`}
      </div>
    </div>
  );
}

function TeamRow({
  label,
  color,
  champions,
  kills,
  icons,
}: {
  label: string;
  color: string;
  champions: string[];
  kills: number;
  icons: IconMap;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          width: 130,
          fontSize: 28,
          fontWeight: 800,
          color,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {champions.map((champion, i) => (
          <ChampionSquare
            key={`${champion}-${i}`}
            champion={champion}
            icons={icons}
            iconSize={72}
            borderColor={`${color}88`}
          />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 44,
          fontWeight: 800,
          color,
          marginLeft: 'auto',
        }}
      >
        {`${kills}`}
      </div>
    </div>
  );
}

function MatchCard({
  summary,
  icons,
}: {
  summary: MatchSummary;
  icons: IconMap;
}) {
  const winnerColor = summary.blueWin ? BLUE : RED;
  const winnerLabel = summary.blueWin
    ? 'Blue Team Victory'
    : 'Red Team Victory';
  const { mvp } = summary;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '44px 56px',
        background: '#0A1428',
        border: `4px solid ${GOLD}`,
        color: 'white',
      }}
    >
      {/* Header: winner + mode/duration */}
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <div
          style={{
            display: 'flex',
            fontSize: 56,
            fontWeight: 800,
            color: winnerColor,
          }}
        >
          {winnerLabel}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            color: GOLD,
            marginLeft: 'auto',
          }}
        >
          {`${summary.gameMode} · ${summary.gameDurationMin}m`}
        </div>
      </div>

      {/* Team rows */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          marginTop: 44,
        }}
      >
        <TeamRow
          label="Blue"
          color={BLUE}
          champions={summary.blueChampions}
          kills={summary.blueKills}
          icons={icons}
        />
        <TeamRow
          label="Red"
          color={RED}
          champions={summary.redChampions}
          kills={summary.redKills}
          icons={icons}
        />
      </div>

      {/* MVP strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          marginTop: 44,
          padding: '18px 28px',
          borderRadius: 16,
          border: `1px solid ${GOLD}aa`,
          backgroundColor: '#00000055',
        }}
      >
        <ChampionSquare
          champion={mvp.champion}
          icons={icons}
          iconSize={64}
          borderColor={GOLD}
        />
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            fontWeight: 800,
            color: GOLD,
          }}
        >
          MVP
        </div>
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 700 }}>
          {`${mvp.name} · ${mvp.champion}`}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            color: '#9ca3af',
            marginLeft: 'auto',
          }}
        >
          {`${mvp.kills}/${mvp.deaths}/${mvp.assists} · ${mvp.kdaLabel} KDA`}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          fontSize: 26,
          color: TEAL,
          marginTop: 'auto',
        }}
      >
        {`yuumi.quest · ${summary.matchId}`}
      </div>
    </div>
  );
}

export default async function OpengraphImage(props: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await props.params;

  try {
    const headersList = await headers();
    const baseUrl = resolveBaseUrl(headersList);
    const summary = await fetchMatchSummary(matchId, baseUrl);
    if (!summary) {
      return new ImageResponse(<FallbackCard matchId={matchId} />, size);
    }
    const icons = await fetchChampionIcons([
      ...summary.blueChampions,
      ...summary.redChampions,
      summary.mvp.champion,
    ]);
    return new ImageResponse(
      <MatchCard summary={summary} icons={icons} />,
      size
    );
  } catch (error) {
    console.error('match og image failed:', error);
    return new ImageResponse(<FallbackCard matchId={matchId} />, size);
  }
}
