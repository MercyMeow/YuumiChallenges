import { SupportMatchup } from '../types';

export const Annie: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    'Count Pyromania stacks (4 = stun) and ping stack state — never detach while her stun is loaded, because Disintegrate (Q) is point-and-click.',
    'E shield your host right before Summon: Tibbers (R) lands to absorb the burst; your R wave healing sustains through her combo aftermath.',
    'Curve empowered Q at her when she holds the stun to force a defensive Molten Shield (E), then trade into the cooldown window.',
    'Deny lane brush control — she charges Pyromania stacks safely from fog. Ward it and poke from side angles when Molten Shield (E) is down.',
    'Attach to mobile ADCs (Ezreal, Lucian) to reduce Tibbers multi-stun value; W-swap mid-fight if she Flash engages onto your host.',
  ],
  recommendedRunes:
    'Aery + Manaflow + Transcendence + Scorch. Inspiration Biscuits if mana-heavy lane; Second Wind vs double poke.',
  recommendedItems:
    "Moonstone Renewer into Staff of Flowing Water or Ardent Censer by carry scaling. Mikael's Blessing cleanses her stun but is only worth it if the enemy comp layers more point-click CC.",
  earlyItems: [
    'Null-Magic Mantle vs AP burst duo',
    'Control Ward for brush deny',
  ],
};
