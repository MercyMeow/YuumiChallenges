import { SupportMatchup } from '../types';

export const Senna: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    'Keep a minion between you and Senna to block Last Embrace (W) — it sticks to the first thing hit before spreading into a root, so a minion soaks it. Attach at a side angle to break her line.',
    'Trade when her Piercing Darkness (Q) is on cooldown — it has a slow wind-up and no CC, so punish the gap. Empowered Q from brush adds free damage.',
    "Save R for right after she lands Last Embrace (W); multi-wave slows trap the rooted target in your ADC's DPS.",
    'Curve empowered Q onto Senna herself when she over-extends for Piercing Darkness (Q) poke — she has no self-heal outside Mist stacking, so forcing trades drains her HP pool for real.',
    'E shield + AS after her Piercing Darkness (Q) poke lands so your host can trade back before her next auto.',
  ],
  recommendedRunes:
    'Aery + Scorch; Resolve secondary Font of Life + Revitalize. Second Wind if ADC + Senna both poke.',
  recommendedItems:
    'Dream Maker into Moonstone. Ardent for on-hit ADCs; Staff if AP allies. Imperial Mandate amplifies Q slow trades.',
  earlyItems: ['Forbidden Idol early', 'Control Ward for lane brush'],
};
