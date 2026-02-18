/**
 * ZoneConstraints
 * Enforcement of zone constraints
 */

import Konva from 'konva';
import type { ZoneConfig } from '../types';

/**
 * Enforces zone constraints on nodes
 */
export class ZoneConstraints {
  /**
   * Enforces position constraints (clamps node within zone bounds)
   */
  static enforcePosition(node: Konva.Node, zone: ZoneConfig): void {
    const nodeBox = node.getClientRect();
    const zoneBounds = this.getZoneBounds(zone);

    let newX = node.x();
    let newY = node.y();

    // Clamp horizontally
    if (nodeBox.x < zoneBounds.x) {
      newX = zoneBounds.x;
    } else if (nodeBox.x + nodeBox.width > zoneBounds.x + zoneBounds.width) {
      newX = zoneBounds.x + zoneBounds.width - nodeBox.width;
    }

    // Clamp vertically
    if (nodeBox.y < zoneBounds.y) {
      newY = zoneBounds.y;
    } else if (nodeBox.y + nodeBox.height > zoneBounds.y + zoneBounds.height) {
      newY = zoneBounds.y + zoneBounds.height - nodeBox.height;
    }

    node.position({ x: newX, y: newY });
  }

  /**
   * Enforces scale constraints
   */
  static enforceScale(
    node: Konva.Node,
    zone: ZoneConfig,
    minScale: number = 0.1,
    maxScale: number = 5
  ): void {
    if (!zone.constraints) {
      return;
    }

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    const min = zone.constraints.minScale ?? minScale;
    const max = zone.constraints.maxScale ?? maxScale;

    const clampedScaleX = Math.max(min, Math.min(max, scaleX));
    const clampedScaleY = Math.max(min, Math.min(max, scaleY));

    node.scale({ x: clampedScaleX, y: clampedScaleY });

    // Also enforce size constraints if specified
    const nodeBox = node.getClientRect();
    if (zone.constraints.minWidth && nodeBox.width < zone.constraints.minWidth) {
      const scale = zone.constraints.minWidth / nodeBox.width;
      node.scaleX(node.scaleX() * scale);
    }
    if (zone.constraints.minHeight && nodeBox.height < zone.constraints.minHeight) {
      const scale = zone.constraints.minHeight / nodeBox.height;
      node.scaleY(node.scaleY() * scale);
    }
    if (zone.constraints.maxWidth && nodeBox.width > zone.constraints.maxWidth) {
      const scale = zone.constraints.maxWidth / nodeBox.width;
      node.scaleX(node.scaleX() * scale);
    }
    if (zone.constraints.maxHeight && nodeBox.height > zone.constraints.maxHeight) {
      const scale = zone.constraints.maxHeight / nodeBox.height;
      node.scaleY(node.scaleY() * scale);
    }
  }

  /**
   * Enforces rotation constraints
   */
  static enforceRotation(node: Konva.Node, zone: ZoneConfig, allowRotation: boolean = true): void {
    if (!allowRotation && zone.constraints?.allowRotation === false) {
      node.rotation(0);
    }
  }

  /**
   * Checks if maximum elements constraint is met
   */
  static checkMaxElements(zone: ZoneConfig, currentCount: number, max: number): boolean {
    if (!zone.constraints?.maxElements) {
      return true;
    }

    return currentCount < zone.constraints.maxElements;
  }

  /**
   * Checks if a type is allowed in the zone
   */
  static checkAllowedTypes(zone: ZoneConfig, type: 'text' | 'image' | 'shape'): boolean {
    if (!zone.constraints?.allowedTypes || zone.constraints.allowedTypes.length === 0) {
      return true; // All types allowed if not specified
    }

    return zone.constraints.allowedTypes.includes(type);
  }

  /**
   * Gets constrained bounds for a node within a zone
   */
  static getConstrainedBounds(node: Konva.Node, zone: ZoneConfig): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const zoneBounds = this.getZoneBounds(zone);
    const nodeBox = node.getClientRect();

    let x = Math.max(zoneBounds.x, nodeBox.x);
    let y = Math.max(zoneBounds.y, nodeBox.y);
    let width = Math.min(zoneBounds.width, nodeBox.width);
    let height = Math.min(zoneBounds.height, nodeBox.height);

    // Ensure node doesn't exceed zone bounds
    if (x + width > zoneBounds.x + zoneBounds.width) {
      width = zoneBounds.x + zoneBounds.width - x;
    }
    if (y + height > zoneBounds.y + zoneBounds.height) {
      height = zoneBounds.y + zoneBounds.height - y;
    }

    return { x, y, width, height };
  }

  /**
   * Gets zone bounds as a rectangle
   */
  private static getZoneBounds(zone: ZoneConfig): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    switch (zone.type) {
      case 'rect':
        return {
          x: zone.shape.x,
          y: zone.shape.y,
          width: zone.shape.width,
          height: zone.shape.height,
        };

      case 'circle':
        const radius = zone.shape.radius || Math.min(zone.shape.width, zone.shape.height) / 2;
        return {
          x: zone.shape.x + zone.shape.width / 2 - radius,
          y: zone.shape.y + zone.shape.height / 2 - radius,
          width: radius * 2,
          height: radius * 2,
        };

      case 'ellipse':
        const radiusX = zone.shape.radiusX || zone.shape.width / 2;
        const radiusY = zone.shape.radiusY || zone.shape.height / 2;
        return {
          x: zone.shape.x + zone.shape.width / 2 - radiusX,
          y: zone.shape.y + zone.shape.height / 2 - radiusY,
          width: radiusX * 2,
          height: radiusY * 2,
        };

      case 'polygon':
        if (!zone.shape.points || zone.shape.points.length < 6) {
          return { x: 0, y: 0, width: 0, height: 0 };
        }
        // Calculate bounding box from points
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (let i = 0; i < zone.shape.points.length; i += 2) {
          minX = Math.min(minX, zone.shape.points[i]);
          minY = Math.min(minY, zone.shape.points[i + 1]);
          maxX = Math.max(maxX, zone.shape.points[i]);
          maxY = Math.max(maxY, zone.shape.points[i + 1]);
        }

        return {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        };

      default:
        return { x: 0, y: 0, width: 0, height: 0 };
    }
  }
}
