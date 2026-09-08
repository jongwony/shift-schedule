/**
 * This key belongs only to the editor onboarding guide. The version lives in
 * the value so a future guide can be shown again without touching user data.
 */
export const FIRST_VISIT_GUIDE_STORAGE_KEY = 'shift-schedule-first-visit-guide';
export const FIRST_VISIT_GUIDE_STORAGE_VERSION = 1;

interface FirstVisitGuideStorageValue {
  version: number;
  dismissed: boolean;
}

/**
 * Read the guide dismissal marker without allowing storage restrictions to
 * affect the editor. A marker from an older guide version is intentionally
 * treated as undisclosed so the current guide can be shown once.
 */
export function hasDismissedFirstVisitGuide(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = window.localStorage.getItem(FIRST_VISIT_GUIDE_STORAGE_KEY);
    if (!stored) return false;
    const value = JSON.parse(stored) as Partial<FirstVisitGuideStorageValue>;
    return (
      value.version === FIRST_VISIT_GUIDE_STORAGE_VERSION &&
      value.dismissed === true
    );
  } catch {
    // Private browsing and blocked storage are valid browser states. In that
    // case the guide remains dismissible for this app mount only.
    return false;
  }
}

/** Persist the dismissal marker; a failed write must not break the editor. */
export function dismissFirstVisitGuide(): void {
  if (typeof window === 'undefined') return;

  const value: FirstVisitGuideStorageValue = {
    version: FIRST_VISIT_GUIDE_STORAGE_VERSION,
    dismissed: true,
  };

  try {
    window.localStorage.setItem(
      FIRST_VISIT_GUIDE_STORAGE_KEY,
      JSON.stringify(value),
    );
  } catch {
    // If storage is unavailable, the in-memory marker still protects this
    // mounted editor; a later page load may show the guide again.
  }
}
