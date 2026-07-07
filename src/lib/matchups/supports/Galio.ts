import { SupportMatchup } from '../types';

export const Galio: SupportMatchup = {
  difficulty: 'Hard',
  tips: [
    'Respect Flash + Justice Punch (E) — the dash knocks up whoever it hits, so track his Flash cooldown and stay at max attach distance rather than trusting sidestep alone.',
    'Shield of Durand (W) taunts your host on release; do not W-swap ally the instant the shield goes up, since the taunt lands before you can react — pre-shield with E instead.',
    'Poke with empowered Q while his Winds of War (Q) is down (11s at rank 1, shrinking to 7s) — that tornado and his Colossal Smash empowered auto are his only real poke tools, so trade after either is spent.',
    'Detach only to ward when Galio shows on the wave; jungler follow-up after a Justice Punch (E) knock-up engage is lethal, so stay attached through his roam windows.',
    "Mikael's Blessing cleanses the Shield of Durand (W) taunt but NOT the Justice Punch (E) knock-up or the Hero's Entrance (R) knock-back landing — save it for the taunt, not the airborne effects.",
  ],
  recommendedRunes:
    'Aery default. Resolve Bone Plating + Revitalize mandatory vs engage lanes.',
  recommendedItems:
    "Moonstone Renewer into Shurelya's Battlesong to disengage his engage windows. Mikael's Blessing situational vs heavy CC chains after the taunt.",
  earlyItems: ['Forbidden Idol early', 'Control Ward for river and tri-brush'],
};
