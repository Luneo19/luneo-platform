/**
 * FontManager
 * Manages font loading using FontFace API
 */

import { logger } from '@/lib/logger';

export interface CustomFont {
  family: string;
  url: string;
}

/**
 * Manages font loading and availability
 */
export class FontManager {
  private loadedFonts: Set<string> = new Set();
  private systemFonts: string[] = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Georgia',
    'Palatino',
    'Garamond',
    'Bookman',
    'Comic Sans MS',
    'Trebuchet MS',
    'Arial Black',
    'Impact',
  ];

  /**
   * Loads a font using FontFace API
   */
  async loadFont(fontFamily: string, fontUrl?: string): Promise<void> {
    if (this.isFontLoaded(fontFamily)) {
      return;
    }

    if (!fontUrl) {
      // System font, mark as available
      this.loadedFonts.add(fontFamily);
      return;
    }

    try {
      const fontFace = new FontFace(fontFamily, `url(${fontUrl})`);

      await fontFace.load();

      document.fonts.add(fontFace);
      this.loadedFonts.add(fontFamily);
    } catch (error) {
      logger.error(`Failed to load font: ${fontFamily}`, error instanceof Error ? error : new Error(String(error)));
      throw new Error(`Failed to load font: ${fontFamily}`);
    }
  }

  /**
   * Loads multiple system fonts
   */
  async loadSystemFonts(fonts: string[]): Promise<void> {
    for (const font of fonts) {
      this.loadedFonts.add(font);
    }
  }

  /**
   * Loads multiple custom fonts
   */
  async loadCustomFonts(fonts: CustomFont[]): Promise<void> {
    const promises = fonts.map((font) => this.loadFont(font.family, font.url));
    await Promise.all(promises);
  }

  /**
   * Checks if a font is loaded
   */
  isFontLoaded(fontFamily: string): boolean {
    if (this.loadedFonts.has(fontFamily)) {
      return true;
    }

    // Check if font is available in document.fonts
    if (document.fonts && document.fonts.check) {
      return document.fonts.check(`16px "${fontFamily}"`);
    }

    return false;
  }

  /**
   * Gets all loaded fonts
   */
  getLoadedFonts(): string[] {
    return Array.from(this.loadedFonts);
  }

  /**
   * Gets all available fonts (system + custom)
   */
  getAvailableFonts(): string[] {
    return [...this.systemFonts, ...this.getLoadedFonts()];
  }

  /**
   * Adds a system font to the list
   */
  addSystemFont(fontFamily: string): void {
    if (!this.systemFonts.includes(fontFamily)) {
      this.systemFonts.push(fontFamily);
    }
    this.loadedFonts.add(fontFamily);
  }

  /**
   * Preloads fonts for better performance
   */
  async preloadFonts(fonts: (string | CustomFont)[]): Promise<void> {
    const promises = fonts.map((font) => {
      if (typeof font === 'string') {
        return this.loadFont(font);
      } else {
        return this.loadFont(font.family, font.url);
      }
    });

    await Promise.all(promises);
  }
}
