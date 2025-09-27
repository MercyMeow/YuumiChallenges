import { SupportMatchup } from '../types';

export const Ashe: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    'Her support build relies on constant Volley slow. Position host behind minions offset so arrows cannot tag both',
    'Use E reactively after Volley damage to maximize heal/shield value rather than pre-casting',
    'Time empowered Q after she uses Hawkshot since she cannot check brush again soon creating safe angle for poke curve',
    'Hold Exhaust for her ADC if she is support only. If Ashe is the primary engage keep Exhaust for Enchanted Crystal Arrow on your hyper carry',
    'Attach to most mobile ally when Arrow is off screen threat. Reattach mid flight to guarantee shield timing',
    'Build early Rejuvenation component if attrition lane with Ashe plus mage support emerges mid game',
    'When she slows your host use W detach to reposition behind them to keep passive proc safe',
    'Arrow cooldown early is long. Immediately look to force plate pressure after it misses by rotating mid with your ADC',
    'If she rushes Support Mandate consider early Verdant Barrier to cut poke while still accelerating AP scaling',
  ],
  recommendedRunes:
    'Aery standard. Consider Guardian only if lane is Ashe plus hard engage (Nautilus)',
  recommendedItems:
    'Moonstone into Ardent or Staff. Mikaels high value vs Arrow only if no other cleanse tools present',
  earlyItems: ['Early Cloth Armor if paired with Draven or lethal tempo user'],
};
