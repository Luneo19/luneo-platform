import * as THREE from 'three';
import { Configurator3D } from '../core/Configurator3D';
import { logger } from '@/lib/logger';

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  category: 'basic' | 'metallic' | 'pastel' | 'vibrant' | 'neutral' | 'custom';
}

export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  category: string;
  isMetallic?: boolean;
  metalness?: number;
  roughness?: number;
}

export class ColorPicker3D {
  private configurator: Configurator3D;
  private colorPresets: Map<string, ColorPreset> = new Map();
  private colorPalettes: Map<string, ColorPalette> = new Map();
  private currentColor: string = '#000000';
  private previewSphere: THREE.Mesh | null = null;

  constructor(configurator: Configurator3D) {
    this.configurator = configurator;
    this.initializeColorPresets();
    this.initializeColorPalettes();
    this.createPreviewSphere();
  }

  private initializeColorPresets() {
    // Basic Colors
    const basicColors = [
      { name: 'Pure White', hex: '#FFFFFF', category: 'basic' },
      { name: 'Pure Black', hex: '#000000', category: 'basic' },
      { name: 'Pure Red', hex: '#FF0000', category: 'basic' },
      { name: 'Pure Green', hex: '#00FF00', category: 'basic' },
      { name: 'Pure Blue', hex: '#0000FF', category: 'basic' },
      { name: 'Pure Yellow', hex: '#FFFF00', category: 'basic' },
      { name: 'Pure Cyan', hex: '#00FFFF', category: 'basic' },
      { name: 'Pure Magenta', hex: '#FF00FF', category: 'basic' },
    ];

    // Metallic Colors
    const metallicColors = [
      { name: 'Gold', hex: '#FFD700', category: 'metallic', isMetallic: true, metalness: 1.0, roughness: 0.1 },
      { name: 'Silver', hex: '#C0C0C0', category: 'metallic', isMetallic: true, metalness: 1.0, roughness: 0.1 },
      { name: 'Copper', hex: '#B87333', category: 'metallic', isMetallic: true, metalness: 0.8, roughness: 0.2 },
      { name: 'Bronze', hex: '#CD7F32', category: 'metallic', isMetallic: true, metalness: 0.7, roughness: 0.3 },
      { name: 'Platinum', hex: '#E5E4E2', category: 'metallic', isMetallic: true, metalness: 0.9, roughness: 0.1 },
      { name: 'Rose Gold', hex: '#E8B4B8', category: 'metallic', isMetallic: true, metalness: 0.8, roughness: 0.15 },
    ];

    // Pastel Colors
    const pastelColors = [
      { name: 'Soft Pink', hex: '#FFB6C1', category: 'pastel' },
      { name: 'Lavender', hex: '#E6E6FA', category: 'pastel' },
      { name: 'Mint Green', hex: '#98FB98', category: 'pastel' },
      { name: 'Sky Blue', hex: '#87CEEB', category: 'pastel' },
      { name: 'Peach', hex: '#FFCCCB', category: 'pastel' },
      { name: 'Lemon Chiffon', hex: '#FFFACD', category: 'pastel' },
      { name: 'Powder Blue', hex: '#B0E0E6', category: 'pastel' },
      { name: 'Light Coral', hex: '#F08080', category: 'pastel' },
    ];

    // Vibrant Colors
    const vibrantColors = [
      { name: 'Electric Blue', hex: '#007FFF', category: 'vibrant' },
      { name: 'Neon Green', hex: '#39FF14', category: 'vibrant' },
      { name: 'Hot Pink', hex: '#FF69B4', category: 'vibrant' },
      { name: 'Orange Red', hex: '#FF4500', category: 'vibrant' },
      { name: 'Deep Purple', hex: '#8A2BE2', category: 'vibrant' },
      { name: 'Lime Green', hex: '#32CD32', category: 'vibrant' },
      { name: 'Crimson', hex: '#DC143C', category: 'vibrant' },
      { name: 'Turquoise', hex: '#40E0D0', category: 'vibrant' },
    ];

    // Neutral Colors
    const neutralColors = [
      { name: 'Charcoal', hex: '#36454F', category: 'neutral' },
      { name: 'Slate Gray', hex: '#708090', category: 'neutral' },
      { name: 'Warm Gray', hex: '#8B8680', category: 'neutral' },
      { name: 'Cool Gray', hex: '#808080', category: 'neutral' },
      { name: 'Beige', hex: '#F5F5DC', category: 'neutral' },
      { name: 'Cream', hex: '#FFFDD0', category: 'neutral' },
      { name: 'Ivory', hex: '#FFFFF0', category: 'neutral' },
      { name: 'Navy Blue', hex: '#000080', category: 'neutral' },
    ];

    // Add all colors to presets
    [...basicColors, ...metallicColors, ...pastelColors, ...vibrantColors, ...neutralColors].forEach(color => {
      const id = color.name.toLowerCase().replace(/\s+/g, '-');
      const rgb = this.hexToRgb(color.hex);
      const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

      this.colorPresets.set(id, {
        id,
        name: color.name,
        hex: color.hex,
        rgb,
        hsl,
        category: color.category,
        isMetallic: (color as any).isMetallic || false,
        metalness: (color as any).metalness || 0.0,
        roughness: (color as any).roughness || 0.5,
      });
    });
  }

  private initializeColorPalettes() {
    // Basic Palette
    this.colorPalettes.set('basic', {
      id: 'basic',
      name: 'Basic Colors',
      category: 'basic',
      colors: ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'],
    });

    // Metallic Palette
    this.colorPalettes.set('metallic', {
      id: 'metallic',
      name: 'Metallic Colors',
      category: 'metallic',
      colors: ['#FFD700', '#C0C0C0', '#B87333', '#CD7F32', '#E5E4E2', '#E8B4B8'],
    });

    // Pastel Palette
    this.colorPalettes.set('pastel', {
      id: 'pastel',
      name: 'Pastel Colors',
      category: 'pastel',
      colors: ['#FFB6C1', '#E6E6FA', '#98FB98', '#87CEEB', '#FFCCCB', '#FFFACD', '#B0E0E6', '#F08080'],
    });

    // Vibrant Palette
    this.colorPalettes.set('vibrant', {
      id: 'vibrant',
      name: 'Vibrant Colors',
      category: 'vibrant',
      colors: ['#007FFF', '#39FF14', '#FF69B4', '#FF4500', '#8A2BE2', '#32CD32', '#DC143C', '#40E0D0'],
    });

    // Neutral Palette
    this.colorPalettes.set('neutral', {
      id: 'neutral',
      name: 'Neutral Colors',
      category: 'neutral',
      colors: ['#36454F', '#708090', '#8B8680', '#808080', '#F5F5DC', '#FFFDD0', '#FFFFF0', '#000080'],
    });

    // Brand Colors
    this.colorPalettes.set('brand', {
      id: 'brand',
      name: 'Brand Colors',
      category: 'custom',
      colors: ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'],
    });
  }

  private createPreviewSphere() {
    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: this.currentColor,
      metalness: 0.0,
      roughness: 0.5,
    });

    this.previewSphere = new THREE.Mesh(geometry, material);
    this.previewSphere.position.set(0, 0, 0);
    this.previewSphere.visible = false;
  }

  setColor(color: string, meshName?: string): void {
    this.currentColor = color;

    // Update preview sphere
    if (this.previewSphere) {
      if (this.previewSphere.material instanceof THREE.MeshStandardMaterial) {
        this.previewSphere.material.color.set(color);
      }
    }

    // Apply color to model if mesh name provided
    if (meshName) {
      this.configurator.changeColor(meshName, color);
    }
  }

  setColorWithMaterial(color: string, meshName: string, isMetallic: boolean = false): void {
    this.setColor(color, meshName);

    // Apply material properties for metallic colors
    if (isMetallic) {
      const preset = this.getColorPresetByHex(color);
      if (preset && preset.isMetallic) {
        // This would require extending Configurator3D to support material properties
        // For now, we just change the color
        this.configurator.changeColor(meshName, color);
      }
    }
  }

  getColorPreset(id: string): ColorPreset | undefined {
    return this.colorPresets.get(id);
  }

  getColorPresetByHex(hex: string): ColorPreset | undefined {
    return Array.from(this.colorPresets.values()).find(preset => preset.hex.toLowerCase() === hex.toLowerCase());
  }

  getAllColorPresets(): ColorPreset[] {
    return Array.from(this.colorPresets.values());
  }

  getColorPresetsByCategory(category: string): ColorPreset[] {
    return this.getAllColorPresets().filter(preset => preset.category === category);
  }

  getColorPalette(id: string): ColorPalette | undefined {
    return this.colorPalettes.get(id);
  }

  getAllColorPalettes(): ColorPalette[] {
    return Array.from(this.colorPalettes.values());
  }

  createCustomColor(hex: string, name: string, category: string = 'custom'): ColorPreset {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

    const preset: ColorPreset = {
      id,
      name,
      hex,
      rgb,
      hsl,
      category,
      isMetallic: false,
      metalness: 0.0,
      roughness: 0.5,
    };

    this.colorPresets.set(id, preset);
    return preset;
  }

  createCustomPalette(name: string, colors: string[], category: string = 'custom'): ColorPalette {
    const id = `palette-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const palette: ColorPalette = {
      id,
      name,
      colors,
      category: category as any,
    };

    this.colorPalettes.set(id, palette);
    return palette;
  }

  generateColorVariations(baseColor: string, count: number = 5): string[] {
    const rgb = this.hexToRgb(baseColor);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const variations: string[] = [];

    for (let i = 0; i < count; i++) {
      const factor = (i + 1) / count;
      const newHsl = {
        h: hsl.h,
        s: Math.max(0, Math.min(100, hsl.s * (0.5 + factor * 0.5))),
        l: Math.max(0, Math.min(100, hsl.l * (0.7 + factor * 0.3))),
      };
      
      const newRgb = this.hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      variations.push(this.rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    }

    return variations;
  }

  getComplementaryColor(hex: string): string {
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    // Rotate hue by 180 degrees
    const complementaryHsl = {
      h: (hsl.h + 180) % 360,
      s: hsl.s,
      l: hsl.l,
    };
    
    const complementaryRgb = this.hslToRgb(complementaryHsl.h, complementaryHsl.s, complementaryHsl.l);
    return this.rgbToHex(complementaryRgb.r, complementaryRgb.g, complementaryRgb.b);
  }

  getAnalogousColors(hex: string, count: number = 3): string[] {
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const colors: string[] = [];

    for (let i = 0; i < count; i++) {
      const hueOffset = (i - Math.floor(count / 2)) * 30; // 30 degree steps
      const newHsl = {
        h: (hsl.h + hueOffset + 360) % 360,
        s: hsl.s,
        l: hsl.l,
      };
      
      const newRgb = this.hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      colors.push(this.rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    }

    return colors;
  }

  getTriadicColors(hex: string): string[] {
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const colors: string[] = [];

    for (let i = 0; i < 3; i++) {
      const newHsl = {
        h: (hsl.h + i * 120) % 360,
        s: hsl.s,
        l: hsl.l,
      };
      
      const newRgb = this.hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      colors.push(this.rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    }

    return colors;
  }

  // Color conversion utilities
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  getCurrentColor(): string {
    return this.currentColor;
  }

  showPreviewSphere(position: THREE.Vector3): void {
    if (this.previewSphere) {
      this.previewSphere.position.copy(position);
      this.previewSphere.visible = true;
      this.configurator.getScene().add(this.previewSphere);
    }
  }

  hidePreviewSphere(): void {
    if (this.previewSphere) {
      this.previewSphere.visible = false;
      this.configurator.getScene().remove(this.previewSphere);
    }
  }

  exportColorLibrary(): string {
    const library = {
      presets: Array.from(this.colorPresets.entries()),
      palettes: Array.from(this.colorPalettes.entries()),
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
    
    return JSON.stringify(library, null, 2);
  }

  importColorLibrary(libraryJson: string): void {
    try {
      const library = JSON.parse(libraryJson);
      
      if (library.presets && Array.isArray(library.presets)) {
        library.presets.forEach(([id, preset]: [string, ColorPreset]) => {
          this.colorPresets.set(id, preset);
        });
      }
      
      if (library.palettes && Array.isArray(library.palettes)) {
        library.palettes.forEach(([id, palette]: [string, ColorPalette]) => {
          this.colorPalettes.set(id, palette);
        });
      }
    } catch (error) {
      logger.error('Error importing color library', {
        error,
        libraryJson: typeof libraryJson === 'string' ? libraryJson.substring(0, 100) : 'object',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default ColorPicker3D;
