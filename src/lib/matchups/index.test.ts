import { describe, expect, it } from 'vitest';
import {
  ADC_CHAMPIONS,
  ADC_MATCHUPS,
  SUPPORT_CHAMPIONS,
  SUPPORT_MATCHUPS,
} from './index';

function sorted(values: string[]) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

describe('matchup registry parity', () => {
  it('keeps support champion list aligned with exported support matchups', () => {
    expect(sorted(Object.keys(SUPPORT_MATCHUPS))).toEqual(
      sorted(SUPPORT_CHAMPIONS)
    );
  });

  it('keeps adc champion list aligned with exported adc synergies', () => {
    expect(sorted(Object.keys(ADC_MATCHUPS))).toEqual(sorted(ADC_CHAMPIONS));
  });
});
