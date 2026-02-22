'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface TouchGesturesProps {
  children: React.ReactNode;
  onPinchZoom?: (scale: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  onDoubleTap?: () => void;
  onLongPress?: (x: number, y: number) => void;
  minZoom?: number;
  maxZoom?: number;
}

export function TouchGestures({
  children,
  onPinchZoom,
  onPan,
  onDoubleTap,
  onLongPress,
  minZoom = 0.5,
  maxZoom = 3,
}: TouchGesturesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touches, setTouches] = useState<Map<number, React.Touch>>(new Map());
  const [lastTap, setLastTap] = useState<number>(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [pinchStart, setPinchStart] = useState<number | null>(null);

  const getDistance = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const newTouches = new Map(touches);
      Array.from(e.touches).forEach((touch) => {
        newTouches.set(touch.identifier, touch);
      });
      setTouches(newTouches);

      // Single touch - pan or long press
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        setPanStart({ x: touch.clientX, y: touch.clientY });

        // Long press detection
        const timer = setTimeout(() => {
          if (onLongPress) {
            onLongPress(touch.clientX, touch.clientY);
          }
        }, 500);
        setLongPressTimer(timer);
      }

      // Two touches - pinch zoom
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = getDistance(touch1, touch2);
        setPinchStart(distance);
        setPanStart(null);
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          setLongPressTimer(null);
        }
      }
    },
    [touches, getDistance, onLongPress, longPressTimer]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();

      // Cancel long press if moving
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }

      // Two touches - pinch zoom
      if (e.touches.length === 2 && pinchStart !== null) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = getDistance(touch1, touch2);
        const scale = distance / pinchStart;

        if (onPinchZoom) {
          // Apply zoom constraints
          const currentScale = 1; // Would need to track current scale
          const newScale = Math.max(minZoom, Math.min(maxZoom, currentScale * scale));
          onPinchZoom(newScale);
        }
      }

      // Single touch - pan
      if (e.touches.length === 1 && panStart) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - panStart.x;
        const deltaY = touch.clientY - panStart.y;

        if (onPan && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
          onPan(deltaX, deltaY);
          setPanStart({ x: touch.clientX, y: touch.clientY });
        }
      }
    },
    [pinchStart, panStart, getDistance, onPinchZoom, onPan, minZoom, maxZoom, longPressTimer]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      // Cancel long press
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }

      const newTouches = new Map(touches);
      Array.from(e.changedTouches).forEach((touch) => {
        newTouches.delete(touch.identifier);
      });
      setTouches(newTouches);

      // Double tap detection
      if (e.touches.length === 0 && newTouches.size === 0) {
        const now = Date.now();
        const timeDiff = now - lastTap;
        if (timeDiff < 300 && timeDiff > 0) {
          if (onDoubleTap) {
            onDoubleTap();
          }
        }
        setLastTap(now);
      }

      setPanStart(null);
      setPinchStart(null);
    },
    [touches, lastTap, onDoubleTap, longPressTimer]
  );

  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}
