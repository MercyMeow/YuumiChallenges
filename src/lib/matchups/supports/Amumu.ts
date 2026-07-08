import { SupportMatchup } from '../types';

export const Amumu: SupportMatchup = {
  difficulty: 'Hard',
  tips: [
    'Bandage Toss (Q) has 1100 range and TWO charges — respect the level 2 spike and stay behind your host relative to his angle, since one missed hook does not mean he is safe to punish.',
    'Only trade after both Bandage Toss (Q) charges are down; then curve empowered Q onto him and proc your passive heal before a charge comes back.',
    'Hold R until Curse of the Sad Mummy (R) resolves, then channel waves for peel slows and ally healing — do not start Final Chapter into the stun.',
    'E shield your host during Tantrum (E) spam on the wave; your E also refunds mana to your ADC, which wins the attrition war against his Despair (W) poke.',
    "Mikael's Blessing cleanses both the Bandage Toss (Q) stun and the Curse of the Sad Mummy (R) stun — save it for whichever hits your carry, and take Exhaust vs Amumu plus a burst ADC (Samira, Draven).",
  ],
  recommendedRunes:
    'Aery + Manaflow Band + Transcendence + Scorch. Resolve secondary Second Wind or Bone Plating depending on lane poke.',
  recommendedItems:
    "Moonstone Renewer into Mikael's Blessing — his whole kit is cleansable stuns. Locket of the Iron Solari if triple AP dive; delay Ardent Censer since Amumu suppresses early DPS trades.",
  earlyItems: ['Faerie Charm for sustain', 'Control Ward for river brush'],
};
