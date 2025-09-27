import { SupportMatchup } from '../types';

export const Heimerdinger: SupportMatchup = {
  difficulty: 'Hard',
  tips: [
    'Do not detach inside turret zones. Ward first with Q from range; clear turrets only when he shows or jungler is nearby.',
    'Trade when he uses W or E on the wave - cooldowns are long; curve Q to tag him rather than turrets.',
    'Hold R to peel after his grenade stun connects; the slow waves deter follow-up dives in choke points.',
    "Shurelya's later helps your team exit turret mazes or chase through them after cooldowns are down.",
  ],
  recommendedRunes:
    'Aery + Scorch for poke; Resolve secondary Font of Life + Revitalize or Second Wind vs double poke.',
  recommendedItems:
    'Moonstone is often strong in extended fights; Redemption strong vs AoE poke. Staff if your team has AP scalers; Ardent for on-hit ADCs.',
  earlyItems: ['Forbidden Idol', 'Control Ward to contest lane brush'],
};
