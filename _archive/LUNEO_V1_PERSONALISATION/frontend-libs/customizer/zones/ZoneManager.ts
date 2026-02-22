/**
 * ZoneManager
 * Manages zone rendering and constraints
 */

import Konva from 'konva';
import type { ZoneConfig } from '../types';

/**
 * Manages zone rendering and constraints
 */
export class ZoneManager {
  private zones: Map<string, Konva.Group> = new Map();
  private layer: Konva.Layer;

  constructor(layer: Konva.Layer) {
    this.layer = layer;
  }

  /**
   * Renders a zone on the layer
   */
  renderZone(zone: ZoneConfig, layer: Konva.Layer): Konva.Group {
    this.layer = layer;

    // Remove existing zone if present
    const existing = this.zones.get(zone.id);
    if (existing) {
      existing.destroy();
    }

    const group = new Konva.Group({
      id: `zone-${zone.id}`,
      name: 'zone',
      visible: zone.visible !== false,
    });

    let shape: Konva.Shape;

    switch (zone.type) {
      case 'rect':
        shape = new Konva.Rect({
          x: zone.shape.x,
          y: zone.shape.y,
          width: zone.shape.width,
          height: zone.shape.height,
          fill: 'rgba(0, 150, 255, 0.1)',
          stroke: '#0096ff',
          strokeWidth: 2,
          dash: [5, 5],
          listening: false,
        });
        break;

      case 'circle':
        shape = new Konva.Circle({
          x: zone.shape.x + zone.shape.width / 2,
          y: zone.shape.y + zone.shape.height / 2,
          radius: zone.shape.radius || Math.min(zone.shape.width, zone.shape.height) / 2,
          fill: 'rgba(0, 150, 255, 0.1)',
          stroke: '#0096ff',
          strokeWidth: 2,
          dash: [5, 5],
          listening: false,
        });
        break;

      case 'ellipse':
        shape = new Konva.Ellipse({
          x: zone.shape.x + zone.shape.width / 2,
          y: zone.shape.y + zone.shape.height / 2,
          radiusX: zone.shape.radiusX || zone.shape.width / 2,
          radiusY: zone.shape.radiusY || zone.shape.height / 2,
          fill: 'rgba(0, 150, 255, 0.1)',
          stroke: '#0096ff',
          strokeWidth: 2,
          dash: [5, 5],
          listening: false,
        });
        break;

      case 'polygon':
        if (!zone.shape.points || zone.shape.points.length < 6) {
          throw new Error('Polygon zone requires at least 3 points');
        }
        shape = new Konva.Line({
          points: zone.shape.points,
          closed: true,
          fill: 'rgba(0, 150, 255, 0.1)',
          stroke: '#0096ff',
          strokeWidth: 2,
          dash: [5, 5],
          listening: false,
        });
        break;

      default:
        throw new Error(`Unknown zone type: ${zone.type}`);
    }

    // Add label
    const label = new Konva.Text({
      x: zone.shape.x,
      y: zone.shape.y - 20,
      text: zone.name,
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#0096ff',
      listening: false,
    });

    group.add(shape);
    group.add(label);
    layer.add(group);
    group.moveToBottom();

    this.zones.set(zone.id, group);

    return group;
  }

  /**
   * Renders all zones
   */
  renderAllZones(zones: ZoneConfig[], layer: Konva.Layer): void {
    zones.forEach((zone) => {
      this.renderZone(zone, layer);
    });
  }

  /**
   * Gets a zone group by ID
   */
  getZoneGroup(zoneId: string): Konva.Group | null {
    return this.zones.get(zoneId) || null;
  }

  /**
   * Checks if a point is inside a zone
   */
  isPointInZone(zoneId: string, x: number, y: number): boolean {
    const group = this.zones.get(zoneId);
    if (!group) {
      return false;
    }

    const shape = group.findOne('Rect, Circle, Ellipse, Line') as Konva.Shape | undefined;
    if (!shape || !(shape instanceof Konva.Shape)) {
      return false;
    }

    // Use Konva's built-in hit detection
    return shape.intersects({ x, y });
  }

  /**
   * Enforces constraints on a node within a zone
   */
  enforceConstraints(node: Konva.Node, zoneId: string): void {
    const group = this.zones.get(zoneId);
    if (!group) {
      return;
    }

    const zone = group.findOne('Rect, Circle, Ellipse, Line');
    if (!zone) {
      return;
    }

    const zoneBox = zone.getClientRect();
    const nodeBox = node.getClientRect();

    // Clamp position
    let newX = node.x();
    let newY = node.y();

    if (nodeBox.x < zoneBox.x) {
      newX = zoneBox.x;
    }
    if (nodeBox.y < zoneBox.y) {
      newY = zoneBox.y;
    }
    if (nodeBox.x + nodeBox.width > zoneBox.x + zoneBox.width) {
      newX = zoneBox.x + zoneBox.width - nodeBox.width;
    }
    if (nodeBox.y + nodeBox.height > zoneBox.y + zoneBox.height) {
      newY = zoneBox.y + zoneBox.height - nodeBox.height;
    }

    node.position({ x: newX, y: newY });
  }

  /**
   * Sets zone visibility
   */
  setZoneVisibility(zoneId: string, visible: boolean): void {
    const group = this.zones.get(zoneId);
    if (group) {
      group.visible(visible);
      group.getLayer()?.draw();
    }
  }

  /**
   * Sets zone locked state
   */
  setZoneLocked(zoneId: string, locked: boolean): void {
    const group = this.zones.get(zoneId);
    if (group) {
      // Store locked state in metadata
      group.setAttr('locked', locked);
    }
  }

  /**
   * Checks if a zone is locked
   */
  isZoneLocked(zoneId: string): boolean {
    const group = this.zones.get(zoneId);
    return group?.getAttr('locked') === true;
  }

  /**
   * Removes a zone
   */
  removeZone(zoneId: string): void {
    const group = this.zones.get(zoneId);
    if (group) {
      group.destroy();
      this.zones.delete(zoneId);
    }
  }

  /**
   * Clears all zones
   */
  clearZones(): void {
    this.zones.forEach((group) => group.destroy());
    this.zones.clear();
  }
}
