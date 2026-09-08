import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FirstVisitGuide } from '../FirstVisitGuide';
import {
  dismissFirstVisitGuide,
  FIRST_VISIT_GUIDE_STORAGE_KEY,
  FIRST_VISIT_GUIDE_STORAGE_VERSION,
  hasDismissedFirstVisitGuide,
} from '../firstVisitGuideStorage';

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  localStorage.clear();
  vi.restoreAllMocks();
});

function renderOpenGuide(onOpenChange = vi.fn()) {
  const restoreFocusTarget = document.createElement('button');
  restoreFocusTarget.type = 'button';
  restoreFocusTarget.textContent = '사용 안내';
  document.body.appendChild(restoreFocusTarget);

  render(
    <FirstVisitGuide
      open
      onOpenChange={onOpenChange}
      restoreFocusRef={{ current: restoreFocusTarget }}
    />,
  );

  return { onOpenChange, restoreFocusTarget };
}

describe('FirstVisitGuide', () => {
  it('shows concise editor steps and both next actions', () => {
    renderOpenGuide();

    expect(screen.getByRole('dialog', { name: '근무표 편집기 사용 안내' })).toBeInTheDocument();
    expect(screen.getByText('직원관리 탭에서 직원 이름을 추가하세요.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '샘플로 둘러보기' })).toHaveAttribute('href', '/demo');
    expect(screen.getByRole('button', { name: '내 근무표 만들기' })).toBeInTheDocument();
  });

  it.each([
    ['the primary action', () => fireEvent.click(screen.getByRole('button', { name: '내 근무표 만들기' }))],
    ['the sample action', () => fireEvent.click(screen.getByRole('link', { name: '샘플로 둘러보기' }))],
    ['the close button', () => fireEvent.click(screen.getByRole('button', { name: 'Close' }))],
    ['Escape', () => fireEvent.keyDown(document, { key: 'Escape' })],
    ['an outside click', async () => {
      const overlay = document.querySelector('[data-state="open"].fixed.inset-0');
      if (!overlay) throw new Error('dialog overlay not found');
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      fireEvent.pointerDown(overlay);
    }],
  ])('notifies the parent when closed through %s', async (_path, close) => {
    const { onOpenChange } = renderOpenGuide();

    await act(async () => {
      await close();
    });

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('returns focus to the guide button when an auto-opened dialog closes', async () => {
    const restoreFocusTarget = document.createElement('button');
    restoreFocusTarget.type = 'button';
    restoreFocusTarget.textContent = '사용 안내';
    document.body.appendChild(restoreFocusTarget);

    function ControlledGuide() {
      const [open, setOpen] = useState(true);
      const restoreFocusRef = useRef<HTMLElement | null>(restoreFocusTarget);
      return (
        <FirstVisitGuide
          open={open}
          onOpenChange={setOpen}
          restoreFocusRef={restoreFocusRef}
        />
      );
    }

    render(<ControlledGuide />);

    fireEvent.click(screen.getByRole('button', { name: '내 근무표 만들기' }));

    await waitFor(() => expect(restoreFocusTarget).toHaveFocus());
  });
});

describe('first-visit guide storage', () => {
  it('uses a versioned dedicated marker and ignores other versions', () => {
    expect(hasDismissedFirstVisitGuide()).toBe(false);

    localStorage.setItem(
      FIRST_VISIT_GUIDE_STORAGE_KEY,
      JSON.stringify({ version: FIRST_VISIT_GUIDE_STORAGE_VERSION - 1, dismissed: true }),
    );
    expect(hasDismissedFirstVisitGuide()).toBe(false);

    dismissFirstVisitGuide();
    expect(hasDismissedFirstVisitGuide()).toBe(true);
    expect(JSON.parse(localStorage.getItem(FIRST_VISIT_GUIDE_STORAGE_KEY) ?? '{}')).toEqual({
      version: FIRST_VISIT_GUIDE_STORAGE_VERSION,
      dismissed: true,
    });
  });

  it('keeps storage failures isolated from the editor', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(() => hasDismissedFirstVisitGuide()).not.toThrow();
    expect(hasDismissedFirstVisitGuide()).toBe(false);
    expect(() => dismissFirstVisitGuide()).not.toThrow();
  });
});
