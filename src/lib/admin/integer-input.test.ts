import { describe, expect, it } from 'vitest';
import { MAX_ADMIN_PRIORITY, parseAdminIntegerInput } from './integer-input';

describe('parseAdminIntegerInput', () => {
  it('accepts plain decimal integers within bounds', () => {
    expect(parseAdminIntegerInput('6617', { minimum: 1 })).toBe(6617);
    expect(parseAdminIntegerInput('006617', { minimum: 1 })).toBe(6617);
    expect(
      parseAdminIntegerInput('0', {
        minimum: 0,
        maximum: MAX_ADMIN_PRIORITY,
      })
    ).toBe(0);
  });

  it.each(['1.5', '1e3', '1E3', '-1', '+1', '', 'Infinity'])(
    'rejects non-canonical integer input %s',
    (input) => {
      expect(parseAdminIntegerInput(input, { minimum: 0 })).toBeNull();
    }
  );

  it('rejects unsafe and out-of-range integers', () => {
    expect(
      parseAdminIntegerInput(String(Number.MAX_SAFE_INTEGER + 1), {
        minimum: 1,
      })
    ).toBeNull();
    expect(
      parseAdminIntegerInput(String(MAX_ADMIN_PRIORITY + 1), {
        minimum: 0,
        maximum: MAX_ADMIN_PRIORITY,
      })
    ).toBeNull();
  });
});
