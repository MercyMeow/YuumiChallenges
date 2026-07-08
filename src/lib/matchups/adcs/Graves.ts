import { BotLaneSynergy } from '../types';

export const Graves: BotLaneSynergy = {
  synergy: 'Situational',
  playstyle: 'Off-meta short-range skirmisher; near-0% bot pick',
  tips: [
    'His shotgun range is far shorter than a normal marksman—expect to hold trades tighter than usual and buffer E (Zoomies) shield before he steps up.',
    'Smoke Screen (W) is self-peel, not lane pressure—steer R (Final Chapter) to slow divers through the cloud since he can only nearsight, not disengage far.',
    'Quickdraw (E) dashes are short; use R (Final Chapter) slows to help him close distance safely rather than relying on his own mobility to escape.',
    'New Destiny (P) reload timing gates his DPS—time Exhaust on the target he engages after both shells are loaded, not mid-reload.',
    'W on-hit healing is inconsistent given his two-shell reload cycle—lean on E shield and R wave heals over expecting steady auto sustain.',
  ],
  buildAdjustments: [
    'Staff of Flowing Water over Ardent Censer; his auto-attack uptime is too gated by the reload mechanic to justify the on-hit item.',
    "Mikael's Blessing vs hard CC—his short range means he can't disengage a lockdown on his own.",
  ],
};
