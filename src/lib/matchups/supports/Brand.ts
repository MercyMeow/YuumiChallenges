import { SupportMatchup } from '../types';

export const Brand: SupportMatchup = {
  difficulty: 'Easy',
  tips: [
    'Stay attached — an attached Yuumi is untargetable, so Pillar of Flame (W) and Sear (Q) simply cannot hit you. Only detach for wards when his combo is on cooldown.',
    'Sear (Q) only stuns targets that are already Ablaze — after Pillar of Flame (W) or Conflagration (E) tags your host, expect the follow-up Q and E shield through it or sidestep.',
    'Watch Blaze stacks on your host: at 3 stacks the passive detonates in an AoE, so ping them to space away from teammates before it pops.',
    'Being attached removes you as a bounce target — Pyroclasm (R) has fewer bodies to ping-pong between, so keep your host spread from allies and layer R slow waves to disengage.',
    'When detached, keep minions between you and Brand — Sear (Q) stops on the first unit hit, and his long cooldowns afterward are your empowered Q poke window.',
  ],
  recommendedRunes:
    'Aery + Scorch for lane trades. Resolve Second Wind if double poke lane (Brand + mage ADC).',
  recommendedItems:
    "Moonstone Renewer into Staff of Flowing Water or Ardent Censer by carry scaling. Mikael's Blessing low priority — his stun is combo-gated, so E shield timing matters more.",
  earlyItems: [
    'Null-Magic Mantle vs Brand + AP jungler',
    'Control Ward for brush deny',
  ],
};
