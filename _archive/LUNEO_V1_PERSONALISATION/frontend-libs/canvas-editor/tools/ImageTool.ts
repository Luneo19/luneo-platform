import Konva from 'konva';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { logger } from '@/lib/logger';

type KonvaImageNode = {
  stroke(color?: string): string | void;
  strokeWidth(width?: number): number | void;
  width(val?: number): number | void;
  height(val?: number): number | void;
  scaleX(val?: number): number | void;
  scaleY(val?: number): number | void;
  rotation(angle?: number): number | void;
  opacity(val?: number): number | void;
  x(val?: number): number | void;
  y(val?: number): number | void;
  brightness(val?: number): void;
  contrast(val?: number): void;
  blurRadius(val?: number): void;
  crop(rect: { x: number; y: number; width: number; height: number }): void;
  mask(shape: unknown): void;
  cache(): void;
  filters: unknown[];
  id(val?: string): string | void;
  clone(): KonvaImageNode;
  destroy(): void;
  image(): HTMLImageElement;
  getClientRect(): { x: number; y: number; width: number; height: number };
};

export interface ImageOptions {
  src: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  opacity?: number;
  brightness?: number;
  contrast?: number;
  blur?: number;
  filters?: string[];
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  mask?: {
    type: 'circle' | 'rectangle' | 'polygon';
    points?: number[];
  };
}

export interface ImageElement {
  id: string;
  type: 'image';
  originalSrc: string;
  filters: string[];
  // Konva.Image properties
  image(): HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | undefined;
  image(img: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | undefined): this;
  cropX(): number;
  cropX(x: number): this;
  cropY(): number;
  cropY(y: number): this;
  cropWidth(): number;
  cropWidth(width: number): this;
  cropHeight(): number;
  cropHeight(height: number): this;
}

export class ImageTool {
  private stage: Stage;
  private designLayer: Layer;
  private selectedImage: ImageElement | null = null;
  private imageCache: Map<string, HTMLImageElement> = new Map();

  constructor(stage: Stage, designLayer: Layer) {
    this.stage = stage;
    this.designLayer = designLayer;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Click to select image
    this.stage.on('click', (e) => {
      if (e.target instanceof Konva.Image) {
        this.selectImage(e.target as unknown as ImageElement);
      } else {
        this.deselectImage();
      }
    });
  }

  /**
   * Load image from URL or File
   */
  private async loadImage(src: string | File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.imageCache.set(typeof src === 'string' ? src : URL.createObjectURL(src), img);
        resolve(img);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };

      if (typeof src === 'string') {
        img.src = src;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(src);
      }
    });
  }

  /**
   * Add image to canvas
   */
  async addImage(src: string | File, options: Partial<ImageOptions> = {}): Promise<ImageElement> {
    try {
      const img = await this.loadImage(src);
      
      const imageElement = new Konva.Image({
        image: img,
        x: options.x || 50,
        y: options.y || 50,
        width: options.width || img.width,
        height: options.height || img.height,
        scaleX: options.scaleX || 1,
        scaleY: options.scaleY || 1,
        rotation: options.rotation || 0,
        opacity: options.opacity || 1,
        draggable: true,
        id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }) as unknown as ImageElement;

      // Store original source and type
      imageElement.originalSrc = typeof src === 'string' ? src : URL.createObjectURL(src);
      imageElement.type = 'image';
      imageElement.filters = options.filters || [];

      // Apply initial filters
      if (options.brightness !== undefined) {
        this.applyBrightness(imageElement, options.brightness);
      }
      if (options.contrast !== undefined) {
        this.applyContrast(imageElement, options.contrast);
      }
      if (options.blur !== undefined) {
        this.applyBlur(imageElement, options.blur);
      }

      // Apply crop if specified
      if (options.crop) {
        this.applyCrop(imageElement, options.crop);
      }

      // Apply mask if specified
      if (options.mask) {
        this.applyMask(imageElement, options.mask);
      }

      // Add to layer
      this.designLayer.add(imageElement as unknown as Konva.Image);
      this.designLayer.batchDraw();

      // Select the new image
      this.selectImage(imageElement);

      return imageElement;
    } catch (error) {
      logger.error('Error adding image', {
        error,
        imageUrl: typeof src === 'string' ? src.substring(0, 100) : 'object',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Select image element
   */
  selectImage(imageElement: ImageElement) {
    this.deselectImage();
    this.selectedImage = imageElement;
    
    // Add selection visual feedback
    const konvaImage = imageElement as unknown as KonvaImageNode;
    konvaImage.stroke('#007bff');
    konvaImage.strokeWidth(2);
    this.designLayer.batchDraw();
  }

  /**
   * Deselect current image
   */
  deselectImage() {
    if (this.selectedImage) {
      const konvaImage = this.selectedImage as unknown as KonvaImageNode;
      konvaImage.stroke('');
      konvaImage.strokeWidth(0);
      this.selectedImage = null;
      this.designLayer.batchDraw();
    }
  }

  /**
   * Update image properties
   */
  updateImageProperties(imageElement: ImageElement, properties: Partial<ImageOptions>) {
    const konvaImage = imageElement as unknown as KonvaImageNode;
    if (properties.width !== undefined) konvaImage.width(properties.width);
    if (properties.height !== undefined) konvaImage.height(properties.height);
    if (properties.scaleX !== undefined) konvaImage.scaleX(properties.scaleX);
    if (properties.scaleY !== undefined) konvaImage.scaleY(properties.scaleY);
    if (properties.rotation !== undefined) konvaImage.rotation(properties.rotation);
    if (properties.opacity !== undefined) konvaImage.opacity(properties.opacity);

    this.designLayer.batchDraw();
  }

  /**
   * Apply brightness filter
   */
  applyBrightness(imageElement: ImageElement, brightness: number) {
    const konvaImage = imageElement as unknown as KonvaImageNode;
    konvaImage.brightness(brightness);
    if (!imageElement.filters.includes('Brighten')) {
      konvaImage.filters = [...imageElement.filters, 'Brighten'];
    }
    konvaImage.cache();
    this.designLayer.batchDraw();
  }

  /**
   * Apply contrast filter
   */
  applyContrast(imageElement: ImageElement, contrast: number) {
    const konvaImage = imageElement as unknown as KonvaImageNode;
    konvaImage.contrast(contrast);
    if (!imageElement.filters.includes('Contrast')) {
      konvaImage.filters = [...imageElement.filters, 'Contrast'];
    }
    konvaImage.cache();
    this.designLayer.batchDraw();
  }

  /**
   * Apply blur filter
   */
  applyBlur(imageElement: ImageElement, blur: number) {
    const konvaImage = imageElement as unknown as KonvaImageNode;
    konvaImage.blurRadius(blur);
    if (!imageElement.filters.includes('Blur')) {
      konvaImage.filters = [...imageElement.filters, 'Blur'];
    }
    konvaImage.cache();
    this.designLayer.batchDraw();
  }

  /**
   * Apply crop to image
   */
  applyCrop(imageElement: ImageElement, crop: { x: number; y: number; width: number; height: number }) {
    const konvaImage = imageElement as unknown as KonvaImageNode;
    konvaImage.crop({
      x: crop.x,
      y: crop.y,
      width: crop.width,
      height: crop.height,
    });
    this.designLayer.batchDraw();
  }

  /**
   * Apply mask to image
   */
  applyMask(imageElement: ImageElement, mask: { type: 'circle' | 'rectangle' | 'polygon'; points?: number[] }) {
    // Create mask shape
    let maskShape: Konva.Shape;
    
    const konvaImage = imageElement as unknown as KonvaImageNode;
    const rawX = konvaImage.x();
    const rawY = konvaImage.y();
    const rawW = konvaImage.width();
    const rawH = konvaImage.height();
    const imageX = typeof rawX === 'number' ? rawX : 0;
    const imageY = typeof rawY === 'number' ? rawY : 0;
    const imageWidth = typeof rawW === 'number' ? rawW : 0;
    const imageHeight = typeof rawH === 'number' ? rawH : 0;
    
    switch (mask.type) {
      case 'circle':
        maskShape = new Konva.Circle({
          x: imageX + imageWidth / 2,
          y: imageY + imageHeight / 2,
          radius: Math.min(imageWidth, imageHeight) / 2,
          fill: 'black',
        });
        break;
      case 'rectangle':
        maskShape = new Konva.Rect({
          x: imageX,
          y: imageY,
          width: imageWidth,
          height: imageHeight,
          fill: 'black',
        });
        break;
      case 'polygon':
        if (mask.points && mask.points.length >= 6) {
          maskShape = new Konva.Line({
            points: mask.points,
            closed: true,
            fill: 'black',
          });
        } else {
          logger.warn('Polygon mask requires at least 3 points', {
            pointsLength: mask.points?.length || 0,
            requiredPoints: 6,
            maskType: mask.type,
          });
          return;
        }
        break;
      default:
        logger.warn('Unknown mask type', {
          maskType: mask.type,
        });
        return;
    }

    // Apply mask
    const konvaImageForMask = imageElement as unknown as KonvaImageNode;
    konvaImageForMask.mask(maskShape);
    this.designLayer.batchDraw();
  }

  /**
   * Remove all filters
   */
  removeAllFilters(imageElement: ImageElement) {
    const konvaImage = imageElement as unknown as KonvaImageNode;
    konvaImage.filters = [];
    konvaImage.brightness(0);
    konvaImage.contrast(0);
    konvaImage.blurRadius(0);
    konvaImage.cache();
    this.designLayer.batchDraw();
  }

  /**
   * Flip image horizontally
   */
  flipHorizontal(imageElement: ImageElement) {
    const konvaImage = imageElement as unknown as KonvaImageNode;
    const rawScaleX = konvaImage.scaleX();
    const currentScaleX = typeof rawScaleX === 'number' ? rawScaleX : 1;
    konvaImage.scaleX(-currentScaleX);
    this.designLayer.batchDraw();
  }

  /**
   * Flip image vertically
   */
  flipVertical(imageElement: ImageElement) {
    const konvaImage = imageElement as unknown as KonvaImageNode;
    const rawScaleY = konvaImage.scaleY();
    const currentScaleY = typeof rawScaleY === 'number' ? rawScaleY : 1;
    konvaImage.scaleY(-currentScaleY);
    this.designLayer.batchDraw();
  }

  /**
   * Rotate image by angle
   */
  rotateImage(imageElement: ImageElement, angle: number) {
    const konvaImage = imageElement as unknown as KonvaImageNode;
    const rawRotation = konvaImage.rotation();
    const currentRotation = typeof rawRotation === 'number' ? rawRotation : 0;
    konvaImage.rotation(currentRotation + angle);
    this.designLayer.batchDraw();
  }

  /**
   * Delete selected image
   */
  deleteSelectedImage() {
    if (this.selectedImage) {
      const konvaImage = this.selectedImage as unknown as KonvaImageNode;
      konvaImage.destroy();
      this.selectedImage = null;
      this.designLayer.batchDraw();
    }
  }

  /**
   * Duplicate image element
   */
  duplicateImage(imageElement: ImageElement): ImageElement {
    const konvaImage = imageElement as unknown as KonvaImageNode;
    const cloned = konvaImage.clone() as unknown as ImageElement;
    const clonedKonva = cloned as unknown as KonvaImageNode;
    const dupRawX = konvaImage.x();
    const dupRawY = konvaImage.y();
    const currentX = typeof dupRawX === 'number' ? dupRawX : 0;
    const currentY = typeof dupRawY === 'number' ? dupRawY : 0;
    clonedKonva.x(currentX + 20);
    clonedKonva.y(currentY + 20);
    clonedKonva.id(`image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    this.designLayer.add(cloned as unknown as Konva.Image);
    this.designLayer.batchDraw();
    return cloned;
  }

  /**
   * Get all image elements
   */
  getAllImageElements(): ImageElement[] {
    return this.designLayer.children
      .filter((node) => node instanceof Konva.Image)
      .map((node) => node as unknown as ImageElement);
  }

  /**
   * Get selected image element
   */
  getSelectedImage(): ImageElement | null {
    return this.selectedImage;
  }

  /**
   * Upload image from file input
   */
  async uploadImageFromFile(file: File, options: Partial<ImageOptions> = {}): Promise<ImageElement> {
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    return this.addImage(file, options);
  }

  /**
   * Get image data URL for export
   */
  getImageDataURL(imageElement: ImageElement, format: string = 'image/png', quality: number = 1): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const konvaImage = imageElement as unknown as KonvaImageNode;
    const expW = konvaImage.width();
    const expH = konvaImage.height();
    canvas.width = typeof expW === 'number' ? expW : 0;
    canvas.height = typeof expH === 'number' ? expH : 0;

    // Draw image to canvas
    const img = konvaImage.image();
    if (img) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    return canvas.toDataURL(format, quality);
  }
}

export default ImageTool;
