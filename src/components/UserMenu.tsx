/**
 * User avatar dropdown menu for authenticated users.
 * Shows plan badge, subscription management, and sign-out.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { AuthUser } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';

interface UserMenuProps {
  user: AuthUser;
}

const PLAN_LABELS: Record<string, string> = {
  free: '무료',
  daypass: 'Day Pass',
  annual: 'Annual',
};

export function UserMenu({ user }: UserMenuProps) {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initial = user.name.charAt(0).toUpperCase();
  const planLabel = PLAN_LABELS[user.plan] ?? user.plan;

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  const handleSubscriptionManage = useCallback(() => {
    setOpen(false);
    toast.info('준비 중');
  }, []);

  const handleSignOut = useCallback(() => {
    setOpen(false);
    signOut();
    toast.success('로그아웃되었습니다.');
  }, [signOut]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-medium">
          {initial}
        </span>
        <span className="text-sm text-gray-700 hidden sm:inline">
          {user.name}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-30 py-1">
          {/* Plan badge */}
          <div className="px-3 py-2 border-b border-gray-100">
            <span className="text-xs text-muted-foreground">현재 플랜</span>
            <div className="mt-0.5">
              <span
                className={
                  user.plan === 'annual'
                    ? 'text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700'
                    : user.plan === 'daypass'
                      ? 'text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700'
                      : 'text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600'
                }
              >
                {planLabel}
              </span>
            </div>
          </div>

          {/* Menu items */}
          <button
            type="button"
            onClick={handleSubscriptionManage}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            구독 관리
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
