import { SupportMatchup } from '../types';

export const Blitzcrank: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    'Stay attached at max range — if your host is hooked, W-swap to them mid-travel and E shield before Power Fist knockup.',
    'Track hook CD (~20s early). Poke with empowered Q during the window after a miss when he walks up to threaten silence.',
    'Mikaels does not cleanse hook or knockup — mitigate with pre-E shield, Exhaust, or R slow waves after the grab lands.',
    'Ward second brush level 1 and track Hexflash; sit deeper when he leaves vision near walls.',
    'Do not detach for passive procs when hook trajectory is clear — only detach after Q is used or minions body-block.',
  ],
  recommendedRunes:
    'Guardian if ADC is immobile (Jhin, Aphelios); Aery + Scorch if you can safely punish missed hooks.',
  recommendedItems:
    'Moonstone into Redemption for R wave sustain in extended sieges. Ruby Crystal components before finishing mythic if all-ins are frequent.',
  earlyItems: ['Ruby Crystal for survivability', 'Boots on host for sidestepping'],
};
