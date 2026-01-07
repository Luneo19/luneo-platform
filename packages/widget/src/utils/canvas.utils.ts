import type { Position, Scale } from '../types/designer.types';

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function normalizeScale(scale: Scale): Scale {
  return {
    x: Math.max(0.1, Math.min(10, scale.x)),
    y: Math.max(0.1, Math.min(10, scale.y)),
  };
}

export function rotatePoint(point: Position, center: Position, angle: number): Position {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}





