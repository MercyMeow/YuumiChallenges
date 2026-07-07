import { SupportMatchup } from '../types';

export const Nami: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    'Aqua Prison (Q) suspension locks your W attach for 5 seconds if it hits you detached — skew off-angle from your host and only detach to ward when she shows on wave.',
    "Trade after Tidecaller's Blessing (E) is spent; empowered Q punishes her short range while her on-hit buff is down.",
    'Do not channel R into Tidal Wave (R); bait the knockup first, then channel slow waves and wave healing as it ends.',
    'E shield your host before Ebb and Flow (W) bounces land — the shield eats the damage half of her trade even though it cannot stop her sustain.',
    "Save Exhaust for the target she empowers with Tidecaller's Blessing (E) in all-ins; Chemtech Putrifier covers her healing if the enemy stacks sustain.",
  ],
  recommendedRunes:
    'Aery + Scorch. Resolve Font of Life + Revitalize; Second Wind in double poke lanes.',
  recommendedItems:
    'Moonstone Renewer into Ardent Censer for on-hit ADCs or Staff of Flowing Water with AP allies. Chemtech Putrifier only if enemy team stacks extra sustain.',
  earlyItems: ['Forbidden Idol', 'Control Ward for river/tri'],
};
