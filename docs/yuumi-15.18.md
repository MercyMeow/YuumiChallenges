Yuumi — Patch 15.18 Build Notes

Sources
- Lolalytics global: https://lolalytics.com/lol/yuumi/build/
- Lolalytics 1-trick filter: https://lolalytics.com/lol/yuumi/build/?tier=1trick

Summary
- Core backbone is Dawncore -> Dream Maker, then utility based on comp.
- Ionian Boots of Lucidity are the only common boot purchase and are often skipped.
- Early components: Forbidden Idol, Kindlegem, Bandleglass Mirror pathing depending on need.

Core/High-Priority
- Dawncore
- Dream Maker
- Mikael's Blessing (vs. heavy CC)
- Redemption (teamfight sustain)

Situational
- Ardent Censer (AA carry synergy)
- Staff of Flowing Water (AP carry/poke synergy)
- Chemtech Putrifier (early if anti-heal needed)
- Shurelya's Battlesong (engage/speed comps)
- Locket of the Iron Solari (burst mitigation)
- Knight's Vow (pocketing single hyper-carry)
- Vigilant Wardstone (late game slot)
- Mejai's Soulstealer (snowball)
- Imperial Mandate (niche; Q slow procs it, lower prio in 15.18)

Starters & Income
- World Atlas -> Runic Compass -> Bounty of Worlds

Notes
- Yuumi often delays or skips boots because she is attached; only buy when you need haste/timing windows.
- Consider anti-heal as second if enemy has early sustain (Putrifier).
- Choose Ardent vs. Staff according to ally carry damage profile.

Implementation
- Data encoded at `src/lib/builds/yuumi.ts` as `yuumiBuild1518`. Map item names to your internal item ID/icon system.
- UI parity for alternate summoner spells: use `src/components/SummonerSpellPill.tsx` and `getSummonerSpellIconPath` from `src/lib/summonerSpells.ts`.
 - Rune pages provided at `src/lib/runes/yuumi.ts` as `yuumiRunePages1518`; render with `src/components/RunePageCard.tsx`.

Discord Embed
- Use `docs/yuumi-discord-embed.md` for a polished, Yuumi-themed Discord embed payload with buttons linking back to this guide and live stats.
- The main guide landing page now includes a visual preview with one-click copy for the embed JSON.
