import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Deep merge two objects. Values from `source` override `target`.
 * New keys in `target` (not in `source`) are preserved.
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
  if (target === null || typeof target !== 'object' || Array.isArray(target)) {
    return (source ?? target) as T;
  }
  if (source === null || typeof source !== 'object' || Array.isArray(source)) {
    return (source ?? target) as T;
  }

  const result = { ...target } as Record<string, unknown>;
  for (const key of Object.keys(target as object)) {
    if (key in source) {
      const targetVal = (target as Record<string, unknown>)[key];
      const sourceVal = (source as Record<string, unknown>)[key];
      if (
        targetVal !== null &&
        typeof targetVal === 'object' &&
        !Array.isArray(targetVal) &&
        sourceVal !== null &&
        typeof sourceVal === 'object' &&
        !Array.isArray(sourceVal)
      ) {
        result[key] = deepMerge(targetVal, sourceVal);
      } else {
        result[key] = sourceVal;
      }
    }
    // Keys only in target are already in result via spread
  }
  return result as T;
}

/**
 * Custom hook for persisting state to localStorage with cross-tab synchronization.
 *
 * Features:
 * - Generic type support with JSON serialization
 * - SSR safety (checks for window existence)
 * - Cross-tab sync via storage event listener
 * - Functional updates support
 *
 * @param key - localStorage key
 * @param initialValue - Default value if no stored value exists
 * @returns Tuple of [value, setValue] similar to useState
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    // SSR safety check
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const stored = JSON.parse(item);
        // Deep merge: initialValue provides schema, stored provides values
        return deepMerge(initialValue, stored);
      }
      return initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Track if this is the first render to avoid unnecessary writes
  const isFirstRender = useRef(true);

  // Persist to localStorage whenever value changes
  useEffect(() => {
    // Skip first render to avoid writing initial value back
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Still sync to localStorage if there's no existing value
      if (typeof window !== 'undefined') {
        const existing = window.localStorage.getItem(key);
        if (existing === null) {
          try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
          } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
          }
        }
      }
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Listen for changes in other tabs
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const newValue = JSON.parse(event.newValue) as T;
          setStoredValue(newValue);
        } catch (error) {
          console.warn(`Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  // Setter function supporting both direct values and functional updates
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const nextValue = value instanceof Function ? value(prev) : value;
      return nextValue;
    });
  }, []);

  return [storedValue, setValue];
}
