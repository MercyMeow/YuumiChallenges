/// <reference types="vite/client" />

// Convex function modules have a single extension (`auth.ts`), while test
// and setup files have two (`auth.test.ts`). Keeping tests out of the module
// map prevents Vitest declarations from being registered as Convex functions.
export const modules = import.meta.glob([
  './**/*.{ts,js}',
  '!./**/*.{test,spec}.{ts,js}',
  '!./test.setup.ts',
]);
