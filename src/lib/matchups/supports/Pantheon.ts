import { SupportMatchup } from '../types';

export const Pantheon: SupportMatchup = {
  difficulty: 'Hard',
  tips: [
    'Never sit in Shield Vault (W) landing range while detached — the stun on landing is cleansable, but by the time you react he has already followed with an empowered Mortal Will (P) attack for heavy burst.',
    'Comet Spear (Q) does bonus damage to low-health targets from range — E shield your host proactively before he lines up a poke rather than reacting after it lands.',
    "Mikael's Blessing the Shield Vault (W) stun immediately, since his empowered triple-strike attack follows within seconds and can chain into a kill before your host escapes.",
    'Grand Starfall (R) telegraphs with a sightline half a second into the channel — use that warning to pre-position or Exhaust him on arrival before he can follow up with Comet Spear (Q).',
    'His damage falls off hard into the late game — play patiently through his level 1-6 all-in windows and out-scale rather than trading even.',
  ],
  recommendedRunes:
    'Guardian primary, Resolve secondary (Bone Plating, Revitalize) to survive his early all-in spikes.',
  recommendedItems:
    "Dream Maker into Moonstone Renewer. Mikael's Blessing as soon as he hits 6 — the Shield Vault stun into empowered auto is his core kill combo. Locket of the Iron Solari for the dive burst.",
  earlyItems: [
    'Control Ward for jungle pathing',
    'Forbidden Idol for mana sustain',
  ],
  notes:
    'Grand Starfall (R) enables cross-map dives, so ward proactively if he leaves lane — his global engage can catch other lanes off guard while you are safe.',
};
