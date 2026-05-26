import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

/**
 * jsdom in this config exposes a bare `localStorage` object without Storage methods,
 * so we install a minimal in-memory Storage mock for the read/write paths the hook uses.
 */
function installLocalStorageMock() {
  const store = new Map<string, string>();
  const mock: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    removeItem: (k: string) => void store.delete(k),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
  };
  Object.defineProperty(window, 'localStorage', { value: mock, configurable: true });
  Object.defineProperty(globalThis, 'localStorage', { value: mock, configurable: true });
}

/**
 * Regression coverage for the deep-merge restore path.
 *
 * Bug: on reload, `useLocalStorage` restores by deep-merging the stored value into the
 * default (schema) value. The merge previously iterated only the default's keys, so any
 * key present only in storage — `cellExclusions`, `staffJuhuDays`, `requiredNights`, all
 * dynamic-keyed — was silently dropped. These tests pin the source-only-key preservation
 * so the data loss cannot return unnoticed.
 */
describe('useLocalStorage restore (deep merge)', () => {
  const KEY = 'test-key';

  beforeEach(() => {
    installLocalStorageMock();
  });

  function seed(value: unknown) {
    localStorage.setItem(KEY, JSON.stringify(value));
  }

  it('preserves a top-level key that exists only in storage', () => {
    // default has no `extra`; storage does — it must survive restore
    seed({ a: 2, extra: 'kept' });
    const { result } = renderHook(() => useLocalStorage(KEY, { a: 1 }));
    expect(result.current[0]).toEqual({ a: 2, extra: 'kept' });
  });

  it('preserves dynamic record keys nested under an empty-object default (the cellExclusions case)', () => {
    // This is the case adding `cellExclusions: {}` to the default could NOT fix:
    // the recursion would re-strip the dynamic keys one level down.
    seed({ cellExclusions: { 'staff1-2025-01-06': ['N', 'D'] } });
    const { result } = renderHook(() =>
      useLocalStorage<{ cellExclusions: Record<string, string[]> }>(KEY, {
        cellExclusions: {},
      })
    );
    expect(result.current[0].cellExclusions).toEqual({
      'staff1-2025-01-06': ['N', 'D'],
    });
  });

  it('restores a realistic Schedule shape without losing cellExclusions / staffJuhuDays', () => {
    const stored = {
      id: 'sched-1',
      name: '근무표',
      startDate: '2025-01-06',
      assignments: [{ staffId: 's1', date: '2025-01-06', shift: 'N', isLocked: true }],
      cellExclusions: { 's1-2025-01-07': ['N'] },
      staffJuhuDays: [{ staffId: 's1', juhuDay: 3 }],
    };
    seed(stored);
    // default schema mirrors getDefaultSchedule(): no cellExclusions / staffJuhuDays key
    const { result } = renderHook(() =>
      useLocalStorage(KEY, {
        id: 'default',
        name: '근무표',
        startDate: '2025-01-01',
        assignments: [],
      })
    );
    expect(result.current[0]).toEqual(stored);
  });

  it('still preserves a default-only key (forward-compat for newly added schema fields)', () => {
    seed({ a: 2 });
    const { result } = renderHook(() =>
      useLocalStorage(KEY, { a: 1, newField: 'default' })
    );
    expect(result.current[0]).toEqual({ a: 2, newField: 'default' });
  });

  it('replaces arrays wholesale rather than merging element-wise', () => {
    seed({ items: [1, 2, 3] });
    const { result } = renderHook(() =>
      useLocalStorage<{ items: number[] }>(KEY, { items: [] })
    );
    expect(result.current[0].items).toEqual([1, 2, 3]);
  });

  it('lets stored scalar values override the default', () => {
    seed({ a: 'stored' });
    const { result } = renderHook(() => useLocalStorage(KEY, { a: 'default' }));
    expect(result.current[0].a).toBe('stored');
  });

  it('does not let a tampered __proto__ key pollute the restored object prototype', () => {
    // JSON.parse makes "__proto__" an own-enumerable key; iterating source keys must not
    // route it through result[key] = ... and reassign the prototype.
    localStorage.setItem(KEY, '{"a":2,"__proto__":{"polluted":true}}');
    const { result } = renderHook(() => useLocalStorage(KEY, { a: 1 }));
    const restored = result.current[0] as Record<string, unknown>;
    expect(restored.a).toBe(2);
    expect('polluted' in restored).toBe(false);
    expect(Object.getPrototypeOf(restored)).toBe(Object.prototype);
    // global prototype must remain clean as well
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
