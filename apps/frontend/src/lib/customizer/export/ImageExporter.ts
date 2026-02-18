/**
 * ImageExporter
 * Exports canvas to image formats
 */

import Konva from 'konva';

export interface ExportOptions {
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  pixelRatio?: number;
  mimeType?: string;
}

export interface ExportAreaOptions extends ExportOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Handles image export functionality
 */
export class ImageExporter {
  /**
   * Exports stage to data URL
   */
  static exportAsDataURL(stage: Konva.Stage, options?: ExportOptions): string {
    const opts: ExportOptions = {
      format: 'png',
      quality: 1,
      pixelRatio: 1,
      ...options,
    };

    const mimeType =
      opts.mimeType ||
      (opts.format === 'jpeg' ? 'image/jpeg' : opts.format === 'webp' ? 'image/webp' : 'image/png');

    return stage.toDataURL({
      mimeType,
      quality: opts.quality,
      pixelRatio: opts.pixelRatio,
    });
  }

  /**
   * Exports stage to Blob
   */
  static async exportAsBlob(stage: Konva.Stage, options?: ExportOptions): Promise<Blob> {
    const dataURL = this.exportAsDataURL(stage, options);
    const response = await fetch(dataURL);
    return response.blob();
  }

  /**
   * Exports a specific area of the stage
   */
  static async exportArea(stage: Konva.Stage, rect: ExportAreaOptions): Promise<Blob> {
    const opts: ExportAreaOptions = {
      format: 'png',
      quality: 1,
      pixelRatio: 1,
      ...rect,
    };

    // Create a temporary stage for the area
    const tempStage = new Konva.Stage({
      container: document.createElement('div'),
      width: opts.width,
      height: opts.height,
    });

    const tempLayer = new Konva.Layer();
    tempStage.add(tempLayer);

    // Clone nodes in the area
    const nodes = stage.find('.konva-node');
    nodes.forEach((node) => {
      if (node === stage || node.getParent() === stage) {
        return;
      }

      const box = node.getClientRect();
      if (
        box.x < opts.x + opts.width &&
        box.x + box.width > opts.x &&
        box.y < opts.y + opts.height &&
        box.y + box.height > opts.y
      ) {
        const cloned = node.clone();
        cloned.position({
          x: node.x() - opts.x,
          y: node.y() - opts.y,
        });
        tempLayer.add(cloned);
      }
    });

    tempLayer.draw();

    const mimeType =
      opts.mimeType ||
      (opts.format === 'jpeg' ? 'image/jpeg' : opts.format === 'webp' ? 'image/webp' : 'image/png');

    const dataURL = tempStage.toDataURL({
      mimeType,
      quality: opts.quality,
      pixelRatio: opts.pixelRatio,
    });

    tempStage.destroy();

    const response = await fetch(dataURL);
    return response.blob();
  }

  /**
   * Downloads blob as a file
   */
  static downloadAsFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Exports and downloads stage as image file
   */
  static async exportAndDownload(
    stage: Konva.Stage,
    filename: string,
    options?: ExportOptions
  ): Promise<void> {
    const blob = await this.exportAsBlob(stage, options);
    this.downloadAsFile(blob, filename);
  }
}
