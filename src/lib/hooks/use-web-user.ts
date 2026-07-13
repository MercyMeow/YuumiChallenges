'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Signed-in web user (Discord auth). The session token lives in an
// httpOnly cookie that client JavaScript never sees; /api/auth/me reports
// who is signed in, and authenticated account actions go through the
// /api/account/* proxy routes that read the cookie server-side.

export type WebUser = {
  id: string;
  discordId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  subscribed: boolean;
  subscribedUntil: number | null;
  linkedPuuid: string | null;
  pendingLink: { puuid: string; iconId: number; expiresAt: number } | null;
};

type MePayload = { user: WebUser | null };

export function useWebUser() {
  const [state, setState] = useState<{
    user: WebUser | null;
    loading: boolean;
  }>({
    user: null,
    loading: true,
  });
  // Monotonic request id: a slow earlier /me response must not overwrite
  // the result of a later one (e.g. the post-logout refresh).
  const requestSeq = useRef(0);

  const refresh = useCallback(() => {
    const seq = ++requestSeq.current;
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data: MePayload) => {
        if (seq !== requestSeq.current) return; // superseded
        setState({ user: data.user ?? null, loading: false });
      })
      .catch(() => {
        if (seq !== requestSeq.current) return;
        setState({ user: null, loading: false });
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Signs out; returns false when server-side revocation failed, in which
   * case the signed-in state is kept (the cookie was retained too) so the
   * UI doesn't pretend the session is gone.
   */
  const logout = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) return false;
    } catch {
      return false;
    }
    refresh();
    return true;
  }, [refresh]);

  return { ...state, refresh, logout };
}

/** Discord avatar URL with the deterministic default-avatar fallback. */
export function discordAvatarUrl(user: WebUser): string {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=64`;
  }
  const index = Number(BigInt(user.discordId) >> 22n) % 6;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}
