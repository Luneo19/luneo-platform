/**
 * ImageCropper
 * Image cropping with Konva clipping
 */

import Konva from 'konva';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Handles image cropping with Konva clipping
 */
export class ImageCropper {
  private cropRect: Konva.Rect | null = null;
  private cropGroup: Konva.Group | null = null;
  private image: Konva.Image | null = null;
  private layer: Konva.Layer | null = null;

  /**
   * Starts crop mode with overlay rect
   */
  startCrop(image: Konva.Image): Konva.Rect {
    this.image = image;
    this.layer = image.getLayer();

    if (!this.layer) {
      throw new Error('Image must be added to a layer');
    }

    // Remove existing crop group if any
    if (this.cropGroup) {
      this.cropGroup.destroy();
      this.cropGroup = null;
      this.cropRect = null;
    }

    const imageBox = image.getClientRect();

    // Create crop overlay rect
    this.cropRect = new Konva.Rect({
      x: imageBox.x,
      y: imageBox.y,
      width: imageBox.width,
      height: imageBox.height,
      fill: 'rgba(0, 0, 0, 0.5)',
      stroke: '#0099ff',
      strokeWidth: 2,
      dash: [5, 5],
      draggable: true,
      name: 'cropRect',
    });

    // Create inner transparent rect to show crop area
    const innerRect = new Konva.Rect({
      x: imageBox.x + 10,
      y: imageBox.y + 10,
      width: imageBox.width - 20,
      height: imageBox.height - 20,
      fill: 'transparent',
      stroke: '#ffffff',
      strokeWidth: 1,
      name: 'cropInner',
    });

    // Use Group to contain both rects
    this.cropGroup = new Konva.Group({
      name: 'cropGroup',
    });
    this.cropGroup.add(this.cropRect);
    this.cropGroup.add(innerRect);
    this.layer.add(this.cropGroup);
    this.layer.draw();

    return this.cropRect;
  }

  /**
   * Updates the crop area
   */
  updateCropArea(x: number, y: number, width: number, height: number): void {
    if (!this.cropRect) {
      return;
    }

    this.cropRect.setAttrs({
      x,
      y,
      width,
      height,
    });

    // Update inner rect
    if (this.cropGroup) {
      const innerRect = this.cropGroup.findOne('.cropInner') as Konva.Rect;
      if (innerRect) {
        innerRect.setAttrs({
          x: x + 10,
          y: y + 10,
          width: width - 20,
          height: height - 20,
        });
      }
      this.cropGroup.getLayer()?.draw();
    }
  }

  /**
   * Applies crop to image using clipping
   */
  applyCrop(image: Konva.Image, cropRect: CropRect): void {
    const imageBox = image.getClientRect();

    // Convert crop rect to image-relative coordinates (crop is in source image pixels)
    const scaleX = imageBox.width / (image.width() || 1);
    const scaleY = imageBox.height / (image.height() || 1);
    const relativeX = Math.max(0, (cropRect.x - imageBox.x) / scaleX);
    const relativeY = Math.max(0, (cropRect.y - imageBox.y) / scaleY);
    const relativeWidth = cropRect.width / scaleX;
    const relativeHeight = cropRect.height / scaleY;

    // Apply crop using Konva's crop property (displays only the specified region)
    image.setAttr('crop', { x: relativeX, y: relativeY, width: relativeWidth, height: relativeHeight });
    image.setAttr('x', cropRect.x);
    image.setAttr('y', cropRect.y);
    image.setAttr('width', cropRect.width);
    image.setAttr('height', cropRect.height);

    image.cache();
    image.getLayer()?.draw();

    // Clean up crop rect
    this.cancelCrop();
  }

  /**
   * Cancels crop operation
   */
  cancelCrop(): void {
    if (this.cropGroup) {
      this.cropGroup.destroy();
      this.cropGroup = null;
      this.cropRect = null;
    }

    if (this.layer) {
      this.layer.draw();
    }

    this.image = null;
    this.layer = null;
  }

  /**
   * Gets current crop rect
   */
  getCropRect(): CropRect | null {
    if (!this.cropRect) {
      return null;
    }

    const box = this.cropRect.getClientRect();
    return {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    };
  }

  /**
   * Checks if crop is active
   */
  isCropping(): boolean {
    return this.cropGroup !== null && this.cropRect !== null;
  }
}
