import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { discordAvatarUrl, useWebUser, type WebUser } from './use-web-user';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

const originalUser: WebUser = {
  id: 'web-user',
  discordId: '175928847299117063',
  username: 'yuumi',
  globalName: null,
  avatar: null,
  subscribed: false,
  subscribedUntil: null,
  linkedPuuid: null,
  pendingLink: null,
};

describe('useWebUser', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('returns a refresh promise that settles after state reconciliation', async () => {
    const refreshedUser = { ...originalUser, subscribed: true };
    const delayedResponse = deferred<Response>();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ user: originalUser }))
      .mockImplementationOnce(() => delayedResponse.promise);
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useWebUser());

    await waitFor(() => {
      expect(result.current.user).toEqual(originalUser);
    });

    let settled = false;
    let refreshPromise!: Promise<void>;
    act(() => {
      refreshPromise = result.current.refresh().then(() => {
        settled = true;
      });
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    await act(async () => {
      delayedResponse.resolve(jsonResponse({ user: refreshedUser }));
      await refreshPromise;
    });

    expect(settled).toBe(true);
    expect(result.current.user).toEqual(refreshedUser);
  });

  it('uses Discord default avatars for accounts without an avatar hash', () => {
    expect(discordAvatarUrl(originalUser)).toMatch(
      /^https:\/\/cdn\.discordapp\.com\/embed\/avatars\/[0-5]\.png$/
    );
  });
});
