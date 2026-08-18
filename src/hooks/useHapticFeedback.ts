import { useCallback } from 'react';

export type HapticFeedbackType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'
  | 'impact'
  | 'mealLogged'
  | 'workoutCompleted'
  | 'waterLogged'
  | 'goalAchieved';

/**
 * Vibration durations / patterns (in milliseconds)
 */
const HAPTIC_PATTERNS: Record<HapticFeedbackType, number | number[]> = {
  light: 12,
  medium: 28,
  heavy: 55,
  selection: 8,
  impact: 35,
  success: [15, 60, 25],
  warning: [35, 45, 35],
  error: [50, 40, 50, 40, 75],
  mealLogged: [20, 50, 30],
  workoutCompleted: [30, 40, 30, 40, 60],
  waterLogged: [15, 30, 15],
  goalAchieved: [40, 60, 40, 60, 80],
};

/**
 * useHapticFeedback Hook
 * Triggers native device vibration patterns (via navigator.vibrate) during key app interactions
 * Gracefully degrades when vibration API is unsupported or restricted.
 */
export function useHapticFeedback() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function';

  const trigger = useCallback(
    (type: HapticFeedbackType = 'light'): boolean => {
      if (!isSupported) {
        return false;
      }

      try {
        const pattern = HAPTIC_PATTERNS[type] || 15;
        return navigator.vibrate(pattern);
      } catch (e) {
        // Quietly catch sandbox / security restrictions
        console.debug('Haptic feedback error:', e);
        return false;
      }
    },
    [isSupported]
  );

  const stop = useCallback(() => {
    if (isSupported) {
      try {
        navigator.vibrate(0);
      } catch (e) {
        console.debug('Haptic stop error:', e);
      }
    }
  }, [isSupported]);

  return {
    trigger,
    stop,
    isSupported,
  };
}
