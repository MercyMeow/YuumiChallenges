'use client';

// Interactive ability guide for the Yuumi page: a spell selector rail with
// Data Dragon icons, plus a detail scroll of short, highlighted tips for the
// selected ability. Replaces the old five-stacked-boxes text wall.

import { useEffect, useState } from 'react';
import { Droplets, Sparkles, Timer } from 'lucide-react';
import { HextechPanel } from '@/components/ui/hextech-panel';
import { AbilityIcon } from '@/components/ui/datadragon-image';
import { formatBurn, GameTermText } from '@/components/guide/game-terms';
import { getChampionDetails } from '@/lib/apis/datadragon';
import { YUUMI_SPELL_TIPS, type SpellTip } from '@/lib/guide/spell-tips';
import { cn } from '@/lib/utils';

type AbilityKey = SpellTip['key'];

// Same skill colors the build tab's skill-order table uses; P gets magic teal.
const KEY_TEXT: Record<AbilityKey, string> = {
  P: 'text-hx-magic-bright',
  Q: 'text-accessible-blue',
  W: 'text-accessible-green',
  E: 'text-accessible-yellow',
  R: 'text-accessible-red',
};

type SpellStats = { cooldown: string; cost: string };

export function AbilityGuidePanel() {
  const [activeKey, setActiveKey] = useState<AbilityKey>('P');
  const [stats, setStats] = useState<Partial<Record<AbilityKey, SpellStats>>>(
    {}
  );

  // Cooldown/cost chips are progressive enhancement from live Data Dragon
  // data; the tips render fine without them.
  useEffect(() => {
    let cancelled = false;
    getChampionDetails('Yuumi')
      .then((champion) => {
        if (cancelled || !champion.spells) return;
        const next: Partial<Record<AbilityKey, SpellStats>> = {};
        (['Q', 'W', 'E', 'R'] as const).forEach((key, index) => {
          const spell = champion.spells?.[index];
          if (spell) {
            next[key] = {
              cooldown: formatBurn(spell.cooldownBurn),
              cost: formatBurn(spell.costBurn),
            };
          }
        });
        setStats(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const active =
    YUUMI_SPELL_TIPS.find((spell) => spell.key === activeKey) ??
    YUUMI_SPELL_TIPS[0];
  if (!active) return null;
  const activeStats = active.key === 'P' ? undefined : stats[active.key];

  return (
    <HextechPanel
      title="Ability Guide"
      icon={<Sparkles className="h-4 w-4" />}
      contentClassName="space-y-4 p-4 sm:p-6"
    >
      {/* Spell selector rail */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {YUUMI_SPELL_TIPS.map((spell) => {
          const isActive = spell.key === active.key;
          return (
            <button
              key={spell.key}
              type="button"
              onClick={() => setActiveKey(spell.key)}
              aria-pressed={isActive}
              aria-label={`View ${spell.name} tips`}
              className={cn(
                'group flex flex-col items-center gap-1.5 rounded-sm p-2 transition-all duration-200 sm:p-3',
                isActive
                  ? 'hex-card-elevated hex-glow-gold'
                  : 'hex-card hover:border-hx-gold/70'
              )}
            >
              {/* Decorative: the button's aria-label is the accessible name. */}
              <span className="relative" aria-hidden>
                <AbilityIcon
                  championId="Yuumi"
                  ability={spell.key}
                  size={40}
                  className={cn(
                    'rounded-sm border transition-all duration-200',
                    isActive
                      ? 'border-hx-gold-bright'
                      : 'border-hx-gold-dark/60 opacity-80 group-hover:opacity-100'
                  )}
                />
                <span
                  className={cn(
                    'absolute -right-1.5 -bottom-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-sm border border-hx-gold-dark bg-hx-black text-[10px] font-bold',
                    KEY_TEXT[spell.key]
                  )}
                  aria-hidden
                >
                  {spell.key}
                </span>
              </span>
              <span
                className={cn(
                  'hidden truncate text-[10px] tracking-wide sm:block',
                  isActive ? 'text-hx-gold-bright' : 'text-hx-parchment/60'
                )}
              >
                {spell.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail scroll for the selected ability */}
      <div
        key={active.key}
        className="rounded-sm p-4 hex-card-inset duration-300 animate-in fade-in slide-in-from-bottom-2 sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="hex-frame-art shrink-0 rounded-sm">
            <AbilityIcon
              championId="Yuumi"
              ability={active.key}
              size={52}
              className="rounded-sm"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="hex-title text-lg text-hx-parchment">
                {active.name}
              </span>
              <span className={cn('hex-chip', KEY_TEXT[active.key])}>
                {active.key === 'P' ? 'Passive' : active.key}
              </span>
            </div>
            <p className="mt-1 text-xs text-hx-parchment/65 sm:text-sm">
              {active.summary}
            </p>
          </div>
          {active.key !== 'P' && (
            <div className="flex shrink-0 flex-wrap gap-2">
              <span className="hex-chip" title="Cooldown per rank">
                <Timer className="h-3 w-3" />
                {activeStats ? `${activeStats.cooldown}s` : '—'}
              </span>
              <span className="hex-chip-magic" title="Mana cost per rank">
                <Droplets className="h-3 w-3" />
                {activeStats ? `${activeStats.cost} mana` : '—'}
              </span>
            </div>
          )}
        </div>

        <div className="my-4 hex-divider" />

        <div className="grid gap-3 md:grid-cols-2">
          {active.tips.map((tip) => (
            <div
              key={tip.lead}
              className="rounded-sm border border-hx-gold-dark/25 bg-hx-panel/40 p-3"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span className="hex-diamond shrink-0 opacity-80" aria-hidden />
                <span className="hex-label">{tip.lead}</span>
              </div>
              <p className="text-xs leading-relaxed text-hx-parchment/75 sm:text-sm">
                <GameTermText text={tip.text} yuumiKit markup />
              </p>
            </div>
          ))}
        </div>
      </div>
    </HextechPanel>
  );
}
