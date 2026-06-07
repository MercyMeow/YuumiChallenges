/**
 * Domain types for the League of Legends Mythic Shop.
 *
 * Riot exposes no public API for the shop's live contents, and the in-game
 * client is the source of truth. We therefore only model the reset cadence of
 * each section (computed locally) and link out for the actual item list.
 */

/** A Mythic Shop section, ordered by its reset cadence. */
export type MythicShopSectionId = 'featured' | 'biweekly' | 'weekly' | 'daily';
