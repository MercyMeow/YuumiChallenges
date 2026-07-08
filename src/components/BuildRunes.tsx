'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRuneData } from '@/hooks/use-rune-data';
import type { RuneTree } from '@/lib/apis/datadragon';
import {
  RUNE_STYLE_NAMES,
  type AutoBuildRunePage,
} from '@/lib/builds/auto-build-shared';
import { cn } from '@/lib/utils';

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
  MoveSpeed: {
    name: 'Move Speed',
    icon: 'perk-images/StatMods/StatModsMovementSpeedIcon.png',
  },
  HealthScaling: {
    name: 'Health (scaling)',
    icon: 'perk-images/StatMods/StatModsHealthScalingIcon.png',
  },
  Health: {
    name: 'Health',
    icon: 'perk-images/StatMods/StatModsHealthPlusIcon.png',
  },
  TenacitySlowResist: {
    name: 'Tenacity & Slow Resist',
    icon: 'perk-images/StatMods/StatModsTenacityIcon.png',
  },
  Armor: {
    name: 'Armor',
    icon: 'perk-images/StatMods/StatModsArmorIcon.png',
  },
  MagicRes: {
    name: 'Magic Resist',
    icon: 'perk-images/StatMods/StatModsMagicResIcon.png',
  },
};

// The shard grid as laid out in the League client (offense / flex / defense).
// Build data stores one key per row, so highlighting is positional.
const SHARD_ROWS: string[][] = [
  ['AdaptiveForce', 'AttackSpeed', 'AbilityHaste'],
  ['AdaptiveForce', 'MoveSpeed', 'HealthScaling'],
  ['Health', 'TenacitySlowResist', 'HealthScaling'],
];

// Shape mirrors the `runes` field of a guide Build (see src/app/page.tsx).
export interface BuildRunesData {
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

/** Converts a scraped OP.GG rune page into the build rune-page shape. */
function pageToRunesData(
  page: AutoBuildRunePage,
  fallback: BuildRunesData
): BuildRunesData {
  return {
    name: page.keystone.name,
    primaryTree: RUNE_STYLE_NAMES[page.primaryStyleId] ?? fallback.primaryTree,
    keystone: page.keystone.key,
    primary: page.primary.map((rune) => rune.key),
    secondaryTree:
      RUNE_STYLE_NAMES[page.secondaryStyleId] ?? fallback.secondaryTree,
    secondary: page.secondary.map((rune) => rune.key),
    shards: page.shardKeys,
  };
}

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

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
      <span className="rounded-sm bg-hx-gold/10 px-1.5 py-0.5 text-xs text-hx-gold/80">
        {fallbackLabel}
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="relative overflow-hidden rounded-full bg-hx-black/70 ring-1 ring-hx-gold-dark/60"
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
      <TooltipContent className="border-hx-gold-dark/70 bg-hx-black/95 text-hx-parchment">
        {entry.name}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * One cell of the client-style rune grid: full colour + gold ring when
 * selected, dimmed greyscale otherwise — like the in-game rune page.
 */
function GridRune({
  entry,
  selected,
  size,
}: {
  entry: RuneEntry;
  selected: boolean;
  size: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'relative overflow-hidden rounded-full transition-all duration-200',
            selected
              ? 'bg-hx-black shadow-[0_0_10px_oklch(var(--hx-gold)_/_0.45)] ring-2 ring-hx-gold-bright'
              : 'bg-hx-black/60 opacity-30 ring-1 ring-hx-gold-dark/30 grayscale'
          )}
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
      <TooltipContent className="border-hx-gold-dark/70 bg-hx-black/95 text-hx-parchment">
        {entry.name}
      </TooltipContent>
    </Tooltip>
  );
}

/** Column header: small tree icon + tree name. */
function TreeHeader({
  entry,
  label,
  magic = false,
}: {
  entry: RuneEntry | undefined;
  label: string;
  magic?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center justify-center gap-2">
      <RuneIcon entry={entry} fallbackLabel={label} size={18} />
      <span className={cn('hex-label', magic && 'text-hx-magic')}>{label}</span>
    </div>
  );
}

/**
 * A rune tree rendered like the League client: every rune of every slot row
 * shown, with the picked ones highlighted. `slotOffset` skips the keystone
 * row for secondary trees.
 */
function TreeGrid({
  tree,
  selectedKeys,
  slotOffset,
}: {
  tree: RuneTree;
  selectedKeys: Set<string>;
  slotOffset: number;
}) {
  return (
    <div className="space-y-2.5">
      {tree.slots.slice(slotOffset).map((slot, rowIndex) => (
        <div
          key={rowIndex}
          className={cn(
            'flex items-center justify-center gap-2',
            slotOffset === 0 &&
              rowIndex === 0 &&
              'border-b border-hx-gold-dark/30 pb-2.5'
          )}
        >
          {slot.runes.map((rune) => (
            <GridRune
              key={rune.key}
              entry={rune}
              selected={selectedKeys.has(rune.key)}
              size={slotOffset === 0 && rowIndex === 0 ? 34 : 26}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Flat selected-runes row — fallback when the tree lookup fails. */
function FlatRuneRow({
  keys,
  runeByKey,
  keystoneKey,
}: {
  keys: string[];
  runeByKey: Map<string, RuneEntry>;
  keystoneKey?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {keys.map((key, i) => (
        <RuneIcon
          key={`${key}-${i}`}
          entry={runeByKey.get(key)}
          fallbackLabel={key}
          size={key === keystoneKey ? 34 : 26}
        />
      ))}
    </div>
  );
}

/**
 * Tab strip listing every viable rune page (most-picked first) with its
 * OP.GG stats, styled after the client/OP.GG rune-page switcher.
 */
function RunePageTabs({
  pages,
  activeIndex,
  onSelect,
  treeByKey,
  fallback,
}: {
  pages: AutoBuildRunePage[];
  activeIndex: number;
  onSelect: (index: number) => void;
  treeByKey: Map<string, RuneEntry>;
  fallback: BuildRunesData;
}) {
  return (
    <div className="mb-4 flex hex-scroll gap-2 overflow-x-auto pb-1">
      {pages.map((page, index) => {
        const isActive = index === activeIndex;
        const primaryTree = treeByKey.get(
          RUNE_STYLE_NAMES[page.primaryStyleId] ?? fallback.primaryTree
        );
        const secondaryTree = treeByKey.get(
          RUNE_STYLE_NAMES[page.secondaryStyleId] ?? fallback.secondaryTree
        );
        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            aria-pressed={isActive}
            className={cn(
              'flex shrink-0 items-center gap-2.5 rounded-sm border px-3 py-1.5 text-left transition-all duration-200',
              isActive
                ? 'border-hx-gold bg-hx-gold/10'
                : 'border-hx-gold-dark/40 bg-hx-black/40 opacity-60 hover:border-hx-gold-dark hover:opacity-100'
            )}
          >
            <span className="flex items-center gap-1">
              {primaryTree && (
                <Image
                  src={`${DDRAGON_IMG_BASE}/${primaryTree.icon}`}
                  alt={primaryTree.name}
                  width={16}
                  height={16}
                />
              )}
              <Image
                src={`${DDRAGON_IMG_BASE}/${page.keystone.icon}`}
                alt={page.keystone.name}
                width={28}
                height={28}
              />
              {secondaryTree && (
                <Image
                  src={`${DDRAGON_IMG_BASE}/${secondaryTree.icon}`}
                  alt={secondaryTree.name}
                  width={16}
                  height={16}
                />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-hx-parchment">
                {formatPercent(page.pickRate)}
              </span>
              <span className="block text-[10px] whitespace-nowrap text-hx-parchment/50">
                {page.games.toLocaleString('en-US')} games
              </span>
            </span>
            <span
              className={cn(
                'text-xs font-semibold',
                page.winRate >= 0.5
                  ? 'text-accessible-blue'
                  : 'text-hx-parchment/70'
              )}
            >
              {formatPercent(page.winRate)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Renders a build's rune page like the in-game rune editor: the full primary
 * and secondary trees plus the shard grid, with picked runes highlighted and
 * the rest dimmed. When scraped OP.GG rune pages are provided, a tab strip
 * lets visitors flip through every viable page with its pick/win stats.
 * Rune identifiers in the build data match the Data Dragon `key` field.
 */
export function BuildRunes({
  runes,
  runePages,
}: {
  runes: BuildRunesData;
  runePages?: AutoBuildRunePage[] | undefined;
}) {
  const { runeTrees, loading } = useRuneData();
  const [pageIndex, setPageIndex] = useState(0);

  const runeByKey = new Map<string, RuneEntry>();
  const treeByKey = new Map<string, RuneEntry>();
  const trees = new Map<string, RuneTree>();
  for (const tree of runeTrees) {
    treeByKey.set(tree.key, { name: tree.name, icon: tree.icon });
    trees.set(tree.key, tree);
    for (const slot of tree.slots) {
      for (const rune of slot.runes) {
        runeByKey.set(rune.key, { name: rune.name, icon: rune.icon });
      }
    }
  }

  const pages = runePages ?? [];
  const activePage = pages[Math.min(pageIndex, pages.length - 1)];
  const active = activePage ? pageToRunesData(activePage, runes) : runes;

  const primaryTree = trees.get(active.primaryTree);
  const secondaryTree = trees.get(active.secondaryTree);
  const primarySelected = new Set([active.keystone, ...active.primary]);
  const secondarySelected = new Set(active.secondary);
  const primaryRunes = [active.keystone, ...active.primary];

  return (
    <div className="rounded-sm p-4 hex-card-inset">
      {pages.length > 1 && (
        <RunePageTabs
          pages={pages}
          activeIndex={pageIndex}
          onSelect={setPageIndex}
          treeByKey={treeByKey}
          fallback={runes}
        />
      )}

      <div className="mb-4 text-center">
        <span className="hex-chip">{active.name}</span>
      </div>

      {loading ? (
        <div className="flex flex-wrap gap-2">
          {[...primaryRunes, ...active.secondary].map((_, i) => (
            <div
              key={i}
              className="h-7 w-7 animate-pulse rounded-full bg-white/10"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-6">
          {/* Primary tree */}
          <div>
            <TreeHeader
              entry={treeByKey.get(active.primaryTree)}
              label={active.primaryTree}
            />
            {primaryTree ? (
              <TreeGrid
                tree={primaryTree}
                selectedKeys={primarySelected}
                slotOffset={0}
              />
            ) : (
              <FlatRuneRow
                keys={primaryRunes}
                runeByKey={runeByKey}
                keystoneKey={active.keystone}
              />
            )}
          </div>

          {/* Secondary tree */}
          <div>
            <TreeHeader
              entry={treeByKey.get(active.secondaryTree)}
              label={active.secondaryTree}
              magic
            />
            {secondaryTree ? (
              <TreeGrid
                tree={secondaryTree}
                selectedKeys={secondarySelected}
                slotOffset={1}
              />
            ) : (
              <FlatRuneRow keys={active.secondary} runeByKey={runeByKey} />
            )}
          </div>

          {/* Stat shards */}
          <div>
            <div className="mb-3 text-center hex-label opacity-70">Shards</div>
            <div className="space-y-2.5">
              {SHARD_ROWS.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex items-center justify-center gap-2"
                >
                  {row.map((shardKey) => {
                    const entry = STAT_SHARDS[shardKey];
                    if (!entry) return null;
                    return (
                      <GridRune
                        key={shardKey}
                        entry={entry}
                        selected={active.shards[rowIndex] === shardKey}
                        size={22}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
