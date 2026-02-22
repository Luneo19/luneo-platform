/**
 * CRUD for 3D annotations and export to JSON.
 * @module ar/annotations/ARAnnotationManager
 */

import type { Vector3 } from 'three';
import { logger } from '@/lib/logger';

export type AnnotationType = 'text' | 'measurement' | 'voice' | 'pin';

export interface AnnotationData {
  id: string;
  type: AnnotationType;
  position: { x: number; y: number; z: number };
  data: Record<string, unknown>;
  createdAt: number;
}

/**
 * Manages 3D annotations: add, remove, list, export.
 */
export class ARAnnotationManager {
  private readonly annotations = new Map<string, AnnotationData>();
  private idCounter = 0;

  /**
   * Add an annotation at a 3D point.
   */
  addAnnotation(
    type: AnnotationType,
    position: Vector3 | { x: number; y: number; z: number },
    data: Record<string, unknown> = {}
  ): string {
    const id = `ann-${++this.idCounter}`;
    const ann: AnnotationData = {
      id,
      type,
      position: 'x' in position ? { x: position.x, y: position.y, z: position.z } : position,
      data,
      createdAt: Date.now(),
    };
    this.annotations.set(id, ann);
    return id;
  }

  /**
   * Remove an annotation by id.
   */
  removeAnnotation(id: string): boolean {
    return this.annotations.delete(id);
  }

  /**
   * Get all annotations.
   */
  getAnnotations(): AnnotationData[] {
    return Array.from(this.annotations.values());
  }

  /**
   * Get a single annotation by id.
   */
  getAnnotation(id: string): AnnotationData | undefined {
    return this.annotations.get(id);
  }

  /**
   * Export annotations as JSON string.
   */
  exportAnnotations(): string {
    const arr = this.getAnnotations();
    return JSON.stringify(arr, null, 2);
  }

  /**
   * Import annotations from JSON string (merge with existing).
   */
  importAnnotations(json: string): void {
    try {
      const arr = JSON.parse(json) as AnnotationData[];
      for (const a of arr) {
        const id = a.id || `ann-${++this.idCounter}`;
        this.annotations.set(id, { ...a, id });
      }
    } catch (err) {
      logger.warn('ARAnnotationManager: importAnnotations failed', { error: String(err) });
    }
  }

  clear(): void {
    this.annotations.clear();
  }
}
