import { SupportMatchup } from '../types';

export const Annie: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    'Count her passive stacks (4 for stun). Communicate stack state in chat or pings',
    'When she holds stun do not throw empowered Q straight line. Curve late to force shield timing misplay',
    'Shield your host right before Tibbers lands to absorb burst then use R slows to zone Tibbers pathing in choke',
    'Sit on a long range mobile ADC (Ezreal Lucian) to reduce value of her Flash Tibbers multi stun',
    'If she uses Molten Shield offensively she lacks E DR. Use that window to poke twice with Q then passive proc for sustain',
    'Early Null Magic Mantle rush if paired with poke ADC (Varus) can be justified delaying Bandleglass',
    'Deny brush control. She often sits in lane brush charging stun safely. Place Control Ward and track her stepping forward',
    'Tibbers reveals fog. After summon reposition via W to a diver to keep Q angles unpredictable',
    'Consider Mikaels only if enemy also fields long root style CC (Ashe Lux). Annie stun alone is often not worth early purchase',
  ],
  recommendedRunes:
    'Aery + Manaflow Transcendence Scorch. Secondary Resolve Second Wind if double poke else Inspiration Biscuit for mana pressure',
  recommendedItems:
    'Moonstone into Mikaels if multiple single target stuns. Otherwise Ardent or Staff depending on ally AP scaling',
  earlyItems: [
    'Null Magic Mantle situational',
    'Extra Refillable not needed usually',
  ],
};
