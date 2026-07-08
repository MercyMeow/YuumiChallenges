import { SupportMatchup } from '../types';

export const Orianna: SupportMatchup = {
  difficulty: 'Easy',
  tips: [
    "Track the Ball's position — every Orianna threat comes from where it sits, and if it is parked far from her, Command: Dissonance (W) and Command: Protect (E) both lose range.",
    "Command: Shockwave (R) stun is cleansable, but the pull still displaces your host into her team's damage — Mikael the instant it lands rather than waiting out the stun naturally.",
    'Punish Command: Attack (Q) cooldowns — her poke damage is front-loaded onto the Ball recast, so trade with empowered Q right after she commits it to the wave.',
    'Exhaust the moment Command: Shockwave (R) pulls your host in, since the follow-up burst from her team is what actually kills, not the stun itself.',
    'She has no dash or hard engage on her own — an attached Yuumi is very safe here, so play for poke trades rather than fearing an all-in.',
  ],
  recommendedRunes:
    'Aery to match her poke pattern; Resolve secondary (Bone Plating, Revitalize) if her team has follow-up engage onto the Shockwave pull.',
  recommendedItems:
    "Dream Maker into Moonstone Renewer for the poke-lane sustain race. Mikael's Blessing once she hits 6 for the Shockwave pull-and-burst combo.",
  earlyItems: [
    'Control Ward for lane vision',
    'Forbidden Idol for mana sustain',
  ],
  notes:
    'Off-meta pick with no reliable engage pre-6 — safe to play aggressively attached and only tighten up around her ultimate timing.',
};
