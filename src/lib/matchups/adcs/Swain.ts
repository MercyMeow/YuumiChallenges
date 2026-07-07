import { BotLaneSynergy } from '../types';

export const Swain: BotLaneSynergy = {
  synergy: 'Good',
  playstyle: 'Tanky drain mage bot; front-lines fights instead of kiting them',
  tips: [
    "Detach to help land Death's Hand (Q) waveclear and stay off-angle from his Nevermove (E) root—once it lands, follow up with your empowered Q while he pulls the target in.",
    'His Demonic Ascension (R) drain heals off the damage he deals—steer your R (Final Chapter) waves through him and nearby allies so the frontline becomes very hard to break during the channel.',
    'Buffer E (Zoomies) right before he commits Demonic Ascension (R); the shield and mana restore keep him topped up so the drain can run its full duration.',
    'He has almost no burst or mobility, so attach freely in fights—Best Friend W on-hit healing rewards his auto-attacks during the drain channel.',
    'Vision of Empire (W) reveals rotations; reposition to intercept ganks or roam bot with him once the wave is pushed.',
  ],
  buildAdjustments: [
    'Staff of Flowing Water over Ardent Censer—Swain is a drain tank, not an auto-attacker, so on-hit attack speed does little for him.',
    "Chemtech Putrifier or Mikael's Blessing to protect the Demonic Ascension (R) channel from being cut short by CC.",
  ],
};
