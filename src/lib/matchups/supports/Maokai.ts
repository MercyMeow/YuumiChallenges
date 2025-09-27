import { SupportMatchup } from '../types';

export const Maokai: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    'Deny brush control - saplings dominate lane trades. Sweep and ward brushes before pushing up.',
    "Mikael's is valuable to break root chains from W (Twisted Advance) + ult. Cleanse the first root on your carry.",
    'Do not R first into his long-range ultimate. Save R to peel his engage or to lock him after it passes.',
    'Punish his long cooldowns: after W, curve Q and kite back; he is immobile until he re-engages.',
    'Track jungle proximity - Maokai ganks are lethal; only detach to ward when he shows on wave.',
  ],
  recommendedRunes:
    'Aery default; Resolve secondary with Bone Plating + Revitalize vs hard engage or Font of Life in slower lanes.',
  recommendedItems:
    "Moonstone first. Early Mikael's vs heavy CC comps; Redemption for teamfights. Shurelya's helps disengage his ult.",
  earlyItems: ['Forbidden Idol', 'Control Ward for lane brush and river'],
};
