'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRuneData } from '@/hooks/use-rune-data';

const DDRAGON_IMG_BASE = 'https://ddragon.leagueoflegends.com/cdn/img';

// Stat shards aren't part of the rune tree JSON, so map their identifiers to
// the Data Dragon stat-mod icons (and readable labels) directly.
const STAT_SHARDS: Record<string, { name: string; icon: string }> = {
  AdaptiveForce: {
    name: 'Adaptive Force',
    icon: 'perk-images/StatMods/StatModsAdaptiveForceIcon.png',
  },
  AbilityHaste: {
    name: 'Ability Haste',
    icon: 'perk-images/StatMods/StatModsCDRScalingIcon.png',
  },
  AttackSpeed: {
    name: 'Attack Speed',
    icon: 'perk-images/StatMods/StatModsAttackSpeedIcon.png',
  },
  HealthScaling: {
    name: 'Health (scaling)',
    icon: 'perk-images/StatMods/StatModsHealthScalingIcon.png',
  },
  Health: {
    name: 'Health',
    icon: 'perk-images/StatMods/StatModsHealthPlusIcon.png',
  },
  Armor: {
    name: 'Armor',
    icon: 'perk-images/StatMods/StatModsArmorIcon.png',
  },
  MagicRes: {
    name: 'Magic Resist',
    icon: 'perk-images/StatMods/StatModsMagicResIcon.png',
  },
  Tenacity: {
    name: 'Tenacity',
    icon: 'perk-images/StatMods/StatModsTenacityIcon.png',
  },
};

// Shape mirrors the `runes` field of a guide Build (see src/app/page.tsx).
interface BuildRunesData {
  name: string;
  primaryTree: string;
  keystone: string;
  primary: string[];
  secondaryTree: string;
  secondary: string[];
  shards: string[];
}

interface RuneEntry {
  name: string;
  icon: string;
}

/** Renders a single rune icon with a name tooltip, falling back to a text chip. */
function RuneIcon({
  entry,
  fallbackLabel,
  size,
}: {
  entry: RuneEntry | undefined;
  fallbackLabel: string;
  size: number;
}) {
  if (!entry) {
    return (
      <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/70">
        {fallbackLabel}
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="relative overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10"
          style={{ width: size, height: size }}
        >
          <Image
            src={`${DDRAGON_IMG_BASE}/${entry.icon}`}
            alt={entry.name}
            width={size}
            height={size}
            className="h-full w-full object-contain"
            sizes={`${size}px`}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent className="border-purple-500/30 bg-black/85 text-white">
        {entry.name}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Renders a build's rune page using Data Dragon icons (with name tooltips)
 * instead of plain text. Rune identifiers in the build data match the
 * Data Dragon `key` field, so we look them up directly.
 */
export function BuildRunes({ runes }: { runes: BuildRunesData }) {
  const { runeTrees, loading } = useRuneData();

  const runeByKey = new Map<string, RuneEntry>();
  const treeByKey = new Map<string, RuneEntry>();
  for (const tree of runeTrees) {
    treeByKey.set(tree.key, { name: tree.name, icon: tree.icon });
    for (const slot of tree.slots) {
      for (const rune of slot.runes) {
        runeByKey.set(rune.key, { name: rune.name, icon: rune.icon });
      }
    }
  }

  const primaryRunes = [runes.keystone, ...runes.primary];

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-center">
        <Badge className="bg-purple-600">{runes.name}</Badge>
      </div>

      {loading ? (
        <div className="flex flex-wrap gap-2">
          {[...primaryRunes, ...runes.secondary].map((_, i) => (
            <div
              key={i}
              className="h-7 w-7 animate-pulse rounded-full bg-white/10"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4 text-sm text-white/80">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <RuneIcon
                entry={treeByKey.get(runes.primaryTree)}
                fallbackLabel={runes.primaryTree}
                size={20}
              />
              <span className="text-yellow-300">{runes.primaryTree}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pl-1">
              {primaryRunes.map((key, i) => (
                <RuneIcon
                  key={`${key}-${i}`}
                  entry={runeByKey.get(key)}
                  fallbackLabel={key}
                  size={i === 0 ? 36 : 28}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <RuneIcon
                entry={treeByKey.get(runes.secondaryTree)}
                fallbackLabel={runes.secondaryTree}
                size={20}
              />
              <span className="text-green-300">{runes.secondaryTree}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pl-1">
              {runes.secondary.map((key, i) => (
                <RuneIcon
                  key={`${key}-${i}`}
                  entry={runeByKey.get(key)}
                  fallbackLabel={key}
                  size={28}
                />
              ))}
            </div>
          </div>

          {runes.shards.length > 0 && (
            <div>
              <div className="mb-2 text-white/60">Shards</div>
              <div className="flex flex-wrap items-center gap-2 pl-1">
                {runes.shards.map((key, i) => (
                  <RuneIcon
                    key={`${key}-${i}`}
                    entry={STAT_SHARDS[key]}
                    fallbackLabel={key}
                    size={24}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
