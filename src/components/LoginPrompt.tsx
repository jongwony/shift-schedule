/**
 * Login dialog shown when unauthenticated user clicks "자동 생성".
 * Uses Google Identity Services for sign-in.
 */

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

interface LoginPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
              locale?: string;
            },
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export function LoginPrompt({ open, onOpenChange }: LoginPromptProps) {
  const { signIn } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        await signIn(response.credential);
        onOpenChange(false);
        toast.success('로그인되었습니다.');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '로그인에 실패했습니다.';
        toast.error(message);
      }
    },
    [signIn, onOpenChange],
  );

  useEffect(() => {
    if (!open || !GOOGLE_CLIENT_ID) return;

    const initializeGoogle = () => {
      if (!window.google || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      // Clear previous button content
      buttonRef.current.innerHTML = '';

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 300,
        text: 'signin_with',
        shape: 'rectangular',
        locale: 'ko',
      });
    };

    if (window.google) {
      initializeGoogle();
      return;
    }

    if (!scriptLoaded.current) {
      scriptLoaded.current = true;
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      script.onerror = () => {
        toast.error('Google 로그인을 불러올 수 없습니다.');
      };
      document.head.appendChild(script);
    }
  }, [open, handleCredentialResponse]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">
            교대근무 자동 생성 서비스
          </DialogTitle>
          <DialogDescription className="text-center">
            로그인하면 근무표 자동 생성 기능을 사용할 수 있습니다.
            매월 3회 무료로 제공됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {/* Google Sign-In button rendered by GIS */}
          <div ref={buttonRef} className="flex justify-center" />

          <p className="text-xs text-muted-foreground text-center">
            로그인 시{' '}
            <span className="underline">이용약관</span> 및{' '}
            <span className="underline">개인정보처리방침</span>에 동의합니다.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
