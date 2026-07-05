/* eslint-disable @next/next/no-img-element -- next/og (satori) renders plain
   JSX to a PNG; next/image cannot be used here. */
import { ImageResponse } from 'next/og';
import {
  getEmbedRunes,
  getCoreItems,
  getSkillPriority,
} from '@/lib/builds/embed-summary';
import { fetchAutoBuild } from '@/lib/builds/auto-build';
import { getLiveDdragonVersion, toGuidePatch } from '@/lib/utils/live-patch';

export const alt = 'Yuumi recommended build, runes, and skill order';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const DDRAGON = 'https://ddragon.leagueoflegends.com/cdn';

const SKILL_COLORS: Record<string, string> = {
  Q: '#a78bfa',
  E: '#5eead4',
  W: '#7dd3fc',
};

export default async function OpengraphImage() {
  const [version, auto] = await Promise.all([
    getLiveDdragonVersion(),
    fetchAutoBuild(),
  ]);
  const patch = toGuidePatch(version);
  const runes = getEmbedRunes(auto);
  const coreItems = getCoreItems(auto);
  const skillPriority = getSkillPriority(auto);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '48px 56px',
          background:
            'linear-gradient(135deg, #0b0714 0%, #1a1030 45%, #0f1a2e 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}
        >
          <img
            alt="Yuumi"
            src={`${DDRAGON}/${version}/img/champion/Yuumi.png`}
            width={96}
            height={96}
            style={{ borderRadius: 20, border: '2px solid #a78bfa66' }}
          />
          <div
            style={{ display: 'flex', flexDirection: 'column', marginLeft: 28 }}
          >
            <div style={{ display: 'flex', fontSize: 56, fontWeight: 800 }}>
              Yuumi Guide
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                color: '#c4b5fd',
              }}
            >
              {auto
                ? `Live Build · Patch ${patch} · yuumi.quest`
                : `Recommended Build · Patch ${patch} · yuumi.quest`}
            </div>
          </div>
        </div>

        {/* Runes */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 28px',
            borderRadius: 20,
            border: '1px solid #ffffff1f',
            backgroundColor: '#00000055',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              color: '#a78bfa',
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            RECOMMENDED RUNES
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            {runes.map((rune) => (
              <div
                key={rune.name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 150,
                }}
              >
                {rune.icon ? (
                  <img
                    alt={rune.name}
                    src={`${DDRAGON}/img/${rune.icon}`}
                    width={56}
                    height={56}
                  />
                ) : null}
                <div
                  style={{
                    display: 'flex',
                    fontSize: 17,
                    color: '#e5e7eb',
                    marginTop: 6,
                    textAlign: 'center',
                  }}
                >
                  {rune.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items + skill order row */}
        <div style={{ display: 'flex', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              padding: '20px 28px',
              borderRadius: 20,
              border: '1px solid #ffffff1f',
              backgroundColor: '#00000055',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                color: '#5eead4',
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              CORE ITEMS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {coreItems.map((item, index) => (
                <div
                  key={item.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 14 }}
                >
                  {index > 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        fontSize: 30,
                        color: '#9ca3af',
                      }}
                    >
                      →
                    </div>
                  ) : null}
                  <img
                    alt={item.name}
                    src={`${DDRAGON}/${version}/img/item/${item.id}.png`}
                    width={64}
                    height={64}
                    style={{
                      borderRadius: 12,
                      border: '1px solid #ffffff33',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 28px',
              borderRadius: 20,
              border: '1px solid #ffffff1f',
              backgroundColor: '#00000055',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                color: '#7dd3fc',
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              SKILL ORDER
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {skillPriority.map((skill, index) => (
                <div
                  key={skill}
                  style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  {index > 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        fontSize: 30,
                        color: '#9ca3af',
                      }}
                    >
                      &gt;
                    </div>
                  ) : null}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 64,
                      height: 64,
                      borderRadius: 14,
                      fontSize: 34,
                      fontWeight: 800,
                      color: '#0b0714',
                      backgroundColor: SKILL_COLORS[skill] ?? '#a78bfa',
                    }}
                  >
                    {skill}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
