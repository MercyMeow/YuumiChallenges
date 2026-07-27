import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminClientError, fetchAdminBuildsRequest } from '@/lib/admin/client';
import { AuthProvider, useAuth } from './AuthContext';

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

describe('AuthProvider', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it.each([401, 403])(
    'clears in-memory auth after an admin API %s response',
    async (status) => {
      const user = {
        id: 'admin-user',
        username: 'admin',
        role: 'admin' as const,
      };
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({ user }))
        .mockResolvedValueOnce(
          jsonResponse({ error: 'Admin session expired' }, status)
        );
      vi.stubGlobal('fetch', fetchMock);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await expect(fetchAdminBuildsRequest()).rejects.toEqual(
          expect.objectContaining<Partial<AdminClientError>>({ status })
        );
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
      });
    }
  );

  it('ignores an authorization failure from a request started before a newer login', async () => {
    const originalUser = {
      id: 'original-admin',
      username: 'original',
      role: 'admin' as const,
    };
    const newerUser = {
      id: 'new-admin',
      username: 'new-admin',
      role: 'admin' as const,
    };
    const delayedBuildsResponse = deferred<Response>();
    const fetchMock = vi.fn((input: RequestInfo) => {
      if (input === '/api/admin/session') {
        return Promise.resolve(jsonResponse({ user: originalUser }));
      }
      if (input === '/api/admin/builds') {
        return delayedBuildsResponse.promise;
      }
      if (input === '/api/admin/login') {
        return Promise.resolve(jsonResponse({ user: newerUser }));
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(originalUser);
    });

    const buildsRequest = fetchAdminBuildsRequest();
    await act(async () => {
      await result.current.login('new-admin', 'password');
    });

    expect(result.current.user).toEqual(newerUser);

    await act(async () => {
      delayedBuildsResponse.resolve(
        jsonResponse({ error: 'Old session expired' }, 401)
      );
      await expect(buildsRequest).rejects.toEqual(
        expect.objectContaining<Partial<AdminClientError>>({ status: 401 })
      );
    });

    expect(result.current.user).toEqual(newerUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('rechecks the shared session when another tab may have changed it', async () => {
    const user = {
      id: 'admin-user',
      username: 'admin',
      role: 'admin' as const,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ user }))
      .mockResolvedValueOnce(jsonResponse({ user: null }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(user);
    });

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  it('preserves the authenticated user across a transient session-check failure', async () => {
    const user = {
      id: 'admin-user',
      username: 'admin',
      role: 'admin' as const,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ user }))
      .mockRejectedValueOnce(new Error('temporary network outage'));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });
    await waitFor(() => expect(result.current.user).toEqual(user));

    act(() => window.dispatchEvent(new Event('focus')));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(result.current.user).toEqual(user);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('fences an older refresh when another tab logs in', async () => {
    const originalUser = {
      id: 'original-admin',
      username: 'original',
      role: 'admin' as const,
    };
    const newerUser = {
      id: 'new-admin',
      username: 'new-admin',
      role: 'admin' as const,
    };
    const delayedRefresh = deferred<Response>();
    let broadcastHandler: ((event: MessageEvent) => void) | null = null;
    vi.stubGlobal(
      'BroadcastChannel',
      class {
        get onmessage() {
          return broadcastHandler;
        }
        set onmessage(handler: ((event: MessageEvent) => void) | null) {
          broadcastHandler = handler;
        }

        postMessage() {}
        close() {}
      }
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ user: originalUser }))
      .mockReturnValueOnce(delayedRefresh.promise)
      .mockResolvedValueOnce(jsonResponse({ user: newerUser }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });
    await waitFor(() => expect(result.current.user).toEqual(originalUser));

    act(() => window.dispatchEvent(new Event('focus')));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    act(() => {
      broadcastHandler?.({
        data: { type: 'session-changed' },
      } as MessageEvent);
    });
    await waitFor(() => expect(result.current.user).toEqual(newerUser));

    await act(async () => {
      delayedRefresh.resolve(jsonResponse({ user: null }));
      await delayedRefresh.promise;
    });
    expect(result.current.user).toEqual(newerUser);
  });
});
