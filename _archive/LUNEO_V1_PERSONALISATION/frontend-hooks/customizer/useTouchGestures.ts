/**
 * useTouchGestures
 * Mobile touch support hook
 * Handles pinch-to-zoom, two-finger pan, and double-tap select
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface TouchPoint {
  x: number;
  y: number;
  id: number;
}

interface UseTouchGesturesReturn {
  onPinchZoom: (scale: number, centerX: number, centerY: number) => void;
  onTwoFingerPan: (deltaX: number, deltaY: number) => void;
  onDoubleTap: (x: number, y: number) => void;
  isTouching: boolean;
  touchHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

interface UseTouchGesturesOptions {
  onZoom?: (scale: number, centerX: number, centerY: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  onDoubleTapSelect?: (x: number, y: number) => void;
  enabled?: boolean;
}

/**
 * Mobile touch gestures hook
 */
export function useTouchGestures(options: UseTouchGesturesOptions = {}): UseTouchGesturesReturn {
  const { onZoom, onPan, onDoubleTapSelect, enabled = true } = options;

  const [isTouching, setIsTouching] = useState(false);
  const touchesRef = useRef<Map<number, TouchPoint>>(new Map());
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const initialDistanceRef = useRef<number | null>(null);
  const initialCenterRef = useRef<{ x: number; y: number } | null>(null);

  const getDistance = useCallback((touch1: TouchPoint, touch2: TouchPoint): number => {
    const dx = touch1.x - touch2.x;
    const dy = touch1.y - touch2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getCenter = useCallback((touch1: TouchPoint, touch2: TouchPoint): { x: number; y: number } => {
    return {
      x: (touch1.x + touch2.x) / 2,
      y: (touch1.y + touch2.y) / 2,
    };
  }, []);

  const handlePinchZoom = useCallback(
    (scale: number, centerX: number, centerY: number) => {
      if (onZoom) {
        onZoom(scale, centerX, centerY);
      }
    },
    [onZoom]
  );

  const handleTwoFingerPan = useCallback(
    (deltaX: number, deltaY: number) => {
      if (onPan) {
        onPan(deltaX, deltaY);
      }
    },
    [onPan]
  );

  const handleDoubleTap = useCallback(
    (x: number, y: number) => {
      if (onDoubleTapSelect) {
        onDoubleTapSelect(x, y);
      }
    },
    [onDoubleTapSelect]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;

      setIsTouching(true);
      const touches = Array.from(e.touches);

      // Update touches map
      touches.forEach((touch) => {
        touchesRef.current.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY,
          id: touch.identifier,
        });
      });

      // Handle pinch gesture (two touches)
      if (touches.length === 2) {
        const touch1 = touchesRef.current.get(touches[0].identifier);
        const touch2 = touchesRef.current.get(touches[1].identifier);

        if (touch1 && touch2) {
          initialDistanceRef.current = getDistance(touch1, touch2);
          initialCenterRef.current = getCenter(touch1, touch2);
        }
      }

      // Handle single tap for double-tap detection
      if (touches.length === 1) {
        const touch = touches[0];
        const now = Date.now();
        const lastTap = lastTapRef.current;

        if (lastTap && now - lastTap.time < 300) {
          // Double tap detected
          const dx = Math.abs(touch.clientX - lastTap.x);
          const dy = Math.abs(touch.clientY - lastTap.y);

          if (dx < 50 && dy < 50) {
            // Within threshold
            handleDoubleTap(touch.clientX, touch.clientY);
            lastTapRef.current = null;
          } else {
            lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };
          }
        } else {
          lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };
        }
      }
    },
    [enabled, getDistance, getCenter, handleDoubleTap]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;

      e.preventDefault();
      const touches = Array.from(e.touches);

      // Update touches map
      touches.forEach((touch) => {
        touchesRef.current.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY,
          id: touch.identifier,
        });
      });

      // Handle pinch zoom (two touches)
      if (touches.length === 2 && initialDistanceRef.current && initialCenterRef.current) {
        const touch1 = touchesRef.current.get(touches[0].identifier);
        const touch2 = touchesRef.current.get(touches[1].identifier);

        if (touch1 && touch2) {
          const currentDistance = getDistance(touch1, touch2);
          const scale = currentDistance / initialDistanceRef.current;
          const center = getCenter(touch1, touch2);

          handlePinchZoom(scale, center.x, center.y);
        }
      }

      // Handle two-finger pan
      if (touches.length === 2) {
        const touch1 = touchesRef.current.get(touches[0].identifier);
        const touch2 = touchesRef.current.get(touches[1].identifier);

        if (touch1 && touch2) {
          const center = getCenter(touch1, touch2);
          const prevCenter = initialCenterRef.current;

          if (prevCenter) {
            const deltaX = center.x - prevCenter.x;
            const deltaY = center.y - prevCenter.y;
            handleTwoFingerPan(deltaX, deltaY);
            initialCenterRef.current = center;
          }
        }
      }
    },
    [enabled, getDistance, getCenter, handlePinchZoom, handleTwoFingerPan]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;

      const touches = Array.from(e.touches);

      // Remove ended touches
      Array.from(e.changedTouches).forEach((touch) => {
        touchesRef.current.delete(touch.identifier);
      });

      // Reset if less than 2 touches
      if (touches.length < 2) {
        initialDistanceRef.current = null;
        initialCenterRef.current = null;
      }

      if (touchesRef.current.size === 0) {
        setIsTouching(false);
      }
    },
    [enabled]
  );

  return {
    onPinchZoom: handlePinchZoom,
    onTwoFingerPan: handleTwoFingerPan,
    onDoubleTap: handleDoubleTap,
    isTouching,
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
