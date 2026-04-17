import { format, addDays, isWeekend as dateFnsIsWeekend, parseISO, endOfMonth, differenceInCalendarDays } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * Format a date in Korean style: "1/3(금)"
 */
export function formatDateKorean(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = format(date, 'EEE', { locale: ko });
  return `${month}/${day}(${dayOfWeek})`;
}

/**
 * Get the boundaries (start dates) of 4 weeks starting from startDate.
 * Returns an array of ISO date strings representing the first day of each week.
 */
export function getWeekBoundaries(startDate: string): string[] {
  const start = parseISO(startDate);
  const boundaries: string[] = [];

  for (let i = 0; i < 4; i++) {
    const weekStart = addDays(start, i * 7);
    boundaries.push(format(weekStart, 'yyyy-MM-dd'));
  }

  return boundaries;
}

/**
 * Iterate over each date in a range, calling the callback for each date.
 */
export function forEachDateInRange(
  start: string,
  days: number,
  callback: (date: Date, dateString: string, index: number) => void
): void {
  const startDate = parseISO(start);

  for (let i = 0; i < days; i++) {
    const currentDate = addDays(startDate, i);
    const dateString = format(currentDate, 'yyyy-MM-dd');
    callback(currentDate, dateString, i);
  }
}

/**
 * Check if a date falls on a weekend (Saturday or Sunday).
 */
export function isWeekend(date: Date): boolean {
  return dateFnsIsWeekend(date);
}

export interface WindowSplit {
  /** Days in the start month (window front = closing month's tail). 0 if startDate is the 1st. */
  frontDays: number;
  /** Last date of front portion (ISO). null when frontDays === 0. */
  frontEndDate: string | null;
  /** First date of back portion (ISO). null when window does not cross a month boundary. */
  backStartDate: string | null;
  /** Days in the back portion (window back = opening month's head). */
  backDays: number;
}

/**
 * Split a scheduling window by the month boundary.
 *
 * Semantics:
 * - Front portion = days from startDate through the last day of startDate's month (= closing month's tail)
 * - Back portion = days from the 1st of the next month through the window end (= opening month's head)
 * - Special case: startDate on the 1st of a month → frontDays = 0 (no "previous month tail" exists)
 * - Special case: window does not cross a month boundary → backDays = 0
 */
export function splitWindowByMonth(startDate: string, numDays: number): WindowSplit {
  const start = parseISO(startDate);

  if (start.getDate() === 1) {
    return { frontDays: 0, frontEndDate: null, backStartDate: startDate, backDays: numDays };
  }

  const endOfStartMonth = endOfMonth(start);
  const frontDaysRaw = differenceInCalendarDays(endOfStartMonth, start) + 1;
  const frontDays = Math.min(frontDaysRaw, numDays);
  const frontEndDate = format(addDays(start, frontDays - 1), 'yyyy-MM-dd');

  if (frontDays === numDays) {
    return { frontDays, frontEndDate, backStartDate: null, backDays: 0 };
  }

  const backStart = addDays(start, frontDays);
  return {
    frontDays,
    frontEndDate,
    backStartDate: format(backStart, 'yyyy-MM-dd'),
    backDays: numDays - frontDays,
  };
}
