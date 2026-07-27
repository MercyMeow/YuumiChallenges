import { describe, expect, it } from 'vitest';
import {
  getAdminErrorMessage,
  isAllowedAdminOrigin,
  isJsonRecord,
  shouldUseSecureAdminCookie,
} from './utils';

describe('admin utils', () => {
  it('accepts only the expected origin', () => {
    expect(
      isAllowedAdminOrigin('https://yuumi.quest', 'https://yuumi.quest')
    ).toBe(true);
    expect(
      isAllowedAdminOrigin('https://evil.example', 'https://yuumi.quest')
    ).toBe(false);
    expect(isAllowedAdminOrigin(null, 'https://yuumi.quest')).toBe(false);
  });

  it('extracts API error messages when present', () => {
    expect(
      getAdminErrorMessage({ error: 'Invalid credentials' }, 'fallback')
    ).toBe('Invalid credentials');
    expect(getAdminErrorMessage({ error: '' }, 'fallback')).toBe('fallback');
    expect(getAdminErrorMessage(null, 'fallback')).toBe('fallback');
  });

  it('identifies plain JSON objects', () => {
    expect(isJsonRecord({ ok: true })).toBe(true);
    expect(isJsonRecord([])).toBe(false);
    expect(isJsonRecord('nope')).toBe(false);
    expect(isJsonRecord(null)).toBe(false);
  });

  it('allows admin cookies on local HTTP without weakening remote hosts', () => {
    expect(shouldUseSecureAdminCookie('http:', 'localhost')).toBe(false);
    expect(shouldUseSecureAdminCookie('http:', '127.0.0.1')).toBe(false);
    expect(shouldUseSecureAdminCookie('http:', '[::1]')).toBe(false);
    expect(shouldUseSecureAdminCookie('https:', 'localhost')).toBe(true);
    expect(shouldUseSecureAdminCookie('http:', 'yuumi.quest')).toBe(true);
    expect(shouldUseSecureAdminCookie('https:', 'yuumi.quest')).toBe(true);
  });
});
