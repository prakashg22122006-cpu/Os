
import { useEffect, useRef, RefObject } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function useSwipeGestures(handlers: SwipeHandlers, elementRef: RefObject<HTMLElement>) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const minSwipeDistance = 50;

  useEffect(() => {
    const target = elementRef.current;
    if (!target) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const dx = touchEndX - touchStart.current.x;
      const dy = touchEndY - touchStart.current.y;

      if (Math.abs(dx) > Math.abs(dy)) { // Horizontal swipe
        if (Math.abs(dx) > minSwipeDistance) {
          if (dx > 0) {
            handlers.onSwipeRight?.();
          } else {
            handlers.onSwipeLeft?.();
          }
        }
      } else { // Vertical swipe
        if (Math.abs(dy) > minSwipeDistance) {
          if (dy > 0) {
            handlers.onSwipeDown?.();
          } else {
            handlers.onSwipeUp?.();
          }
        }
      }
      touchStart.current = null;
    };

    target.addEventListener('touchstart', handleTouchStart, { passive: true });
    target.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      target.removeEventListener('touchstart', handleTouchStart);
      target.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers, elementRef]);
}
