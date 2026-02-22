/**
 * CanvasManager
 * Manages Konva Stage and base Layer operations
 */

import Konva from 'konva';
import type { ZoneConfig } from '../types';

export interface CanvasConfig {
  width: number;
  height: number;
  container: HTMLElement;
  backgroundColor?: string | null;
  backgroundImage?: string | null;
}

export interface ExportOptions {
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  pixelRatio?: number;
  mimeType?: string;
}

/**
 * Manages the Konva Stage and base Layer
 */
export class CanvasManager {
  private stage: Konva.Stage | null = null;
  private baseLayer: Konva.Layer | null = null;
  private backgroundImage: Konva.Image | null = null;
  private backgroundRect: Konva.Rect | null = null;
  private config: CanvasConfig | null = null;

  /**
   * Sets up the Konva Stage in the given container
   */
  setupStage(container: HTMLElement, width: number, height: number): Konva.Stage {
    this.config = { container: container as HTMLDivElement, width, height };

    // Create stage
    this.stage = new Konva.Stage({
      container: container as HTMLDivElement,
      width,
      height,
    });

    // Create base layer
    this.baseLayer = new Konva.Layer({
      name: 'base',
    });

    this.stage.add(this.baseLayer);

    return this.stage;
  }

  /**
   * Resizes the canvas
   */
  resize(width: number, height: number): void {
    if (!this.stage) {
      throw new Error('Stage not initialized. Call setupStage first.');
    }

    this.stage.width(width);
    this.stage.height(height);

    if (this.config) {
      this.config.width = width;
      this.config.height = height;
    }
  }

  /**
   * Sets the background color or image
   */
  setBackground(colorOrImageUrl: string | null): void {
    if (!this.stage) {
      throw new Error('Stage not initialized. Call setupStage first.');
    }

    if (!colorOrImageUrl) {
      // Remove background rect and image
      if (this.backgroundRect) {
        this.backgroundRect.destroy();
        this.backgroundRect = null;
      }
      if (this.backgroundImage) {
        this.backgroundImage.destroy();
        this.backgroundImage = null;
      }
      return;
    }

    // Check if it's a URL (starts with http/https/data)
    if (colorOrImageUrl.startsWith('http') || colorOrImageUrl.startsWith('data:')) {
      // Load as image
      const imageObj = new Image();
      imageObj.crossOrigin = 'anonymous';
      imageObj.onload = () => {
        if (!this.baseLayer) return;

        // Remove old background image if exists
        if (this.backgroundImage) {
          this.backgroundImage.destroy();
        }

        // Create new background image
        this.backgroundImage = new Konva.Image({
          x: 0,
          y: 0,
          image: imageObj,
          width: this.stage!.width(),
          height: this.stage!.height(),
          listening: false,
        });

        // Move to back
        this.baseLayer.add(this.backgroundImage);
        this.backgroundImage.moveToBottom();
      };
      imageObj.src = colorOrImageUrl;
    } else {
      // Set as color using background rect
      if (this.backgroundImage) {
        this.backgroundImage.destroy();
        this.backgroundImage = null;
      }

      // Remove old background rect if exists
      if (this.backgroundRect) {
        this.backgroundRect.destroy();
      }

      // Create background rect
      if (this.baseLayer) {
        this.backgroundRect = new Konva.Rect({
          x: 0,
          y: 0,
          width: this.stage.width(),
          height: this.stage.height(),
          fill: colorOrImageUrl,
          listening: false,
        });
        this.baseLayer.add(this.backgroundRect);
        this.backgroundRect.moveToBottom();
        this.baseLayer.draw();
      }
    }
  }

  /**
   * Sets the zoom level
   */
  setZoom(level: number): void {
    if (!this.stage) {
      throw new Error('Stage not initialized. Call setupStage first.');
    }

    const clampedLevel = Math.max(0.1, Math.min(5, level));
    const stage = this.stage;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (!pointer) {
      stage.scale({ x: clampedLevel, y: clampedLevel });
      return;
    }

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedLevel,
      y: pointer.y - mousePointTo.y * clampedLevel,
    };

    stage.scale({ x: clampedLevel, y: clampedLevel });
    stage.position(newPos);
  }

  /**
   * Gets the current zoom level
   */
  getZoom(): number {
    if (!this.stage) {
      return 1;
    }
    return this.stage.scaleX();
  }

  /**
   * Enables drag mode (panning)
   */
  enableDrag(): void {
    if (!this.stage) {
      throw new Error('Stage not initialized. Call setupStage first.');
    }

    this.stage.draggable(true);
  }

  /**
   * Disables drag mode
   */
  disableDrag(): void {
    if (!this.stage) {
      return;
    }

    this.stage.draggable(false);
  }

  /**
   * Gets the pointer position in canvas coordinates
   */
  getPointerPosition(): { x: number; y: number } | null {
    if (!this.stage) {
      return null;
    }

    const pos = this.stage.getPointerPosition();
    if (!pos) {
      return null;
    }

    // Convert to canvas coordinates
    const transform = this.stage.getAbsoluteTransform().copy().invert();
    const canvasPos = transform.point(pos);

    return { x: canvasPos.x, y: canvasPos.y };
  }

  /**
   * Exports canvas to data URL
   */
  toDataURL(config?: ExportOptions): string {
    if (!this.stage) {
      throw new Error('Stage not initialized. Call setupStage first.');
    }

    const options: ExportOptions = {
      format: 'png',
      quality: 1,
      pixelRatio: 1,
      ...config,
    };

    const mimeType =
      options.mimeType ||
      (options.format === 'jpeg' ? 'image/jpeg' : options.format === 'webp' ? 'image/webp' : 'image/png');

    return this.stage.toDataURL({
      mimeType,
      quality: options.quality,
      pixelRatio: options.pixelRatio,
    });
  }

  /**
   * Exports canvas to Blob
   */
  async toBlob(config?: ExportOptions): Promise<Blob> {
    if (!this.stage) {
      throw new Error('Stage not initialized. Call setupStage first.');
    }

    const dataURL = this.toDataURL(config);
    const response = await fetch(dataURL);
    return response.blob();
  }

  /**
   * Handles mouse wheel events for zooming
   */
  handleWheel(event: WheelEvent): void {
    if (!this.stage) {
      return;
    }

    event.preventDefault();

    const oldScale = this.stage.scaleX();
    const pointer = this.stage.getPointerPosition();

    if (!pointer) {
      return;
    }

    // Determine zoom direction
    const direction = event.deltaY > 0 ? -1 : 1;
    const scaleBy = 1.1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    // Zoom towards mouse position
    const mousePointTo = {
      x: (pointer.x - this.stage.x()) / oldScale,
      y: (pointer.y - this.stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    this.stage.scale({ x: clampedScale, y: clampedScale });
    this.stage.position(newPos);
  }

  /**
   * Gets the stage instance
   */
  getStage(): Konva.Stage | null {
    return this.stage;
  }

  /**
   * Gets the base layer
   */
  getBaseLayer(): Konva.Layer | null {
    return this.baseLayer;
  }

  /**
   * Destroys the stage and cleans up resources
   */
  destroy(): void {
    if (this.backgroundImage) {
      this.backgroundImage.destroy();
      this.backgroundImage = null;
    }

    if (this.backgroundRect) {
      this.backgroundRect.destroy();
      this.backgroundRect = null;
    }

    if (this.stage) {
      this.stage.destroy();
      this.stage = null;
    }

    this.baseLayer = null;
    this.config = null;
  }
}
