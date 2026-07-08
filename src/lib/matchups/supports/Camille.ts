import { SupportMatchup } from '../types';

export const Camille: SupportMatchup = {
  difficulty: 'Hard',
  tips: [
    'Stay attached through the laning phase — Hookshot (E) into Wall Dive is a two-part dash, and the second-hit stun still lands even through displacement immunity, so a detached Yuumi caught in range is locked down.',
    'Once she hits 6, respect all-in windows: The Hextech Ultimatum (R) traps only her target inside the zone, but if you are attached when it lands the bind is never broken, so you get pulled in with your host and cannot detach out.',
    'Exhaust the instant Hookshot (E) connects — it cuts her follow-up damage and the Precision Protocol (Q) true-damage proc before the burst finishes your host.',
    "Save Mikael's Blessing for the Wall Dive stun rather than the initial grapple — cleansing the stun lets your host walk out before she can finish the combo.",
    'Punish Adaptive Defenses (P) downtime — after she commits Hookshot (E) to engage, her shield is on cooldown, so this is the window to trade with empowered Q instead of during her window to all-in.',
  ],
  recommendedRunes:
    'Guardian with Bone Plating + Revitalize (Resolve primary) to survive the E-into-R all-in; Sorcery secondary for Manaflow Band. Aery only if you can safely poke from max range pre-6.',
  recommendedItems:
    "Dream Maker into Moonstone Renewer for the sustain check. Mikael's Blessing as soon as she hits 6 — the Wall Dive stun into R is the fight-ending combo. Locket of the Iron Solari helps survive the dive burst.",
  earlyItems: [
    'Control Ward for jungle entrances',
    'Forbidden Idol for mana sustain',
  ],
  notes:
    'Her kill pressure spikes hard at level 6 — before that she has no reliable engage on an attached Yuumi, so play loose early and tighten up around her ultimate timing.',
};
