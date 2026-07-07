import { BotLaneSynergy } from '../types';

export const Akshan: BotLaneSynergy = {
  synergy: 'Situational',
  playstyle: 'Off-meta ability-based skirmisher; sub-1% bot pick',
  tips: [
    'Attach for laning trades, but expect to hold on through Heroic Swing (E)—the anchor-and-swing arc carries him away from easy reattach windows mid-combo.',
    'Buffer E (Zoomies) shield before he commits Heroic Swing (E) into a trade; the shield covers the vulnerable second and third cast if the swing whiffs.',
    'His third Dirty Fighting (P) proc plus a landed Avengerang (Q) is the real burst window—time Exhaust on the target he Avengerang (Q) marks, not on cooldown.',
    'Steer R (Final Chapter) to cover his Comeuppance (R) channel; the stored-bullet windup leaves him stationary and exposed to engage.',
    'W on-hit healing is low value here—Dirty Fighting (P) attacks are inconsistent autos, so lean on E shield and R slows over expecting steady sustain.',
  ],
  buildAdjustments: [
    'Staff of Flowing Water over Ardent Censer; his on-hit uptime from Dirty Fighting (P) is too irregular to justify the auto-attack item.',
    "Mikael's Blessing vs hard CC that can interrupt his Comeuppance (R) channel before it fires.",
  ],
};
