import { SupportMatchup } from '../types';

export const Swain: SupportMatchup = {
  difficulty: 'Easy',
  tips: [
    'Punish his immobility with empowered Q from brush; harass whenever Nevermove (E) is down — it runs a 12s cooldown early.',
    'Nevermove (E) passes through minions and detonates on the first champion its return hits — when detached, stand off-angle from your ADC so one root-pull cannot catch you both.',
    'Do not R into Demonic Ascension (R) — peel with slow waves and kite until his drain runs out of Demonic Energy.',
    'Exhaust Swain the moment he channels Demonic Ascension (R); his drain healing scales with the damage he deals, so Exhaust cuts both at once.',
    'Curve empowered Q around minions to chip him safely; the Nevermove (E) root into recast pull is his only real lane threat.',
  ],
  recommendedRunes:
    'Aery + Scorch for lane. Resolve secondary Font of Life + Revitalize; Bone Plating if duo is bursty.',
  recommendedItems:
    "Dream Maker into Moonstone Renewer. Imperial Mandate amplifies Q slow trades. Chemtech Putrifier cuts his Demonic Ascension drain; Mikael's Blessing cleanses the Nevermove root if he chains it with jungle CC.",
  earlyItems: ['Forbidden Idol', 'Control Ward; avoid his brush control'],
};
