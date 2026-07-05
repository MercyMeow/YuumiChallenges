import { SupportMatchup } from '../types';

export const Amumu: SupportMatchup = {
  difficulty: 'Hard',
  tips: [
    'Respect level 2 Bandage Toss — hug max attach radius (1100) and attach to the ally furthest from his Q angle.',
    'If he misses Q his threat drops sharply; immediately curve empowered Q and proc passive heal before cooldown returns.',
    'Hold R until his ultimate stun ends, then channel waves for peel slows and ally healing — do not waste R into the stun.',
    'E shield your host during his E spam on the wave; mana restore on E helps you stay relevant through attrition.',
    'Take Exhaust vs Amumu plus burst ADC (Samira, Draven); Mikaels does not cleanse his R but helps vs follow-up CC.',
  ],
  recommendedRunes:
    'Aery + Manaflow Band + Transcendence + Scorch. Resolve secondary Second Wind or Bone Plating depending on lane poke.',
  recommendedItems:
    'Moonstone into Redemption. Locket if triple AP dive; skip early Ardent since Amumu suppresses early DPS trades.',
  earlyItems: ['Faerie Charm sustain', 'Call boots on host early for Q sidesteps'],
};
