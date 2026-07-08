import { SupportMatchup } from '../types';

export const Yuumi: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    'Out-rotate her — track which ally she is attached to (only that ally earns her Best Friend stacks from takedowns) and mirror roams to deny free stacking.',
    'She is untargetable while attached to her host except by turrets and projectiles already in flight — do not waste poke on her directly; punish the host instead.',
    'If she detaches to reposition or ward, hard CC lands normally — she cannot reattach while immobilized, and clipping her You and Me! (W) dash puts it on a 5s cooldown. Burst the window right after you land CC on her.',
    'Hold R until after she commits hers; her Final Chapter (R) needs her attached at cast to steer, so if she detaches mid-channel her wave direction locks — bait the detach, then re-engage.',
    'Mana differences become decisive — conserve your own E shield for critical moments rather than pre-casting into her poke.',
  ],
  recommendedRunes:
    'Aery mirror. Guardian if protecting immobile hyper-carry vs dive comp.',
  recommendedItems:
    'Dream Maker into Moonstone, then Ardent or Staff by ally scaling. Dawncore snowballs if ahead.',
  earlyItems: ['Forbidden Idol rush'],
};
