import { SupportMatchup } from '../types';

export const Braum: SupportMatchup = {
  difficulty: 'Hard',
  tips: [
    "Respect Concussive Blows — detach only when your host has zero stacks, since Winter's Bite (Q) plus autos stun on the fourth stack.",
    'Do not commit Final Chapter into Unbreakable (E) — it intercepts your R waves and Prowling Projectile. Bait the wall out or wait for it to expire before channeling.',
    'Your Q is mouse-steerable — curve it around the Unbreakable (E) shield angle instead of throwing it straight into the wall.',
    'Stand Behind Me (W) only dashes to allies or minions — once he jumps in he has no gap closer left; punish immediately with empowered Q from max range.',
    "Mikael's Blessing cleanses the Concussive Blows stun but NOT the Glacial Fissure (R) knock-up. Exhaust his ADC in all-ins, not Braum.",
  ],
  recommendedRunes:
    'Aery + Manaflow + Transcendence. Resolve Bone Plating vs Draven/burst ADC; Revitalize for longer shield trades.',
  recommendedItems:
    "Moonstone Renewer core into Ardent Censer once carries itemize. Mikael's Blessing mid-value here — it answers his passive stun but not the R knock-up.",
  earlyItems: [
    'Boots on host to kite Braum autos',
    'Control Ward for brush control',
  ],
};
