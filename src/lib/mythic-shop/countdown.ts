'use client';

// Shared minute-tick time source + countdown formatting for the Mythic Shop
// banner and page. One interval serves all subscribers; the server snapshot
// is `null` so SSR and the first client paint render the same placeholder.

import { useSyncExternalStore } from 'react';

let nowMsSnapshot: number | null = null;
let interval: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  if (!interval) {
    nowMsSnapshot = Date.now();
    interval = setInterval(() => {
      nowMsSnapshot = Date.now();
      listeners.forEach((listener) => listener());
    }, 60_000);
  }
  // Notify immediately so the first real timestamp lands right after
  // hydration instead of on the next minute tick.
  onStoreChange();
  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0 && interval) {
      clearInterval(interval);
      interval = null;
    }
  };
}

const getSnapshot = () => nowMsSnapshot;
const getServerSnapshot = () => null;

/** Current timestamp, updated once a minute; `null` during SSR/hydration. */
export function useNowMs(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Formats a future ISO timestamp as a compact "2d 3h" countdown string. */
export function formatCountdown(
  targetIso: string | null,
  nowMs: number
): string {
  if (!targetIso) return 'Varies';
  const diff = new Date(targetIso).getTime() - nowMs;
  if (diff <= 0) return 'Resetting…';
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
