import { format, addDays, isWeekend as dateFnsIsWeekend, parseISO } from 'date-fns';
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
