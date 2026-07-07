import { SupportMatchup } from '../types';

export const Taric: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    'Dazzle (E) is a narrow line stun with a 16s cooldown early — avoid standing in a straight line with your host so one cast cannot clip you both.',
    'Punish cooldowns — Dazzle (E) and the Bastion (W) shield/tether are both slow to come back early. Poke with empowered Q while Dazzle is down.',
    'Cosmic Radiance (R) has a 2.5s cast delay before invulnerability applies — bait it out, then re-engage with slow waves right as the window ends.',
    'Detach to ward only when he shows on wave. His jungle-assisted dives are strong — track enemy jungler.',
    'Exhaust the highest DPS diver rather than Taric; your R slow waves keep him in place after Dazzle stun resolves.',
  ],
  recommendedRunes:
    'Aery default. Resolve secondary Bone Plating + Revitalize if enemy comp has reliable engage.',
  recommendedItems:
    "Dream Maker into Moonstone. Ardent for on-hit ADCs or Redemption for teamfights. Mikael's niche — Taric has little hard CC chains.",
  earlyItems: ['Forbidden Idol early', 'Control Ward for river/tri'],
};
