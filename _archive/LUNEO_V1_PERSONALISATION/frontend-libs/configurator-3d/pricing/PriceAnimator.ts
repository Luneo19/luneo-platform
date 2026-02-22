/**
 * Price Animator - Smooth animated transitions for price display
 * Uses requestAnimationFrame with ease-out timing
 */

export class PriceAnimator {
  private currentValue: number;
  private targetValue: number;
  private animationFrame: number | null = null;
  private onUpdate: (value: number) => void;
  private startTime: number = 0;
  private startValue: number = 0;
  private duration: number = 300;

  constructor(initialValue: number, onUpdate: (value: number) => void) {
    this.currentValue = initialValue;
    this.targetValue = initialValue;
    this.onUpdate = onUpdate;
  }

  /**
   * Animate from current value to target
   * @param target Target price value
   * @param duration Duration in ms (default 300)
   */
  animateTo(target: number, duration?: number): void {
    this.stop();

    this.targetValue = target;
    this.startValue = this.currentValue;
    this.startTime = performance.now();
    this.duration = duration ?? 300;

    const tick = (now: number) => {
      const elapsed = now - this.startTime;
      const progress = Math.min(elapsed / this.duration, 1);
      const eased = this.easeOutCubic(progress);

      this.currentValue = this.startValue + (this.targetValue - this.startValue) * eased;
      this.onUpdate(this.currentValue);

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(tick);
      } else {
        this.currentValue = this.targetValue;
        this.onUpdate(this.currentValue);
        this.animationFrame = null;
      }
    };

    this.animationFrame = requestAnimationFrame(tick);
  }

  /**
   * Stop any running animation
   */
  stop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Clean up and stop
   */
  destroy(): void {
    this.stop();
  }

  /**
   * Get current value (animated or final)
   */
  getValue(): number {
    return this.currentValue;
  }

  /**
   * Set value immediately without animation
   */
  setImmediate(value: number): void {
    this.stop();
    this.currentValue = value;
    this.targetValue = value;
    this.onUpdate(value);
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
}
