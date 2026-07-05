// Curated Yuumi ability tips — patch 16.13, aligned with Riot Data Dragon
// (ddragon 16.13.1). Post-rework kit: E shields, R heals, Best Friend bond.

export type SpellTip = {
  key: 'P' | 'Q' | 'W' | 'E' | 'R';
  name: string;
  summary: string;
  tips: string[];
};

export const YUUMI_SPELL_TIPS: SpellTip[] = [
  {
    key: 'P',
    name: 'Feline Friendship',
    summary:
      'Heal on champion hit; Best Friend bond amplifies every other ability.',
    tips: [
      'Landing Q or an auto on a champion heals you and the next ally you attach to — weave this every trade.',
      'Friendship stacks build while attached; the ally with the strongest bond becomes your Best Friend.',
      'Stay on your Best Friend in fights — empowered Q slow, W on-hit heal, and steerable R waves are your power spike.',
      'Detach briefly for empowered autos when safe; the heal still transfers if you re-attach within four seconds.',
    ],
  },
  {
    key: 'Q',
    name: 'Prowling Projectile',
    summary:
      'Steerable poke that slows; empowered after ~1.35s of travel time.',
    tips: [
      'While attached, curve Q with your cursor before it accelerates — the empowered hit deals bonus damage and a stronger slow.',
      'Detached Q fires in a straight line; use it only when you have a safe angle and W is ready.',
      'Best Friend bonus: the slow is always empowered and your ally gains on-hit magic damage (scales with their crit chance).',
      'Max Q first in most games — it is your primary lane poke and trade tool.',
    ],
  },
  {
    key: 'W',
    name: 'You and Me!',
    summary:
      'Attach to become untargetable; immobilize while detached locks W out.',
    tips: [
      'You are untargetable while attached except to turret shots — position your host, not yourself.',
      'Getting immobilized while detached puts W on a long cooldown; never face-tank hooks or roots.',
      'Best Friend passive: bonus Heal & Shield Power for you and on-hit healing for your ally.',
      'Swap hosts mid-fight to reset threat or follow divers — W has no mana cost.',
    ],
  },
  {
    key: 'E',
    name: 'Zoomies',
    summary:
      'Shield, attack speed, and move speed — passes to your ally when attached.',
    tips: [
      'E grants a shield and attack/move speed — it does not directly heal (healing comes from R and passive).',
      'When attached, E shields your ally and restores mana scaling with their missing mana.',
      'Buffer E before predictable burst or when your ally commits to a short trade — not after damage lands.',
      'Max E second in the standard build; hold it for skirmish tempo rather than spamming on cooldown.',
    ],
  },
  {
    key: 'R',
    name: 'Final Chapter',
    summary:
      'Five waves that damage and slow enemies while healing allies each tick.',
    tips: [
      'Each wave heals allies and damages enemies; excess healing converts into a shield.',
      'You can move, re-attach with W, and cast E while channeling — use E mid-ult for emergency shields.',
      'On your Best Friend, steer the waves with your mouse to follow the fight.',
      'Casting W during R locks wave direction — plan before you swap hosts mid-channel.',
    ],
  },
];
