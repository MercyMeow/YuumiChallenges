export type SupportMatchup = {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tips: string[]; // actionable bullet points
  recommendedRunes: string; // rune page rationale / adaptations
  recommendedItems: string; // core + situational focus
  earlyItems?: string[];
  notes?: string;
};

export type BotLaneSynergy = {
  synergy:
    'Excellent' | 'Very Good' | 'Good' | 'Average' | 'Poor' | 'Situational';
  tips: string[];
  playstyle: string;
  optimalAttachTargets?: string;
  buildAdjustments?: string[];
};
