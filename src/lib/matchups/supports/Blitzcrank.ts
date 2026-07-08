import { SupportMatchup } from '../types';

export const Blitzcrank: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    'Stay attached — Rocket Grab (Q) can never hit an attached Yuumi. If your host gets hooked, E shield instantly during the pull and Exhaust before Power Fist (E) connects.',
    'Track Rocket Grab (Q) cooldown (~20s early). Poke with empowered Q in the window after a miss, when he walks up to threaten the Static Field (R) silence.',
    "Mikael's Blessing cleanses the Rocket Grab (Q) stun but NOT the Power Fist (E) knock-up (airborne) — save it for the hook chain into E, not the knock-up itself.",
    'Ward the second brush at level 1 and track Hexflash; sit deeper when he leaves vision near walls.',
    'Do not detach for passive procs when his hook trajectory to you is clear — only detach after Rocket Grab (Q) is used or minions body-block the line.',
  ],
  recommendedRunes:
    'Guardian if ADC is immobile (Jhin, Aphelios); Aery + Scorch if you can safely punish missed hooks.',
  recommendedItems:
    'Moonstone Renewer into Redemption for R wave sustain in extended sieges. Rush the Kindlegem health component first if all-ins are frequent.',
  earlyItems: [
    'Ruby Crystal for survivability',
    'Control Ward for the hook brush',
  ],
};
