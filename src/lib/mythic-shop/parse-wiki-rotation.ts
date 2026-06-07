/**
 * Parses the wikitext of the League Wiki "Mythic Shop Rotation" page into
 * structured sections.
 *
 * Each shop entry is a `{{Mythic_Shop_Rotation}}` template, e.g.:
 *
 *   {{Mythic_Shop_Rotation
 *   |header = {{ME|150}}
 *   |image = Cassiopeia_PrestigeMythmakerTile.jpg
 *   |date = Patch 25.02 - 25.04
 *   |title = Prestige Mythmaker Cassiopeia (+ Border and Icon)
 *   |description=
 *   }}
 *
 * We only read the "Current" block (parsing stops at the "Upcoming" block) and
 * bucket entries into sections by their Mythic Essence cost, since the wikitext
 * does not label the daily/weekly/bi-weekly tiers explicitly.
 */

import type {
  MythicShopItem,
  MythicShopSection,
  MythicShopSectionId,
} from './types';
import { getNextResetForSection } from './reset-schedule';

const UPCOMING_MARKER = 'Upcoming Mythic Shop Rotation';

// Captures the ME cost and the title within a single template block. The lazy
// gap keeps each ME header paired with the title in the same template.
const ENTRY_REGEX = /\{\{ME\|(\d+)\}\}[\s\S]*?\|\s*title\s*=\s*([^\n|}]+)/g;

const SECTION_LABELS: Record<MythicShopSectionId, string> = {
  featured: 'Featured',
  biweekly: 'Bi-weekly',
  weekly: 'Weekly',
  daily: 'Daily',
};

const SECTION_ORDER: MythicShopSectionId[] = [
  'featured',
  'biweekly',
  'weekly',
  'daily',
];

/** Buckets an item into a section based on its Mythic Essence cost. */
function sectionForCost(cost: number): MythicShopSectionId {
  if (cost >= 250) return 'featured';
  if (cost >= 100) return 'biweekly';
  if (cost >= 35) return 'weekly';
  return 'daily';
}

/** Strips wiki link markup and surrounding whitespace from a title. */
function normalizeName(raw: string): string {
  return raw
    .replace(/\[\[[^\]|]*\|/g, '')
    .replace(/[[\]]/g, '')
    .replace(/'''?/g, '')
    .trim();
}

/**
 * Parses the rotation wikitext into Mythic Shop sections.
 *
 * @param wikitext Raw wikitext from the MediaWiki `parse` API.
 * @param now Current time used to compute section reset timestamps.
 */
export function parseWikiRotation(
  wikitext: string,
  now: Date
): MythicShopSection[] {
  const upcomingIndex = wikitext.indexOf(UPCOMING_MARKER);
  const currentBlock =
    upcomingIndex === -1 ? wikitext : wikitext.slice(0, upcomingIndex);

  const itemsBySection = new Map<MythicShopSectionId, MythicShopItem[]>();

  for (const match of currentBlock.matchAll(ENTRY_REGEX)) {
    const cost = Number.parseInt(match[1] ?? '', 10);
    const name = normalizeName(match[2] ?? '');
    if (!Number.isFinite(cost) || !name) {
      continue;
    }

    const section = sectionForCost(cost);
    const bucket = itemsBySection.get(section) ?? [];
    bucket.push({ name, cost, section });
    itemsBySection.set(section, bucket);
  }

  return SECTION_ORDER.flatMap((id) => {
    const items = itemsBySection.get(id);
    if (!items || items.length === 0) {
      return [];
    }
    const section: MythicShopSection = {
      id,
      label: SECTION_LABELS[id],
      items,
      nextResetAt: getNextResetForSection(id, now),
    };
    return [section];
  });
}
