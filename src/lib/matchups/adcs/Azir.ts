import { BotLaneSynergy } from '../types';

export const Azir: BotLaneSynergy = {
  synergy: 'Situational',
  playstyle: 'Off-meta scaling mage-carry; essentially unplayed bot flex',
  tips: [
    'Attach directly to Azir rather than his Arise! (W) soldiers—only his own autos and abilities benefit from Best Friend bonuses.',
    'His soldier autos apply on-hit effects at reduced value against the primary target only, so treat Ardent Censer as a low-priority pick, not a core item.',
    'Buffer E (Zoomies) shield before he engages with Shifting Sands (E); the dash covers ground fast and the shield absorbs the return trip.',
    'Shifting Sands (E) does not restore his mana—his rotations are genuinely mana-hungry, so time E (Zoomies) casts to refund the most when his bar is empty.',
    'Steer R (Final Chapter) through his Conquering Sands (Q) zones during a siege; the wave heals keep him topped up while he holds soldier formations.',
  ],
  buildAdjustments: [
    'Staff of Flowing Water over Ardent Censer; his on-hit uptime through soldiers is too inconsistent for the auto-attack item.',
    "Shurelya's Battlesong to keep pace with his Emperor's Divide (R) engage and disengage timing.",
  ],
};
