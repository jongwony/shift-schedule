import { describe, it, expect } from 'vitest';
import { splitWindowByMonth } from '../dateUtils';

describe('splitWindowByMonth', () => {
  it('splits a mid-month start across a month boundary', () => {
    const result = splitWindowByMonth('2026-04-26', 28);
    expect(result).toEqual({
      frontDays: 5,
      frontEndDate: '2026-04-30',
      backStartDate: '2026-05-01',
      backDays: 23,
    });
  });

  it('returns frontDays=0 when startDate is the 1st of a month', () => {
    const result = splitWindowByMonth('2026-05-01', 28);
    expect(result).toEqual({
      frontDays: 0,
      frontEndDate: null,
      backStartDate: '2026-05-01',
      backDays: 28,
    });
  });

  it('returns frontDays=1 when startDate is the last day of a month', () => {
    const result = splitWindowByMonth('2026-04-30', 28);
    expect(result).toEqual({
      frontDays: 1,
      frontEndDate: '2026-04-30',
      backStartDate: '2026-05-01',
      backDays: 27,
    });
  });

  it('keeps window entirely within start month when it does not cross a boundary', () => {
    const result = splitWindowByMonth('2026-01-02', 28);
    expect(result).toEqual({
      frontDays: 28,
      frontEndDate: '2026-01-29',
      backStartDate: null,
      backDays: 0,
    });
  });

  it('handles February correctly (non-leap year)', () => {
    const result = splitWindowByMonth('2026-02-15', 28);
    expect(result).toEqual({
      frontDays: 14,
      frontEndDate: '2026-02-28',
      backStartDate: '2026-03-01',
      backDays: 14,
    });
  });
});
