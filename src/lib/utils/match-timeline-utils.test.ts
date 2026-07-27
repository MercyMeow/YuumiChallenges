import { describe, expect, it } from 'vitest';
import {
  arrayIndexToRiotParticipantId,
  detectSupportItemCompletion,
  formatMillisecondsToTime,
  formatSecondsToTime,
  getDurationBetween,
  getNextEvolutionItemId,
  getSupportItemChain,
  getSupportItemCompletion,
  isFinalSupportItemEvolution,
  isSupportItem,
  parseTimeToMilliseconds,
  riotParticipantIdToArrayIndex,
  validateParticipantMapping,
} from './match-timeline-utils';

describe('timeline time formatting', () => {
  it('formats milliseconds and seconds consistently', () => {
    expect(formatMillisecondsToTime(65_000)).toBe('1:05');
    expect(formatMillisecondsToTime(3_665_000)).toBe('61:05');
    expect(formatSecondsToTime(125)).toBe('2:05');
    expect(getDurationBetween(0, 65_000)).toBe('1:05');
  });

  it('handles invalid and boundary inputs', () => {
    expect(formatMillisecondsToTime(-1)).toBe('0:00');
    expect(formatMillisecondsToTime(null)).toBe('0:00');
    expect(formatSecondsToTime(Number.NaN)).toBe('0:00');
    expect(parseTimeToMilliseconds('1:05')).toBe(65_000);
    expect(parseTimeToMilliseconds('65:42')).toBe(3_942_000);
    expect(parseTimeToMilliseconds('invalid')).toBeNull();
  });
});

describe('support item progression', () => {
  it('identifies support items and their evolution chain', () => {
    expect(isSupportItem(3865)).toBe(true);
    expect(isSupportItem(1001)).toBe(false);
    expect(isSupportItem(null)).toBe(false);

    expect(getSupportItemCompletion(3865)).toMatchObject({
      isSupportItem: true,
      tier: 'base',
      isFinalEvolution: false,
    });
    expect(getNextEvolutionItemId(3865)).toBe(3866);
    expect(getNextEvolutionItemId(3866)).toBe(3867);
    expect(getNextEvolutionItemId(3867)).toBe(0);
    expect(isFinalSupportItemEvolution(3870)).toBe(true);
    expect(getSupportItemChain(3866)).toEqual([
      3865, 3866, 3867, 3869, 3870, 3871, 3876, 3877,
    ]);
  });

  it('finds the first completion time for each support-item tier', () => {
    const events = [
      { itemId: 3865, timestamp: 60_000, type: 'ITEM_PURCHASED' },
      { itemId: 3866, timestamp: 180_000, type: 'ITEM_PURCHASED' },
      { itemId: 3867, timestamp: 300_000, type: 'ITEM_PURCHASED' },
      { itemId: 3870, timestamp: 420_000, type: 'ITEM_PURCHASED' },
    ];

    expect(detectSupportItemCompletion(null, events)).toEqual({
      base: 60_000,
      tier1: 180_000,
      tier2: 300_000,
      tier3: 420_000,
    });
  });
});

describe('participant id mapping', () => {
  it('converts between Riot ids and array indexes', () => {
    expect(riotParticipantIdToArrayIndex(1)).toBe(0);
    expect(riotParticipantIdToArrayIndex(10)).toBe(9);
    expect(riotParticipantIdToArrayIndex(0)).toBe(-1);
    expect(arrayIndexToRiotParticipantId(0)).toBe(1);
    expect(arrayIndexToRiotParticipantId(9)).toBe(10);
    expect(arrayIndexToRiotParticipantId(10)).toBe(0);
  });

  it('reports invalid mappings instead of inventing ids', () => {
    expect(validateParticipantMapping(1, true)).toEqual({
      valid: true,
      arrayIndex: 0,
      riotId: 1,
    });
    expect(validateParticipantMapping(11, true)).toEqual({
      valid: false,
      arrayIndex: -1,
      riotId: 0,
    });
  });
});
