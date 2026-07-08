import { SupportMatchup } from '../types';

export const Fiddlesticks: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    'Ward deep flanks and sweep common Crowstorm (R) angles post-6 — the channel blinks him up to 800 units, so from fog or over a wall it decides fights before you can react, and he can still Flash mid-channel.',
    "Mikael's Blessing cleanses the Terrify (Q) fear immediately — use it the instant your carry is feared during his Crowstorm (R) channel so they can keep kiting.",
    'Harass when Bountiful Harvest (W) is on cooldown — empowered Q poke forces him to waste W defensively or disengage instead of sustaining through your trade.',
    'If Reap (E) centers on your host, expect a silence on top of the slow — pre-cast E shield before he can line it up, since a silenced ally cannot Flash out.',
    'Detach only to ward when he shows on the wave — a feared, detached Yuumi cannot reattach on command, so stay attached through any period he could be stealthed nearby.',
  ],
  recommendedRunes:
    'Aery default. Resolve Bone Plating + Revitalize vs all-in; Font of Life if fights run longer.',
  recommendedItems:
    "Moonstone Renewer into early Mikael's Blessing — the Terrify fear is fight-deciding. Redemption or Locket of the Iron Solari mitigates the Crowstorm AoE burst; staying attached keeps you safe through the channel.",
  earlyItems: [
    'Control Wards for flank angles',
    'Forbidden Idol vs poke attrition',
  ],
};
