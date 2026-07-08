'use client';

// Rich text for guide copy: every ability or item mention renders with its
// Data Dragon icon inline and a hextech tooltip on hover. Supersedes the
// plain color highlighter that used to live in matchup-visuals.tsx.
//
// Term sources:
// - Yuumi abilities (names, or bare Q/W/E/R letters in `yuumiKit` mode) —
//   icon + name/summary tooltip from the curated spell tips.
// - The matchup champion's abilities (`championSpells`) — exact icon
//   filenames from champion details, tooltip with cooldown/cost.
// - Items — icon by pinned Data Dragon id, tooltip from the item API.
// - Bare letters outside `yuumiKit` mode and summoner spells stay text-only
//   highlights: a bare "Q" in an enemy-support tip is ambiguous, and a wrong
//   icon is worse than none.

import { Fragment, useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  abilityImages,
  getChampionDetails,
  itemImages,
} from '@/lib/apis/datadragon';
import { useItem } from '@/hooks/use-item-data';
import { YUUMI_SPELL_TIPS } from '@/lib/guide/spell-tips';

/* ------------------------------------------------------------------ */
/* Shared champion spell data                                          */
/* ------------------------------------------------------------------ */

export type ChampionSpellInfo = {
  key: string;
  name: string;
  url: string;
  cooldown?: string;
  cost?: string;
};

/** Compresses Data Dragon burn strings ("50/55/60/65/70/75" → "50–75"). */
export function formatBurn(burn: string): string {
  const ranks = burn.split('/');
  const first = ranks[0] ?? burn;
  const last = ranks[ranks.length - 1];
  return ranks.length > 1 && last !== first ? `${first}–${last}` : first;
}

// One in-flight/settled fetch per champion for the whole session.
const championSpellsCache = new Map<string, Promise<ChampionSpellInfo[]>>();

function loadChampionSpells(champion: string): Promise<ChampionSpellInfo[]> {
  const cached = championSpellsCache.get(champion);
  if (cached) return cached;
  const promise = (async () => {
    const data = await getChampionDetails(champion);
    const icons: ChampionSpellInfo[] = [];
    if (data.passive) {
      icons.push({
        key: 'P',
        name: data.passive.name,
        url: await abilityImages.passive(data.passive.image.full),
      });
    }
    const keys = ['Q', 'W', 'E', 'R'] as const;
    for (const [index, spell] of (data.spells ?? []).slice(0, 4).entries()) {
      icons.push({
        key: keys[index] ?? '?',
        name: spell.name,
        url: await abilityImages.spell(spell.image.full),
        cooldown: formatBurn(spell.cooldownBurn),
        cost: formatBurn(spell.costBurn),
      });
    }
    return icons;
  })();
  championSpellsCache.set(champion, promise);
  promise.catch(() => championSpellsCache.delete(champion));
  return promise;
}

/**
 * Fetches (and caches) a champion's P/Q/W/E/R icons + stats. Callers must
 * remount per champion (key the owning component by champion) so state from
 * the previous selection never flashes while the new fetch resolves.
 */
export function useChampionSpells(
  champion: string
): ChampionSpellInfo[] | null {
  const [spells, setSpells] = useState<ChampionSpellInfo[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadChampionSpells(champion)
      .then((icons) => {
        if (!cancelled) setSpells(icons);
      })
      .catch(() => {
        if (!cancelled) setSpells([]);
      });
    return () => {
      cancelled = true;
    };
  }, [champion]);

  return spells;
}

/**
 * The champion's P/Q/W/E/R icons with tooltips — a quick visual reminder of
 * the kit you are playing against (or alongside). Renders a skeleton while
 * `spells` is null (still loading).
 */
export function ChampionSpellRow({
  spells,
}: {
  spells: ChampionSpellInfo[] | null;
}) {
  if (spells === null) {
    return (
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="h-6 w-6 animate-pulse rounded-sm bg-hx-panel/60"
          />
        ))}
      </div>
    );
  }
  if (spells.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {spells.map((spell) => (
        <Tooltip key={spell.key}>
          <TooltipTrigger asChild>
            <span className="relative cursor-help overflow-hidden rounded-sm border border-hx-gold-dark/40">
              <Image
                src={spell.url}
                alt={`${spell.key} — ${spell.name}`}
                width={24}
                height={24}
                className="h-6 w-6 object-cover"
              />
            </span>
          </TooltipTrigger>
          <SpellTooltipContent spell={spell} />
        </Tooltip>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Term registries                                                     */
/* ------------------------------------------------------------------ */

type YuumiKey = 'P' | 'Q' | 'W' | 'E' | 'R';

const YUUMI_ABILITY_NAMES: Record<YuumiKey, string> = {
  P: 'Feline Friendship',
  Q: 'Prowling Projectile',
  W: 'You and Me!',
  E: 'Zoomies',
  R: 'Final Chapter',
};

const YUUMI_SUMMARIES: Record<string, string> = Object.fromEntries(
  YUUMI_SPELL_TIPS.map((spell) => [spell.key, spell.summary])
);

function yuumiKeyForName(name: string): YuumiKey {
  const normalized = name.replace(/!/g, '');
  const entry = Object.entries(YUUMI_ABILITY_NAMES).find(
    ([, abilityName]) => abilityName.replace(/!/g, '') === normalized
  );
  return (entry?.[0] as YuumiKey | undefined) ?? 'P';
}

// Item ids pinned against Data Dragon 16.13 (verified by name lookup).
const ITEM_TERMS: ReadonlyArray<{
  id: number;
  name: string;
  pattern: string;
}> = [
  {
    id: 3222,
    name: "Mikael's Blessing",
    pattern: "Mikael[’']?s?(?: Blessing)?",
  },
  { id: 6617, name: 'Moonstone Renewer', pattern: 'Moonstone(?: Renewer)?' },
  { id: 3504, name: 'Ardent Censer', pattern: 'Ardent(?: Censer)?' },
  { id: 3870, name: 'Dream Maker', pattern: 'Dream Maker' },
  {
    id: 2065,
    name: "Shurelya's Battlesong",
    pattern: "Shurelya[’']?s?(?: Battlesong)?",
  },
  {
    id: 3190,
    name: 'Locket of the Iron Solari',
    pattern: 'Locket(?: of the Iron Solari)?',
  },
  { id: 3107, name: 'Redemption', pattern: 'Redemption' },
  {
    id: 6616,
    name: 'Staff of Flowing Water',
    pattern: 'Staff of Flowing Water|\\bStaff\\b',
  },
  { id: 4005, name: 'Imperial Mandate', pattern: 'Imperial Mandate' },
  { id: 6621, name: 'Dawncore', pattern: 'Dawncore' },
  {
    id: 3041,
    name: "Mejai's Soulstealer",
    pattern: "Mejai[’']?s?(?: Soulstealer)?",
  },
  { id: 3109, name: "Knight's Vow", pattern: "Knight[’']?s Vow" },
  { id: 6620, name: 'Echoes of Helia', pattern: 'Echoes of Helia' },
  { id: 4643, name: 'Vigilant Wardstone', pattern: 'Vigilant Wardstone' },
  { id: 2055, name: 'Control Ward', pattern: 'Control Wards?' },
  { id: 3114, name: 'Forbidden Idol', pattern: 'Forbidden Idol' },
  { id: 4642, name: 'Bandleglass Mirror', pattern: 'Bandleglass(?: Mirror)?' },
  { id: 3916, name: 'Oblivion Orb', pattern: 'Oblivion Orb' },
  {
    id: 3123,
    name: "Executioner's Calling",
    pattern: "Executioner[’']?s Calling",
  },
  { id: 3364, name: 'Oracle Lens', pattern: 'Oracle Lens' },
  { id: 3865, name: 'World Atlas', pattern: 'World Atlas' },
  { id: 3866, name: 'Runic Compass', pattern: 'Runic Compass' },
  { id: 3867, name: 'Bounty of Worlds', pattern: 'Bounty of Worlds' },
  {
    id: 3158,
    name: 'Ionian Boots of Lucidity',
    pattern: 'Ionian Boots(?: of Lucidity)?',
  },
];

const YUUMI_NAME_SRC =
  'Prowling Projectile|You and Me!?|Zoomies|Final Chapter|Feline Friendship';
const ITEM_SRC = ITEM_TERMS.map((item) => item.pattern).join('|');
const SUMMONER_SRC = '\\b(?:Flash|Exhaust|Ignite|Cleanse|Barrier)\\b';
// Matches nothing — placeholder when no champion spells are available.
const NEVER_SRC = '[^\\s\\S]';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ------------------------------------------------------------------ */
/* Inline term components                                              */
/* ------------------------------------------------------------------ */

const HEX_TOOLTIP =
  'max-w-64 border border-hx-gold-dark/60 bg-hx-black/95 px-3 py-2 text-xs text-hx-parchment shadow-lg';

function SpellTooltipContent({ spell }: { spell: ChampionSpellInfo }) {
  return (
    <TooltipContent className={HEX_TOOLTIP}>
      <div className="font-semibold text-hx-gold-bright">
        {spell.key === 'P' ? 'Passive' : spell.key} · {spell.name}
      </div>
      {(spell.cooldown || spell.cost) && (
        <div className="mt-0.5 text-hx-parchment/70">
          {spell.cooldown ? `Cooldown ${spell.cooldown}s` : null}
          {spell.cooldown && spell.cost ? ' · ' : null}
          {spell.cost ? `Cost ${spell.cost}` : null}
        </div>
      )}
    </TooltipContent>
  );
}

function TermChip({
  iconUrl,
  display,
  color,
  tooltip,
}: {
  iconUrl: string | null;
  display: string;
  color: 'gold' | 'magic';
  tooltip: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={
            color === 'gold'
              ? 'cursor-help font-semibold text-hx-gold-bright'
              : 'cursor-help font-semibold text-hx-magic-bright'
          }
        >
          {iconUrl ? (
            <Image
              src={iconUrl}
              alt=""
              width={16}
              height={16}
              className="-mt-0.5 mr-1 inline-block h-4 w-4 rounded-[3px] border border-hx-gold-dark/50 align-middle"
            />
          ) : null}
          {display}
        </span>
      </TooltipTrigger>
      {tooltip}
    </Tooltip>
  );
}

// Yuumi spell icon URLs resolve once per session.
let yuumiUrlsPromise: Promise<Record<YuumiKey, string>> | null = null;
function loadYuumiUrls(): Promise<Record<YuumiKey, string>> {
  yuumiUrlsPromise ??= (async () => ({
    P: await abilityImages.passive('YuumiP2.png'),
    Q: await abilityImages.spell('YuumiQ.png'),
    W: await abilityImages.spell('YuumiW.png'),
    E: await abilityImages.spell('YuumiE.png'),
    R: await abilityImages.spell('YuumiR.png'),
  }))();
  return yuumiUrlsPromise;
}

function useYuumiSpellUrls(): Record<YuumiKey, string> | null {
  const [urls, setUrls] = useState<Record<YuumiKey, string> | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadYuumiUrls()
      .then((resolved) => {
        if (!cancelled) setUrls(resolved);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  return urls;
}

function YuumiAbilityTerm({
  ability,
  display,
}: {
  ability: YuumiKey;
  display: string;
}) {
  const urls = useYuumiSpellUrls();
  return (
    <TermChip
      iconUrl={urls?.[ability] ?? null}
      display={display}
      color="gold"
      tooltip={
        <TooltipContent className={HEX_TOOLTIP}>
          <div className="font-semibold text-hx-gold-bright">
            {ability === 'P' ? 'Passive' : ability} ·{' '}
            {YUUMI_ABILITY_NAMES[ability]}
          </div>
          <div className="mt-0.5 text-hx-parchment/70">
            {YUUMI_SUMMARIES[ability]}
          </div>
        </TooltipContent>
      }
    />
  );
}

function ChampionAbilityTerm({
  spell,
  display,
}: {
  spell: ChampionSpellInfo;
  display: string;
}) {
  return (
    <TermChip
      iconUrl={spell.url}
      display={display}
      color="gold"
      tooltip={<SpellTooltipContent spell={spell} />}
    />
  );
}

function ItemTerm({
  id,
  name,
  display,
}: {
  id: number;
  name: string;
  display: string;
}) {
  const { item, stripHtml } = useItem(id);
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    itemImages
      .icon(String(id))
      .then((url) => {
        if (!cancelled) setIconUrl(url);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [id]);

  const blurb = item ? stripHtml(item.description).slice(0, 140) : null;

  return (
    <TermChip
      iconUrl={iconUrl}
      display={display}
      color="magic"
      tooltip={
        <TooltipContent className={HEX_TOOLTIP}>
          <div className="font-semibold text-hx-gold-bright">
            {item?.name ?? name}
          </div>
          {item?.gold?.total ? (
            <div className="text-hx-gold/80">{item.gold.total} gold</div>
          ) : null}
          {blurb ? (
            <div className="mt-0.5 text-hx-parchment/70">{blurb}</div>
          ) : null}
        </TooltipContent>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Tokenizer + renderer                                                */
/* ------------------------------------------------------------------ */

function renderTerms(
  text: string,
  championSpells: ChampionSpellInfo[] | null | undefined,
  yuumiKit: boolean,
  keyPrefix: string
): ReactNode[] {
  const champSrc = championSpells?.length
    ? [...championSpells]
        .sort((a, b) => b.name.length - a.name.length)
        .map((spell) => `${escapeRegExp(spell.name)}(?:\\s*\\([PQWER]\\))?`)
        .join('|')
    : NEVER_SRC;

  // Group order doubles as match priority at equal positions.
  const regex = new RegExp(
    `(\\b[QWER]\\s*\\((?:${YUUMI_NAME_SRC})\\))` + // 1: "W (You and Me!)"
      `|(${YUUMI_NAME_SRC})` + // 2: Yuumi spell name
      `|(${champSrc})` + // 3: matchup champion spell name
      `|(${ITEM_SRC})` + // 4: item name
      `|(\\b[QWER]\\b)` + // 5: bare ability letter
      `|(${SUMMONER_SRC}|Best Friend)`, // 6: text-only highlights
    'g'
  );

  const nodes: ReactNode[] = [];
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(
        <Fragment key={`${keyPrefix}-${last}`}>
          {text.slice(last, match.index)}
        </Fragment>
      );
    }
    const term = match[0];
    const key = `${keyPrefix}-${match.index}`;
    if (match[1] !== undefined) {
      nodes.push(
        <YuumiAbilityTerm
          key={key}
          ability={term[0] as YuumiKey}
          display={term}
        />
      );
    } else if (match[2] !== undefined) {
      nodes.push(
        <YuumiAbilityTerm
          key={key}
          ability={yuumiKeyForName(term)}
          display={term}
        />
      );
    } else if (match[3] !== undefined) {
      const parenKey = /\(([PQWER])\)\s*$/.exec(term)?.[1];
      const namePart = term.replace(/\s*\([PQWER]\)\s*$/, '');
      const spell =
        championSpells?.find((s) =>
          parenKey ? s.key === parenKey : s.name === namePart
        ) ?? championSpells?.find((s) => s.name === namePart);
      if (spell) {
        nodes.push(
          <ChampionAbilityTerm key={key} spell={spell} display={term} />
        );
      } else {
        nodes.push(
          <span key={key} className="font-semibold text-hx-gold-bright">
            {term}
          </span>
        );
      }
    } else if (match[4] !== undefined) {
      const entry = ITEM_TERMS.find((item) =>
        new RegExp(`^(?:${item.pattern})$`).test(term)
      );
      if (entry) {
        nodes.push(
          <ItemTerm key={key} id={entry.id} name={entry.name} display={term} />
        );
      } else {
        nodes.push(
          <span key={key} className="font-semibold text-hx-magic-bright">
            {term}
          </span>
        );
      }
    } else if (match[5] !== undefined && yuumiKit) {
      nodes.push(
        <YuumiAbilityTerm key={key} ability={term as YuumiKey} display={term} />
      );
    } else {
      nodes.push(
        <span key={key} className="font-semibold text-hx-gold-bright">
          {term}
        </span>
      );
    }
    last = match.index + term.length;
  }
  nodes.push(
    <Fragment key={`${keyPrefix}-${last}`}>{text.slice(last)}</Fragment>
  );
  return nodes;
}

/**
 * Guide copy with live game terms: ability/item mentions get inline icons
 * and hover tooltips.
 *
 * - `yuumiKit`: bare Q/W/E/R letters refer to Yuumi (ability guide, quick
 *   tips). Off by default — in matchup tips a bare letter may be the enemy's.
 * - `championSpells`: the matchup champion's kit, enabling icons for their
 *   spell names ("Flay", "Drain (W)").
 * - `markup`: `**text**` segments render gold-emphasized (curated tips).
 */
export function GameTermText({
  text,
  championSpells,
  yuumiKit = false,
  markup = false,
}: {
  text: string;
  championSpells?: ChampionSpellInfo[] | null;
  yuumiKit?: boolean;
  markup?: boolean;
}) {
  if (!markup) {
    return <>{renderTerms(text, championSpells, yuumiKit, 't')}</>;
  }
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, index) =>
        index % 2 === 1 ? (
          <span key={index} className="font-semibold text-hx-gold-bright">
            {renderTerms(part, championSpells, yuumiKit, `b${index}`)}
          </span>
        ) : (
          <Fragment key={index}>
            {renderTerms(part, championSpells, yuumiKit, `p${index}`)}
          </Fragment>
        )
      )}
    </>
  );
}
