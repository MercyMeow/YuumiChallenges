import { SupportMatchup } from '../types';

export const Bard: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    'Ping Journey cooldown when he tunnels aggressively — he has no escape for several seconds after a deep roam.',
    'Stand off-angle from minions he lines up for Q stun; detach briefly only when his Q line is blocked by terrain or minions.',
    'Do not pre-cast R into Tempered Fate — wait for stasis to end, then channel waves for slows and R wave healing.',
    'Contest his roams between waves when he leaves; lane push punishes his map-wide chime collection pattern.',
    'Mikaels cleanses follow-up CC after tunnel plays (Varus R, etc.) but not the stasis itself.',
  ],
  recommendedRunes:
    'Aery + Scorch to punish roam windows. Resolve secondary Bone Plating vs meep auto burst trades.',
  recommendedItems:
    'Moonstone into Redemption — R healing shines in Bard\'s extended kite fights. Shurelya\'s to match his disengage tempo.',
  earlyItems: ['Control Ward to deny chime brush safety', 'Forbidden Idol for poke sustain'],
};
