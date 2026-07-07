import { BotLaneSynergy } from '../types';

export const Heimerdinger: BotLaneSynergy = {
  synergy: 'Good',
  playstyle: 'Off-meta zone-control mage-bot; legit turret siege pick',
  tips: [
    'H-28 G Evolution Turret (Q) nests do not proc Ardent Censer-style on-hit effects from your heals—treat his turret damage as separate from your Best Friend on-hit bonuses.',
    'His rotations are very mana-hungry—E (Zoomies) is a premium mana battery here, so time it to refund the most when his bar is near empty.',
    'Buffer E (Zoomies) shield before he plants H-28 G Evolution Turret (Q) in melee range; the shield covers the vulnerable setup window.',
    'Chain your R (Final Chapter) slow into a landed CH-2 Electron Storm Grenade (E) stun to lock down a target for a full turret-and-rocket combo.',
    'Steer R (Final Chapter) through his turret nests during a siege for per-wave heals while he holds the zone with Hextech Micro-Rockets (W).',
  ],
  buildAdjustments: [
    'Staff of Flowing Water over Ardent Censer; turret damage does not benefit from the on-hit proc.',
    "Shurelya's Battlesong to reposition his turret setups faster during contested sieges.",
  ],
};
