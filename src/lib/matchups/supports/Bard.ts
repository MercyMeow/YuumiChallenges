import { SupportMatchup } from '../types';

export const Bard: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    'Track his journey cooldown. Ping when Tunnel used aggressively since he lacks escape for several seconds',
    'Curve Q around minions he lines up for stun. Detach briefly to reposition Q origin if safe then reattach',
    'Do not pre cast R into Tempered Fate. Wait for stasis to end then fire waves so slow stacking prevents clean retreat',
    'Collecting chimes pulls him off lane. Ping wave state and look for host to push when he leaves',
    'Shrines give sustain. Deny them by calling host to auto them between waves when Bard roams mid',
    'If he builds AP (Ludens) shift to early Null Magic Mantle. If tank supportless comp you can rush Ardent second',
    'Standing slightly behind minion he wants to Q through removes double stun threat',
    'Place deep ward in river pixel to spot roam angles. React by attaching to jungler for counter gank',
    'Mikaels cleanses post tunnel follow up CC like Varus chain after his ultimate not the stasis itself',
  ],
  recommendedRunes:
    'Aery with Scorch to punish his roam windows. Resolve secondary Bone Plating protects vs meep burst',
  recommendedItems:
  'Moonstone is often strong in extended fights. Redemption is extremely effective with Bard disengage kiting',
  earlyItems: ['Control Ward lane brush deny chime safety'],
};
