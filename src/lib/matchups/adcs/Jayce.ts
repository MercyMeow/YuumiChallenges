import { BotLaneSynergy } from '../types';

export const Jayce: BotLaneSynergy = {
  synergy: 'Situational',
  playstyle: 'Off-meta stance-swap poke; unverified bot-lane presence',
  tips: [
    'Attach through Shock Blast (Q) poke exchanges in Mercury Cannon stance; low Ardent value means the on-hit item is not the payoff here.',
    'Buffer E (Zoomies) shield right before he pops Hyper Charge (W)—the empowered auto window is when he steps up and takes the most retaliation.',
    'His mana costs across both stances add up fast—E (Zoomies) refunds more the emptier his bar, so time it after a full poke rotation.',
    'Steer R (Final Chapter) to cover the stance swap itself; he is briefly exposed transforming between Mercury Cannon and Mercury Hammer mid-fight.',
    'Acceleration Gate (E) plus a dash-through ally can reposition him fast—stay ready to reattach with W (You and Me!) if he swaps to melee stance to engage.',
  ],
  buildAdjustments: [
    'Staff of Flowing Water over Ardent Censer; his on-hit uptime is too inconsistent between stance swaps.',
    "Mikael's Blessing vs CC that can interrupt him mid-transform between stances.",
  ],
};
