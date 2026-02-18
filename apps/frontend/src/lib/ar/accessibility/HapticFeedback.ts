/**
 * Haptic feedback (Vibration API) for AR interactions.
 * @module ar/accessibility/HapticFeedback
 */

/**
 * Triggers haptic/vibration patterns for placement and errors.
 */
export class HapticFeedback {
  /**
   * Trigger a vibration pattern (ms on/off).
   */
  vibrate(pattern: number | number[]): void {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    navigator.vibrate(pattern);
  }

  /**
   * Short vibration on object placement.
   */
  onPlacement(): void {
    this.vibrate(50);
  }

  /**
   * Error vibration pattern (longer, repeated).
   */
  onError(): void {
    this.vibrate([100, 50, 100]);
  }
}
