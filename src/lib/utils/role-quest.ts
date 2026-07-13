/**
 * Season 2026 role quests (patch 26.1).
 *
 * Every role has a quest, but only two of them use the role-bound item
 * slot that match-v5 reports as `participant.roleBoundItem`:
 *
 * - BOTTOM: boots move into the slot on quest completion.
 * - UTILITY: the slot stores Control Wards.
 *
 * Top (Unleashed Teleport + level 20), jungle (upgraded Smite + move
 * speed) and mid (tier 3 boots upgrade + empowered Recall) get buffs
 * instead, so their slot never holds an item and should not be shown.
 */

/** Roles whose quest reward occupies the role-bound slot. */
const ROLE_QUEST_SLOT_LABELS: Record<string, string> = {
  BOTTOM: 'Lane quest slot · Boots',
  UTILITY: 'Role quest slot · Control Wards',
};

export interface RoleBoundSlot {
  /** Item currently in the slot; 0 while the quest is incomplete. */
  itemId: number;
  /** Human-readable slot description (shown while the slot is empty). */
  label: string;
}

interface RoleBoundSlotSource {
  roleBoundItem?: number | undefined;
  teamPosition?: string | undefined;
  individualPosition?: string | undefined;
}

/**
 * Resolves a participant's role-bound (lane quest) slot.
 *
 * Returns null when the slot should not be rendered: pre-2026 matches
 * (field absent) and roles whose quest never places an item there. A
 * non-zero item is always shown even for unexpected roles, so the UI
 * stays truthful if Riot extends the system.
 */
export function getRoleBoundSlot(
  participant: RoleBoundSlotSource
): RoleBoundSlot | null {
  const itemId = participant.roleBoundItem;
  if (typeof itemId !== 'number') return null;

  const position =
    participant.teamPosition || participant.individualPosition || '';
  const label = ROLE_QUEST_SLOT_LABELS[position.toUpperCase()];

  if (itemId > 0) {
    return { itemId, label: label ?? 'Role quest slot' };
  }
  // Empty slot: only meaningful for roles whose quest fills it.
  return label ? { itemId: 0, label } : null;
}
