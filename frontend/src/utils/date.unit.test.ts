import { describe, expect, it } from 'vitest';
import { formatDisplayDate } from './date';

describe('formatDisplayDate', () => {
  it('formats an ISO date string for display', () => {
    expect(formatDisplayDate('2026-07-05T12:00:00.000Z')).toBe('Jul 5, 2026');
  });

  it('formats a Date object for display', () => {
    expect(formatDisplayDate(new Date('2026-07-05T12:00:00.000Z'))).toBe('Jul 5, 2026');
  });
});
