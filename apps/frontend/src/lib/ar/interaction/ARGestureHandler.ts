/**
 * Touch gestures for AR: pinch, rotate, pan.
 * @module ar/interaction/ARGestureHandler
 */

import { logger } from '@/lib/logger';

type GestureCallback = (payload: { scale?: number; rotation?: number; deltaX?: number; deltaY?: number }) => void;

/**
 * Handles touch gestures (pinch, rotate, pan) on an element for AR control.
 */
export class ARGestureHandler {
  private element: HTMLElement | null = null;
  private onPinchCallback: GestureCallback | null = null;
  private onRotateCallback: GestureCallback | null = null;
  private onPanCallback: GestureCallback | null = null;
  private initialDistance = 0;
  private initialAngle = 0;
  private initialCenter = { x: 0, y: 0 };
  private lastPan = { x: 0, y: 0 };
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;

  constructor() {
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
  }

  /**
   * Initialize gesture handling on the given element.
   */
  initialize(element: HTMLElement): void {
    this.cleanup();
    this.element = element;
    element.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    element.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    element.addEventListener('touchend', this.boundTouchEnd, { passive: true });
    element.addEventListener('touchcancel', this.boundTouchEnd, { passive: true });
    logger.debug('ARGestureHandler: initialized');
  }

  private getTouchCenter(touches: TouchList): { x: number; y: number } {
    if (touches.length === 0) return { x: 0, y: 0 };
    let x = 0, y = 0;
    for (let i = 0; i < touches.length; i++) {
      x += touches[i].clientX;
      y += touches[i].clientY;
    }
    return { x: x / touches.length, y: y / touches.length };
  }

  private getDistance(touches: TouchList): number {
    if (touches.length < 2) return 0;
    const a = touches[0], b = touches[1];
    return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
  }

  private getAngle(touches: TouchList): number {
    if (touches.length < 2) return 0;
    const a = touches[0], b = touches[1];
    return Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX);
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 2) {
      this.initialDistance = this.getDistance(e.touches);
      this.initialAngle = this.getAngle(e.touches);
      this.initialCenter = this.getTouchCenter(e.touches);
    } else if (e.touches.length === 1) {
      this.lastPan = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 2) {
      const scale = this.getDistance(e.touches) / (this.initialDistance || 1);
      this.onPinchCallback?.({ scale });
      const angle = this.getAngle(e.touches) - this.initialAngle;
      this.onRotateCallback?.({ rotation: angle });
    } else if (e.touches.length === 1 && this.onPanCallback) {
      const dx = e.touches[0].clientX - this.lastPan.x;
      const dy = e.touches[0].clientY - this.lastPan.y;
      this.lastPan = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.onPanCallback({ deltaX: dx, deltaY: dy });
    }
  }

  private handleTouchEnd(): void {
    // Reset state on release if needed
  }

  onPinch(callback: GestureCallback): void {
    this.onPinchCallback = callback;
  }

  onRotate(callback: GestureCallback): void {
    this.onRotateCallback = callback;
  }

  onPan(callback: GestureCallback): void {
    this.onPanCallback = callback;
  }

  /**
   * Remove listeners and references.
   */
  cleanup(): void {
    if (this.element) {
      this.element.removeEventListener('touchstart', this.boundTouchStart);
      this.element.removeEventListener('touchmove', this.boundTouchMove);
      this.element.removeEventListener('touchend', this.boundTouchEnd);
      this.element.removeEventListener('touchcancel', this.boundTouchEnd);
      this.element = null;
    }
    this.onPinchCallback = null;
    this.onRotateCallback = null;
    this.onPanCallback = null;
    logger.debug('ARGestureHandler: cleanup');
  }
}
