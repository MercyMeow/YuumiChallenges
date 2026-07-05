/**
 * Guide's Data Dragon-style patch label. Shown as the fallback until the live
 * patch (from the ddragon proxy route) resolves. `convex/seed.ts` imports
 * this constant directly, so frontend and seeded backend can't drift.
 */
export const GUIDE_PATCH = '16.13';
