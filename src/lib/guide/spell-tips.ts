// Curated Yuumi ability tips — patch 16.13, aligned with Riot Data Dragon
// (ddragon 16.13.1). Post-rework kit: E shields, R heals, Best Friend bond.
// Tip text supports `**keyword**` markup, rendered as gold highlights by
// the ability guide panel.

export type SpellTipEntry = {
  /** Short gold-caps lead-in shown above the tip body. */
  lead: string;
  /** Tip body; `**text**` segments render highlighted. */
  text: string;
};

export type SpellTip = {
  key: 'P' | 'Q' | 'W' | 'E' | 'R';
  name: string;
  summary: string;
  tips: SpellTipEntry[];
};

export const YUUMI_SPELL_TIPS: SpellTip[] = [
  {
    key: 'P',
    name: 'Feline Friendship',
    summary:
      'Heal on champion hit; Best Friend bond amplifies every other ability.',
    tips: [
      {
        lead: 'Heal on hit',
        text: 'Landing **Q or an attack** on an enemy champion heals you and stores a heal for your ally — weave a poke into every trade.',
      },
      {
        lead: 'Friendship stacks',
        text: 'The bond grows when your attached ally **kills minions or champions**; the ally with the strongest bond becomes your **Best Friend**.',
      },
      {
        lead: 'Ride your Best Friend',
        text: 'The enhanced **Q slow**, **W on-hit healing**, and **boosted R healing** only work on your Best Friend — stay on them in fights.',
      },
      {
        lead: 'Detach windows',
        text: 'Hop off for an empowered attack when safe; the stored heal still transfers if you **re-attach within ~4 seconds**.',
      },
    ],
  },
  {
    key: 'Q',
    name: 'Prowling Projectile',
    summary:
      'Steerable poke that slows; empowered after ~1.35s of travel time.',
    tips: [
      {
        lead: 'Steer the missile',
        text: 'While attached, curve Q with your **cursor** before it accelerates — the empowered hit deals bonus damage and a **stronger slow**.',
      },
      {
        lead: 'Detached Q',
        text: 'Off an ally the missile flies in a **straight line** — only throw it when you have a safe angle and W is ready.',
      },
      {
        lead: 'Best Friend bonus',
        text: 'While on your Best Friend, every Q that hits a champion applies the **enhanced slow** and grants your ally **on-hit magic damage** that scales with their **crit chance**.',
      },
      {
        lead: 'Max it first',
        text: 'Q is your primary **lane poke** and trade tool — max it first in most games.',
      },
    ],
  },
  {
    key: 'W',
    name: 'You and Me!',
    summary:
      'Attach to become untargetable; immobilize while detached locks W out.',
    tips: [
      {
        lead: 'Untargetable',
        text: 'While attached you can only be hit by **turrets** and projectiles **already in flight** — position your host, not yourself.',
      },
      {
        lead: 'CC lockout',
        text: 'You **cannot attach while immobilized**, and CC that clips the W dash puts it on a **5-second cooldown** — never face-tank hooks or roots.',
      },
      {
        lead: 'Best Friend bonus',
        text: 'Bonus **Heal & Shield Power** for you, and your ally’s attacks **heal them on-hit**.',
      },
      {
        lead: 'Free host swaps',
        text: 'W costs **no mana** — swap hosts mid-fight to reset threat or follow divers.',
      },
    ],
  },
  {
    key: 'E',
    name: 'Zoomies',
    summary:
      'Shield, attack speed, and move speed — passes to your ally when attached.',
    tips: [
      {
        lead: 'Shield, not heal',
        text: 'E grants a **shield** plus **attack and move speed** — it does not heal (healing comes from R and your passive).',
      },
      {
        lead: 'Mana battery',
        text: 'When attached, E shields your ally and restores their mana, scaling with their **missing mana**.',
      },
      {
        lead: 'Buffer the shield',
        text: 'Cast E **before** predictable burst or when your ally commits to a trade — not after the damage lands.',
      },
      {
        lead: 'Max it second',
        text: 'Take E second in the standard build; hold it for **skirmish tempo** rather than spamming on cooldown.',
      },
    ],
  },
  {
    key: 'R',
    name: 'Final Chapter',
    summary:
      'Five waves that damage and slow enemies while healing allies each tick.',
    tips: [
      {
        lead: 'Wave value',
        text: 'Each of the **five waves** heals allies it passes through and damages enemies — excess healing converts into a **shield**.',
      },
      {
        lead: 'Stay active',
        text: 'You can **move, attach with W, and cast E** while channeling (Q is disabled) — use E mid-ult for emergency shields.',
      },
      {
        lead: 'Steer the waves',
        text: 'Cast R while **attached** and the waves follow your mouse; detaching mid-channel **locks their direction** for the rest of the cast.',
      },
      {
        lead: 'Best Friend bonus',
        text: 'Your Best Friend receives **30–60% stronger** wave healing — ult while riding your carry.',
      },
    ],
  },
];
