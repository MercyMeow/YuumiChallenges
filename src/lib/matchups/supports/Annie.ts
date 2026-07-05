import { SupportMatchup } from '../types';

export const Annie: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    'Count passive stacks (4 = stun) and ping stack state — never face-tank an empowered Q when stun is ready.',
    'E shield your host right before Tibbers lands to absorb burst; R wave healing sustains through her combo aftermath.',
    'Curve empowered Q late when she holds stun to force a defensive Molten Shield, then punish the cooldown window.',
    'Deny lane brush control — she charges stun safely from fog. Ward and poke from side angles when E is down.',
    'Attach to mobile ADCs (Ezreal, Lucian) to reduce Tibbers multi-stun value; W swap mid-fight if she Flash engages.',
  ],
  recommendedRunes:
    'Aery + Manaflow + Transcendence + Scorch. Inspiration Biscuits if mana-heavy lane; Second Wind vs double poke.',
  recommendedItems:
    'Moonstone into Staff or Ardent by carry scaling. Mikaels only if enemy comp layers extra point-click CC beyond Annie stun.',
  earlyItems: ['Null Magic Mantle vs AP burst duo', 'Control Ward for brush deny'],
};
