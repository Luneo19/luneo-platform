/**
 * ImageLoader
 * Async image loading with CORS support
 */

import Konva from 'konva';

export interface ImageLoadOptions {
  crossOrigin?: 'anonymous' | 'use-credentials';
  timeout?: number;
}

/**
 * Handles async image loading
 */
export class ImageLoader {
  /**
   * Loads an image from URL
   */
  static async loadImage(url: string, options?: ImageLoadOptions): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = options?.crossOrigin || 'anonymous';

      const timeout = options?.timeout || 30000; // 30 seconds default

      const timeoutId = setTimeout(() => {
        reject(new Error(`Image load timeout: ${url}`));
      }, timeout);

      image.onload = () => {
        clearTimeout(timeoutId);
        resolve(image);
      };

      image.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to load image: ${url}`));
      };

      image.src = url;
    });
  }

  /**
   * Loads an image and creates a Konva.Image node
   */
  static async loadImageAsKonva(
    url: string,
    config?: Konva.ImageConfig,
    options?: ImageLoadOptions
  ): Promise<Konva.Image> {
    const imageElement = await this.loadImage(url, options);

    return new Konva.Image({
      image: imageElement,
      ...config,
    });
  }

  /**
   * Preloads multiple images
   */
  static async preloadImages(urls: string[], options?: ImageLoadOptions): Promise<void> {
    const promises = urls.map((url) => this.loadImage(url, options));
    await Promise.all(promises);
  }

  /**
   * Creates an image from a File object
   */
  static createImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to create image from file'));
        image.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Creates an image from a data URL
   */
  static createImageFromDataURL(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to create image from data URL'));
      image.src = dataUrl;
    });
  }

  /**
   * Validates if a URL is a valid image
   */
  static async validateImageUrl(url: string): Promise<boolean> {
    try {
      await this.loadImage(url, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
