import { SupportMatchup } from '../types';

export const Bard: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    'Ping Magical Journey (E) cooldown when he tunnels aggressively — he has no escape for several seconds after a deep roam.',
    'Stand off-angle from minions he lines up for the Cosmic Binding (Q) stun — Q stuns when it pins you against a wall or a second unit; detach only when his Q line is blocked.',
    'Do not pre-cast R into Tempered Fate (R) — stasis eats your waves. Wait for it to end, then channel Final Chapter for slows and wave healing.',
    'Punish his chime-collecting pattern: push the wave hard when he leaves lane and take plates — Yuumi sieges well with E attack speed on your host.',
    "Mikael's Blessing cleanses follow-up CC after tunnel plays (Varus R, etc.) but not the Tempered Fate stasis itself.",
  ],
  recommendedRunes:
    'Aery + Scorch to punish roam windows. Resolve secondary Bone Plating vs meep auto burst trades.',
  recommendedItems:
    "Moonstone Renewer into Redemption — R healing shines in Bard's extended kite fights. Shurelya's Battlesong to match his disengage tempo.",
  earlyItems: [
    'Control Ward to deny chime brush safety',
    'Forbidden Idol for poke sustain',
  ],
};
