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
});
