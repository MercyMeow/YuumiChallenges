import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot(): boolean | undefined {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getServerSnapshot(): boolean | undefined {
  return undefined;
}

export function useIsMobile() {
  const isMobile = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return !!isMobile;
}
