import { SupportMatchup } from '../types';

export const Shaco: SupportMatchup = {
  difficulty: 'Medium',
  tips: [
    "Sweep suspicious brush before pushing — Jack In The Box (W) is disguised until an enemy gets close; the fear is cleansable, so Mikael's Blessing the instant it triggers keeps your host moving.",
    'If a detached Yuumi gets feared by Jack In The Box (W), your W goes on a 5-second lockout — stay attached whenever you are near unswept brush so a fear cannot strand you off your host.',
    'Watch for backstab angles from fog near Deceive (Q) — he blinks in stealth and gets a guaranteed critical strike on his next attack, so E shield your host the moment he reappears rather than after the burst lands.',
    'Exhaust on the Deceive (Q) reveal to cut his crit damage and Two-Shiv Poison (E) follow-up slow before he can finish the combo.',
    'Hallucinate (R) clones can fake his full kit including Jack In The Box (W) — treat any box or blink from an unconfirmed Shaco as a threat until you see the real one on the map.',
  ],
  recommendedRunes:
    'Guardian or Resolve secondary (Bone Plating, Revitalize) to survive backstab burst; keep a Control Ward up to deny his box and blink angles.',
  recommendedItems:
    "Dream Maker into Moonstone Renewer. Mikael's Blessing clears the Jack In The Box fear instantly — keep it up whenever brush is unswept so a stray box does not lock down your host.",
  earlyItems: [
    'Control Ward for brush and flanks',
    'Forbidden Idol for mana sustain',
  ],
  notes:
    'Deception-focused pick that wins through picks, not lane trades — ward flank paths and box-likely brush rather than fighting him head-on.',
};
