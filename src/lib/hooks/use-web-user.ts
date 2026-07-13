'use client';

import { useCallback, useEffect, useState } from 'react';

// Signed-in web user (Discord auth). The session token lives in an
// httpOnly cookie, so the client asks /api/auth/me — which can read it —
// and receives the token back for calling Convex actions directly.

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

type MePayload = { user: WebUser | null; token: string | null };

export function useWebUser() {
  const [state, setState] = useState<MePayload & { loading: boolean }>({
    user: null,
    token: null,
    loading: true,
  });

  const refresh = useCallback(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data: MePayload) =>
        setState({
          user: data.user ?? null,
          token: data.token ?? null,
          loading: false,
        })
      )
      .catch(() => setState({ user: null, token: null, loading: false }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Cookie deletion happens server-side; refresh reflects reality.
    }
    refresh();
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
