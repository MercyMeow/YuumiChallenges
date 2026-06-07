/**
 * Domain types for the League of Legends Mythic Shop rotation.
 *
 * Riot does not expose a public API for the Mythic Shop, so the data is
 * ingested from the community-maintained League Wiki (see fetch-wiki-rotation).
 */

/** Inferred Mythic Shop section a given item belongs to. */
export type MythicShopSectionId = 'featured' | 'biweekly' | 'weekly' | 'daily';

/** A single purchasable entry in the Mythic Shop. */
export interface MythicShopItem {
  /** Display name, e.g. "Prestige PsyOps Ezreal". */
  name: string;
  /** Cost in Mythic Essence (ME). */
  cost: number;
  /** Section the item was bucketed into based on its cost. */
  section: MythicShopSectionId;
}

/** A group of items sharing the same section and reset cadence. */
export interface MythicShopSection {
  id: MythicShopSectionId;
  /** Human-readable label, e.g. "Bi-weekly". */
  label: string;
  /** Items in this section, in source order. */
  items: MythicShopItem[];
  /** ISO timestamp of the next reset for this section, if known. */
  nextResetAt: string | null;
}

/** Normalized payload returned by the rotation API. */
export interface MythicShopRotation {
  sections: MythicShopSection[];
  /** ISO timestamp when the data was fetched from the source. */
  fetchedAt: string;
  /** Provenance for the data, surfaced in the UI. */
  source: {
    name: string;
    url: string;
  };
  /** True when the payload was served from a stale cache after a fetch error. */
  stale: boolean;
}
