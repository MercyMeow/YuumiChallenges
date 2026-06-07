# Rune Variable Source of Truth

This project now tracks rune variable labels directly from CommunityDragon's `perks.json` data dump. The helper script lives in `scripts/extract-rune-vars.mjs` and can be re-run any time to refresh the derived summary.

## Update workflow

1. Run the extractor to download the latest `perks.json` snapshot and emit a condensed summary for the runes we care about:
   ```powershell
   node scripts\extract-rune-vars.mjs > scripts\rune-vars.json
   ```
2. Compare the generated `scripts/rune-vars.json` output with `src/lib/runes/rune-variables.ts`.
3. Apply any mapping adjustments and re-run the UI to validate.

The `scripts/rune-vars.json` artifact is committed so reviewers can audit the raw labels & formats that back our mapping.

## Notes

- Labels that come back empty ("") indicate that the scoreboard does not surface an end-of-game stat for that slot. We purposely omit those from the display.
- Some labels cover mixed metrics (e.g., "Bonus Ultimate Damage/Healing/Shielding"); we default to the `damage` formatter for readability.
- If new runes ship, add their IDs to `perkIdsOfInterest` inside the script before re-running it.
