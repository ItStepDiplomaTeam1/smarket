import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export const useIdleTimeout = (timeoutMinutes: number | null) => {
  const logout = useAuthStore((state) => state.logout);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    if (timeoutMinutes) {
      timeoutId.current = setTimeout(() => {
        logout();
      }, timeoutMinutes * 60 * 1000);
    }
  };

  useEffect(() => {
    if (!timeoutMinutes) {
      if (timeoutId.current) clearTimeout(timeoutId.current);
      return;
    }

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
    ];

    const handleActivity = () => resetTimer();

    // Set initial timer
    resetTimer();

    events.forEach((event) => document.addEventListener(event, handleActivity));

    return () => {
      events.forEach((event) => document.removeEventListener(event, handleActivity));
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, [timeoutMinutes, logout]);
};
