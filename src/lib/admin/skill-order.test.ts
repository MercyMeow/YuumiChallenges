import { describe, expect, it } from 'vitest';
import {
  canAssignSkillAtLevel,
  getSkillOrderValidationError,
} from './skill-order';

const VALID_LEVELS = [
  'E',
  'W',
  'Q',
  'E',
  'E',
  'R',
  'E',
  'W',
  'E',
  'W',
  'R',
  'W',
  'W',
  'Q',
  'Q',
  'R',
  'Q',
  'Q',
];

describe('skill order validation', () => {
  it('accepts a level-valid 18-rank order', () => {
    expect(getSkillOrderValidationError(VALID_LEVELS)).toBeNull();
  });

  it('rejects a basic-skill rank before its champion-level unlock', () => {
    const earlyQMax = [
      'Q',
      'Q',
      'Q',
      'Q',
      'Q',
      'R',
      'E',
      'E',
      'E',
      'E',
      'R',
      'E',
      'W',
      'W',
      'W',
      'R',
      'W',
      'W',
    ];

    expect(getSkillOrderValidationError(earlyQMax)).toContain(
      'Q rank 2 is not available at level 2'
    );
  });

  it('offers only replacements that leave the complete order valid', () => {
    expect(canAssignSkillAtLevel(VALID_LEVELS, 0, 'E')).toBe(true);
    expect(canAssignSkillAtLevel(VALID_LEVELS, 0, 'Q')).toBe(true);
    expect(canAssignSkillAtLevel(VALID_LEVELS, 1, 'E')).toBe(false);
    expect(canAssignSkillAtLevel(VALID_LEVELS, 5, 'Q')).toBe(false);
  });
});
