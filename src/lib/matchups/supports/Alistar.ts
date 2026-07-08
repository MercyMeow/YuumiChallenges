import { SupportMatchup } from '../types';

export const Alistar: SupportMatchup = {
  difficulty: 'Hard',
  tips: [
    'Track Flash cooldown — Flash + Headbutt (W) + Pulverize (Q) is his only long-range engage. Ping it when used and punish the window.',
    'If Headbutt (W) knocks your host toward his team, W-swap to a safer ally immediately — you are not CCed while attached, so the swap comes out before the follow-up Pulverize (Q).',
    "Pre-shield with E before his knock-up combo; Mikael's Blessing cannot remove Pulverize or Headbutt (both are airborne), so mitigation has to come first.",
    'Punish level 1 while he walks up to execute minions for World Atlas gold — curve empowered Q onto him before he has the W+Q combo online.',
    'After he commits, layer R slow waves behind his retreat path; steer the waves while attached to zone his ADC off follow-up.',
  ],
  recommendedRunes:
    'Aery + Scorch for lane pressure. Resolve secondary Bone Plating vs all-in; Guardian only if your ADC is immobile.',
  recommendedItems:
    "Moonstone Renewer into Redemption — R wave healing outvalues his short trade windows. Shurelya's Battlesong to kite after he burns his combo.",
  earlyItems: [
    'Control Ward in river brush',
    'Forbidden Idol if lane is attrition-heavy',
  ],
};
