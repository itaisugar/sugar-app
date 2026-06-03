import { useEffect, useState } from 'react';
import { AccessibilityInfo, Easing, Platform } from 'react-native';

// Shared "modern line" easing — cubic-bezier(.2,.7,.2,1).
export const EASE = Easing.bezier(0.2, 0.7, 0.2, 1);

// Returns true when the user prefers reduced motion. Animations should settle
// to their final/resting state instead of looping when this is true.
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (Platform.OS === 'web') {
      const mq = typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
      if (!mq) return;
      setReduced(mq.matches);
      const onChange = () => mounted && setReduced(mq.matches);
      mq.addEventListener?.('change', onChange);
      return () => { mounted = false; mq.removeEventListener?.('change', onChange); };
    }

    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setReduced(v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => mounted && setReduced(v));
    return () => { mounted = false; sub.remove?.(); };
  }, []);

  return reduced;
}
