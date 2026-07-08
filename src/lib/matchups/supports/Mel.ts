import { SupportMatchup } from '../types';

export const Mel: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    'Never fire a detached Q into Rebuttal (W) — her barrier destroys incoming projectiles and fires them straight back, so hold your poke until her shield window expires.',
    "Solar Snare (E) roots on impact — Mikael's Blessing the instant it lands so your host escapes before the follow-up field starts ticking damage and slowing.",
    'Watch her Overwhelm stacks build on your host — Golden Eclipse (R) is a pseudo-execute that consumes all stored stacks at once, and healing through E shield does not remove them, so disengage instead of trying to sustain through it.',
    'Punish Radiant Volley (Q) cooldowns — her poke is strong but slow to reset, so trade with empowered Q the moment she commits it to a wave or a harass attempt.',
    'Exhaust her before she can land Solar Snare (E) into Golden Eclipse (R) — cutting her damage output prevents the Overwhelm execute from ever reaching lethal stacks.',
  ],
  recommendedRunes:
    'Guardian or Resolve secondary (Bone Plating, Revitalize) to blunt her poke; avoid Aery since Rebuttal punishes detached projectile trades.',
  recommendedItems:
    "Moonstone Renewer for the sustain war against her poke. Mikael's Blessing to clear Solar Snare before the Overwhelm execute threshold is reached.",
  earlyItems: [
    'Control Ward for lane vision',
    'Forbidden Idol for mana sustain',
  ],
  notes:
    'Attach through her poke phase — Rebuttal only reflects projectiles, so an attached Yuumi never risks feeding it a Q to send back at your host.',
};
