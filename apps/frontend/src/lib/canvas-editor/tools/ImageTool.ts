import Konva from 'konva';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { logger } from '@/lib/logger';

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
      this.designLayer.add(imageElement as any);
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
    (imageElement as any).stroke('#007bff');
    (imageElement as any).strokeWidth(2);
    this.designLayer.batchDraw();
  }

  /**
   * Deselect current image
   */
  deselectImage() {
    if (this.selectedImage) {
      (this.selectedImage as any).stroke('');
      (this.selectedImage as any).strokeWidth(0);
      this.selectedImage = null;
      this.designLayer.batchDraw();
    }
  }

  /**
   * Update image properties
   */
  updateImageProperties(imageElement: ImageElement, properties: Partial<ImageOptions>) {
    if (properties.width !== undefined) (imageElement as any).width(properties.width);
    if (properties.height !== undefined) (imageElement as any).height(properties.height);
    if (properties.scaleX !== undefined) (imageElement as any).scaleX(properties.scaleX);
    if (properties.scaleY !== undefined) (imageElement as any).scaleY(properties.scaleY);
    if (properties.rotation !== undefined) (imageElement as any).rotation(properties.rotation);
    if (properties.opacity !== undefined) (imageElement as any).opacity(properties.opacity);

    this.designLayer.batchDraw();
  }

  /**
   * Apply brightness filter
   */
  applyBrightness(imageElement: ImageElement, brightness: number) {
    (imageElement as any).brightness(brightness);
    if (!imageElement.filters.includes('Brighten')) {
      (imageElement as any).filters([...imageElement.filters, 'Brighten']);
    }
    (imageElement as any).cache();
    this.designLayer.batchDraw();
  }

  /**
   * Apply contrast filter
   */
  applyContrast(imageElement: ImageElement, contrast: number) {
    (imageElement as any).contrast(contrast);
    if (!imageElement.filters.includes('Contrast')) {
      (imageElement as any).filters([...imageElement.filters, 'Contrast']);
    }
    (imageElement as any).cache();
    this.designLayer.batchDraw();
  }

  /**
   * Apply blur filter
   */
  applyBlur(imageElement: ImageElement, blur: number) {
    (imageElement as any).blurRadius(blur);
    if (!imageElement.filters.includes('Blur')) {
      (imageElement as any).filters([...imageElement.filters, 'Blur']);
    }
    (imageElement as any).cache();
    this.designLayer.batchDraw();
  }

  /**
   * Apply crop to image
   */
  applyCrop(imageElement: ImageElement, crop: { x: number; y: number; width: number; height: number }) {
    (imageElement as any).crop({
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
    
    switch (mask.type) {
      case 'circle':
        maskShape = new Konva.Circle({
          x: (imageElement as any).x() + (imageElement as any).width() / 2,
          y: (imageElement as any).y() + (imageElement as any).height() / 2,
          radius: Math.min((imageElement as any).width(), (imageElement as any).height()) / 2,
          fill: 'black',
        });
        break;
      case 'rectangle':
        maskShape = new Konva.Rect({
          x: (imageElement as any).x(),
          y: (imageElement as any).y(),
          width: (imageElement as any).width(),
          height: (imageElement as any).height(),
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
    (imageElement as any).mask(maskShape);
    this.designLayer.batchDraw();
  }

  /**
   * Remove all filters
   */
  removeAllFilters(imageElement: ImageElement) {
    (imageElement as any).filters([]);
    (imageElement as any).brightness(0);
    (imageElement as any).contrast(0);
    (imageElement as any).blurRadius(0);
    (imageElement as any).cache();
    this.designLayer.batchDraw();
  }

  /**
   * Flip image horizontally
   */
  flipHorizontal(imageElement: ImageElement) {
    (imageElement as any).scaleX(-(imageElement as any).scaleX());
    this.designLayer.batchDraw();
  }

  /**
   * Flip image vertically
   */
  flipVertical(imageElement: ImageElement) {
    (imageElement as any).scaleY(-(imageElement as any).scaleY());
    this.designLayer.batchDraw();
  }

  /**
   * Rotate image by angle
   */
  rotateImage(imageElement: ImageElement, angle: number) {
    (imageElement as any).rotation((imageElement as any).rotation() + angle);
    this.designLayer.batchDraw();
  }

  /**
   * Delete selected image
   */
  deleteSelectedImage() {
    if (this.selectedImage) {
      (this.selectedImage as any).destroy();
      this.selectedImage = null;
      this.designLayer.batchDraw();
    }
  }

  /**
   * Duplicate image element
   */
  duplicateImage(imageElement: ImageElement): ImageElement {
    const cloned = (imageElement as any).clone() as ImageElement;
    (cloned as any).x((imageElement as any).x() + 20);
    (cloned as any).y((imageElement as any).y() + 20);
    (cloned as any).id(`image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    this.designLayer.add(cloned as any);
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

    canvas.width = (imageElement as any).width();
    canvas.height = (imageElement as any).height();

    // Draw image to canvas
    const img = (imageElement as any).image();
    if (img) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    return canvas.toDataURL(format, quality);
  }
}

export default ImageTool;
