import { SupportMatchup } from '../types';

export const Sona: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    'Respect level 6 — Flash into Crescendo (R) is a line skillshot that can flip fights from an unexpected angle. Save your R to counter-engage and slow divers right after the stun expires.',
    'Trade on her cooldowns. Poke with empowered Q when Aria of Perseverance (W) is down, since she has no shield to answer with.',
    'Detach only to ward when she shows on wave. Do not detach in the open — a Power Chord auto (empowered after casting Hymn of Valor, Q) plus ally follow-up punishes you.',
    'Use E shield reactively after damage lands to maximize shield value and avoid wasting it into her Hymn of Valor (Q) chip poke.',
    'In sieges curve Q around minions to tag Sona directly; forcing her to spend Aria of Perseverance (W) on herself burns her cooldown for peel instead.',
  ],
  recommendedRunes:
    'Aery primary. Resolve secondary Revitalize + Font of Life; Bone Plating vs heavy engage duo.',
  recommendedItems:
    'Dream Maker into Moonstone. Ardent vs on-hit ADCs or Staff vs AP allies. Imperial Mandate amplifies Q slow trades.',
  earlyItems: [
    'Forbidden Idol rush if lane is poke-heavy',
    'Control Ward to deny river ganks',
  ],
};
