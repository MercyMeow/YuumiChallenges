import { describe, expect, it } from 'vitest';
import { createReturnUrl, sanitizeReturnPath } from './safe-return-path';

describe('sanitizeReturnPath', () => {
  it.each([
    'https://attacker.example',
    '//attacker.example',
    '/\\attacker.example',
    '/%5cattacker.example',
    '/%2f%2fattacker.example',
    '/%255cattacker.example',
    '/..//attacker.example/path?x=1#fragment',
    '/%2e%2e//attacker.example/path',
  ])('rejects redirect-shaped input %s', (value) => {
    expect(sanitizeReturnPath(value)).toBe('/');
  });

  it('preserves a local path, query, and fragment', () => {
    expect(sanitizeReturnPath('/players/euw/name?tab=ranked#build')).toBe(
      '/players/euw/name?tab=ranked#build'
    );
  });

  it('adds state before an existing fragment', () => {
    expect(
      createReturnUrl('https://yuumi.example', '/guide?tab=items#core', {
        key: 'sub',
        value: 'success',
      }).toString()
    ).toBe('https://yuumi.example/guide?tab=items&sub=success#core');
  });
});
