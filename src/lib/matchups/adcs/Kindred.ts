import { BotLaneSynergy } from '../types';

export const Kindred: BotLaneSynergy = {
  synergy: 'Situational',
  playstyle:
    'Off-meta bot pick; self-sufficient kiter that wants space, not a dedicated enchanter',
  tips: [
    'Kindred is largely self-sufficient in lane—detach more than usual to poke or ward, since Dance of Arrows (Q) already gives them an escape you cannot improve much on.',
    'Buffer E (Zoomies) before they commit Mounting Dread (E) stacks into an all-in; the mana restore matters most, since Kindred runs mana and burns it fast trading marks.',
    "Layer your R (Final Chapter) slow right as Lamb's Respite (R) ends—the zone stops deaths but not damage, and your wave heal plus slow covers the vulnerable moment after it drops.",
    'Ardent Censer has some value from their attack speed scaling, but this is a below-average lane pairing overall—expect a slower, poke-based lane rather than an all-in one.',
    "Attach for skirmishes only when Wolf's Frenzy (W) territory is already up; Wolf's automatic attacks plus your on-hit Q proc lets Kindred punish anyone who walks into the zone.",
  ],
  buildAdjustments: [
    'Staff of Flowing Water is fine if you end up playing more poke-oriented, but treat this as a flex build lane rather than a standard enchanter pairing.',
    "Mikael's Blessing if the enemy bot lane has hard CC—Kindred has no cleanse and Lamb's Respite does not stop crowd control, only death.",
  ],
};
