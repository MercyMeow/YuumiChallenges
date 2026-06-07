# Rune Variable Mapping – Audit & Rationale (Current Pass)

Goal: Provide authoritative, evidence‑linked meanings for `var1/var2/var3` per rune (where present) and explicitly call out any remaining uncertainty instead of silently guessing. Accuracy > completeness. Unknowns are surfaced and instrumented in code for future empirical capture.

## Methodology
1. Static Sources: League of Legends Wiki (Fandom) pages for each rune (captured via automated fetch in this session) + patch notes knowledge.
2. Empirical Sample: `exampleMatchData.json` (GameVersion: 15.15) – multiple participants using Resolve & Precision runes with populated vars.
3. Heuristic Checks: Magnitude sanity (e.g., Healing vs Damage ranges), expected caps (e.g., Legend stacks), time semantics (activation timestamps vs durations).
4. Classification: Status levels: CONFIRMED (source + sample), PLAUSIBLE (source textual logic but only partial sample support), UNKNOWN (insufficient signal / conflicting patterns).

## Evidence Snapshots (Key Runes From Sample)
| Rune | ID | Raw Vars (sample) | Interpreted | Status | Notes |
|------|----|-------------------|-------------|--------|-------|
| Grasp of the Undying | 8437 | 1308 / 822 / 0 | Damage / Healing / Permanent HP | CONFIRMED | Matches historical scoreboard: damage + healing; var3 = 0 when no stack HP gained. |
| Demolish | 8446 | 5216 / 0 / 0 | Bonus Structure Damage / – / – | CONFIRMED | Single var usage only. |
| Conditioning | 8429 | 57 / 14 / 11 | Bonus Armor / Bonus MR / Activation Minute | PLAUSIBLE | Activation expected 12; sample shows 11 (rounding / pre‑12 tick). Armor & MR far exceed base rune grant (8) so reflects current total bonus at end, not just rune flat. |
| Overgrowth | 8451 | 313 / 0 / 0 | Permanent HP Gained | CONFIRMED | Consistent with accumulated % conversion. |
| Legend: Tenacity / Haste (slot 2 historical vs current) | 9105 | 21 / 50 / 0; 25 / 0 / 0; 22 / 10 / 0 | var1 = Total Tenacity %? (or Ability Haste for Haste) / var2 = AUX (unknown) | UNKNOWN | Values exceed classic 20% cap for Tenacity (due to items?) & exceed 15 ability haste cap for Haste; inconsistent second var. Needs more samples. |
| Legend: Alacrity | 9104 | 10 / 20 / 0; 10 / 30 / 0 | var1 = Stacks (max 10) / var2 = BONUS STAT TRACKER (unknown) | UNKNOWN | var2 (20,30) not matching 18% final AS; may be interim attack speed *1000 or internal progress artifact. |
| Legend: Bloodline | 9103 | 0 / 0 / 0 | Unused? | UNKNOWN | Sample shows zeros despite rune selection – possibly scoreboard change post‑game (future patch) or data redaction. |
| Triumph | 9111 | 1740 / 220 / 0; 1757 / 560 / 0 | Healing / Bonus Gold | CONFIRMED | Multi participant corroboration. |
| Presence of Mind | 8009 | 972 / 0 / 0; 1013 / 0 / 0; 686 / 0 / 0 | Mana/Resource Restored / (deprecated) | CONFIRMED | Only var1 populated in sample; earlier damage trigger metric absent → treat var2 deprecated. |
| Conqueror | 8010 | 290 / 0 / 0; 366 / 0 / 0 | Healing (total at full stack & partial) | CONFIRMED | Only healing surfaced now; duration / stacks not exported here. |
| Last Stand | 8299 | 536 / 0 / 0 | Bonus Damage | CONFIRMED | Single value typical. |
| Cut Down | 8017 | 1081 / 0 / 0; 1068 / 0 / 0 | Bonus Damage | CONFIRMED | Consistent magnitudes. |
| Coup de Grace | 8014 | 352 / 0 / 0; 60 / 0 / 0 | Bonus Damage | CONFIRMED | Per‑enemy execute amplification. |
| Biscuit Delivery | 8345 | 3 / 0 / 144 | Biscuits Consumed / – / Bonus Max Mana (per biscuit) | PLAUSIBLE | Games pre‑season changed scaling → var3 tracks total permanent mana gained (144 = 3 * 48?). |
| Revitalize | 8453 | 879 / 97 / 0 | Extra Healing / Extra Shielding | CONFIRMED | Two separate amplification buckets. |
| Bone Plating | 8473 | 980 / 0 / 0 | Damage Blocked | CONFIRMED | High number consistent with multi procs. |

## Mapping Adjustments (Delta)
- Retained confirmed labels as‑is.
- Deprecated / zeroed secondary vars (e.g., Presence of Mind var2) intentionally omitted to reduce noise.
- Marked Legend runes (9103/9104/9105) secondary values as UNKNOWN instead of speculative labeling.

## Instrumentation Plan
To converge UNKNOWN → CONFIRMED we added lightweight runtime logging for any rune variable we classify as UNKNOWN (or any rune ID not in the mapping) capturing:
```
{ runeId, varKey, value, matchId?, championId?, timestamp }
```
Instrumentation defaults to no‑op in production; enabled when `process.env.NEXT_PUBLIC_RUNE_DEBUG === '1'`.

## Follow‑Up Data Needed
| Target | What to Capture | Why |
|--------|-----------------|-----|
| Legend: Alacrity (9104) | var1/var2 over time; final attack speed | Determine if var2 encodes interim or cumulative stat. |
| Legend: Tenacity / Haste (9105) | var1 vs itemization; var2 meaning | Distinguish Tenacity% vs Ability Haste in future patches. |
| Legend: Bloodline (9103) | Non‑zero sample set | Confirm whether post‑game export dropped lifesteal stat. |

## Current Confidence Summary
CONFIRMED: Majority of damage/heal/shield/gold runes; Resolve keystones; Triumph; Presence of Mind (var1).
PLAUSIBLE: Conditioning activation minute; Biscuit permanent mana math.
UNKNOWN (flagged for logging): Legend cluster (9103/9104/9105) additional vars.

## Rationale for Choosing Transparency Over Guessing
Displaying an incorrect label (e.g., “Stacks” where the number is actually percent Tenacity or ability haste) is more misleading than suppressing or clearly flagging it. The code now omits UNKNOWN vars from UI and logs them for future iteration.

## Next Steps
1. Accumulate multi‑match corpus (≥50 matches) to pattern‑match Legend and Biscuit derived vars.
2. Cross‑reference CommunityDragon or scoreboard memory dumps for legend rune telemetry fields once accessible.
3. Promote PLAUSIBLE → CONFIRMED with at least two distinct champion archetype samples.

## Multi-Var Display Logic (UI Integration)
The UI now uses a consolidated helper `getAllRuneVarInfos(runeId, { var1, var2, var3 })` which:
- Returns only mapped (CONFIRMED/PLAUSIBLE) vars with positive values by default.
- Preserves ordering var1 → var2 → var3 for readability and consistency with raw API ordering.
- When `NEXT_PUBLIC_RUNE_DEBUG=1`, will also include any non-zero unmapped vars as `Raw VarX` entries so analysts can visually spot emergent fields (these remain hidden in normal mode to avoid misleading users).
- Each returned entry carries `known: boolean` enabling future styling distinctions (currently unused beyond filtering).

Rationale: Centralizing multi-var extraction eliminates copy/paste logic and guarantees instrumentation + future rule changes apply uniformly across all rune displays.

---
Last updated: (automated audit pass in this session)
Maintainer: Rune variable accuracy taskforce.


