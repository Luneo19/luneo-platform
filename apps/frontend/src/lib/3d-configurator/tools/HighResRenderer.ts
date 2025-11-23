import * as THREE from 'three';
import { Configurator3D } from '../core/Configurator3D';

export interface RenderOptions {
  width?: number;
  height?: number;
  dpi?: number;
  format?: 'png' | 'jpg' | 'webp';
  quality?: number;
  transparent?: boolean;
  antialias?: boolean;
  samples?: number;
  cameraPosition?: THREE.Vector3;
  cameraTarget?: THREE.Vector3;
  background?: string | null;
}

export interface RenderPreset {
  name: string;
  width: number;
  height: number;
  description: string;
}

export class HighResRenderer {
  private configurator: Configurator3D;
  private renderTarget: THREE.WebGLRenderTarget | null = null;

  // Render presets
  private presets: Map<string, RenderPreset> = new Map([
    ['thumbnail', { name: 'Thumbnail', width: 256, height: 256, description: 'Small preview' }],
    ['preview', { name: 'Preview', width: 512, height: 512, description: 'Medium preview' }],
    ['standard', { name: 'Standard', width: 1024, height: 1024, description: 'Standard quality' }],
    ['hd', { name: 'HD', width: 1920, height: 1080, description: 'Full HD' }],
    ['2k', { name: '2K', width: 2048, height: 2048, description: '2K square' }],
    ['4k', { name: '4K', width: 3840, height: 2160, description: '4K Ultra HD' }],
    ['8k', { name: '8K', width: 7680, height: 4320, description: '8K Ultra HD' }],
    ['print-small', { name: 'Print Small', width: 2400, height: 3000, description: 'Print 8x10" @300 DPI' }],
    ['print-medium', { name: 'Print Medium', width: 3300, height: 4200, description: 'Print 11x14" @300 DPI' }],
    ['print-large', { name: 'Print Large', width: 4800, height: 6000, description: 'Print 16x20" @300 DPI' }],
  ]);

  constructor(configurator: Configurator3D) {
    this.configurator = configurator;
  }

  async render(options: RenderOptions = {}): Promise<string> {
    const {
      width = 2000,
      height = 2000,
      dpi = 300,
      format = 'png',
      quality = 1.0,
      transparent = false,
      antialias = true,
      samples = 4,
      cameraPosition,
      cameraTarget,
      background,
    } = options;

    const scaleFactor = dpi / 96;
    const targetWidth = Math.round(width * scaleFactor);
    const targetHeight = Math.round(height * scaleFactor);

    // Save current state
    const originalRenderer = this.configurator.getRenderer();
    const originalCamera = this.configurator.getCamera();
    const originalSize = new THREE.Vector2();
    originalRenderer.getSize(originalSize);
    const originalBackground = this.configurator.getScene().background;
    const originalCameraPosition = originalCamera.position.clone();
    const originalCameraTarget = new THREE.Vector3();
    originalCamera.getWorldDirection(originalCameraTarget);

    try {
      // Create high-res render target
      this.renderTarget = new THREE.WebGLRenderTarget(targetWidth, targetHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: transparent ? THREE.RGBAFormat : THREE.RGBFormat,
        samples: antialias ? samples : 0,
      });

      // Configure camera
      if (cameraPosition) {
        originalCamera.position.copy(cameraPosition);
      }
      if (cameraTarget) {
        originalCamera.lookAt(cameraTarget);
      }
      originalCamera.aspect = targetWidth / targetHeight;
      originalCamera.updateProjectionMatrix();

      // Configure background
      if (background !== undefined) {
        this.configurator.getScene().background = background 
          ? new THREE.Color(background) 
          : null;
      }

      // Render to target
      originalRenderer.setRenderTarget(this.renderTarget);
      originalRenderer.setSize(targetWidth, targetHeight, false);
      originalRenderer.render(this.configurator.getScene(), originalCamera);

      // Read pixels
      const pixels = new Uint8Array(targetWidth * targetHeight * 4);
      originalRenderer.readRenderTargetPixels(
        this.renderTarget,
        0, 0,
        targetWidth, targetHeight,
        pixels
      );

      // Create canvas and draw pixels
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Convert pixels to ImageData
      const imageData = ctx.createImageData(targetWidth, targetHeight);
      imageData.data.set(pixels);

      // Flip image vertically (WebGL renders upside down)
      const flippedCanvas = document.createElement('canvas');
      flippedCanvas.width = targetWidth;
      flippedCanvas.height = targetHeight;
      const flippedCtx = flippedCanvas.getContext('2d');
      
      if (!flippedCtx) {
        throw new Error('Could not get flipped canvas context');
      }

      flippedCtx.translate(0, targetHeight);
      flippedCtx.scale(1, -1);
      flippedCtx.putImageData(imageData, 0, 0);

      // Get data URL
      const mimeType = `image/${format}`;
      const dataUrl = flippedCanvas.toDataURL(mimeType, quality);

      // Cleanup
      this.renderTarget.dispose();
      this.renderTarget = null;

      return dataUrl;
    } finally {
      // Restore original state
      originalRenderer.setRenderTarget(null);
      originalRenderer.setSize(originalSize.x, originalSize.y);
      this.configurator.getScene().background = originalBackground;
      originalCamera.position.copy(originalCameraPosition);
      originalCamera.lookAt(originalCameraTarget);
      originalCamera.aspect = originalSize.x / originalSize.y;
      originalCamera.updateProjectionMatrix();
    }
  }

  async renderPreset(presetName: string, options: Partial<RenderOptions> = {}): Promise<string> {
    const preset = this.presets.get(presetName);
    
    if (!preset) {
      throw new Error(`Preset not found: ${presetName}`);
    }

    return this.render({
      width: preset.width,
      height: preset.height,
      ...options,
    });
  }

  async renderMultiAngle(angles: number[], options: RenderOptions = {}): Promise<string[]> {
    const results: string[] = [];
    const originalPosition = this.configurator.getCamera().position.clone();
    const center = new THREE.Vector3(0, 0, 0);
    const radius = originalPosition.length();

    for (const angle of angles) {
      const radians = (angle * Math.PI) / 180;
      const x = Math.cos(radians) * radius;
      const z = Math.sin(radians) * radius;
      
      const dataUrl = await this.render({
        ...options,
        cameraPosition: new THREE.Vector3(x, originalPosition.y, z),
        cameraTarget: center,
      });
      
      results.push(dataUrl);
    }

    return results;
  }

  async render360(steps: number = 36, options: RenderOptions = {}): Promise<string[]> {
    const angles = Array.from({ length: steps }, (_, i) => (360 / steps) * i);
    return this.renderMultiAngle(angles, options);
  }

  async renderTurntable(
    frames: number = 60,
    duration: number = 3000,
    options: RenderOptions = {}
  ): Promise<{ frames: string[]; fps: number }> {
    const fps = frames / (duration / 1000);
    const framesData = await this.render360(frames, options);
    
    return {
      frames: framesData,
      fps,
    };
  }

  async renderFromAngles(
    elevation: number,
    azimuth: number,
    distance: number,
    options: RenderOptions = {}
  ): Promise<string> {
    // Convert spherical coordinates to Cartesian
    const elevationRad = (elevation * Math.PI) / 180;
    const azimuthRad = (azimuth * Math.PI) / 180;
    
    const x = distance * Math.cos(elevationRad) * Math.sin(azimuthRad);
    const y = distance * Math.sin(elevationRad);
    const z = distance * Math.cos(elevationRad) * Math.cos(azimuthRad);

    return this.render({
      ...options,
      cameraPosition: new THREE.Vector3(x, y, z),
      cameraTarget: new THREE.Vector3(0, 0, 0),
    });
  }

  async renderOrthographic(options: RenderOptions = {}): Promise<string> {
    // Save current camera
    const originalCamera = this.configurator.getCamera();
    const scene = this.configurator.getScene();
    const renderer = this.configurator.getRenderer();

    // Create orthographic camera
    const frustumSize = 2;
    const aspect = (options.width || 2000) / (options.height || 2000);
    const orthoCamera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );

    orthoCamera.position.copy(originalCamera.position);
    orthoCamera.lookAt(0, 0, 0);

    try {
      // Temporarily replace camera
      const width = options.width || 2000;
      const height = options.height || 2000;

      this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: options.transparent ? THREE.RGBAFormat : THREE.RGBFormat,
      });

      renderer.setRenderTarget(this.renderTarget);
      renderer.setSize(width, height, false);
      renderer.render(scene, orthoCamera);

      // Read and convert to data URL
      const pixels = new Uint8Array(width * height * 4);
      renderer.readRenderTargetPixels(this.renderTarget, 0, 0, width, height, pixels);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      const imageData = ctx.createImageData(width, height);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);

      return canvas.toDataURL('image/png');
    } finally {
      renderer.setRenderTarget(null);
      if (this.renderTarget) {
        this.renderTarget.dispose();
        this.renderTarget = null;
      }
    }
  }

  getPresets(): RenderPreset[] {
    return Array.from(this.presets.values());
  }

  getPreset(name: string): RenderPreset | undefined {
    return this.presets.get(name);
  }

  addPreset(id: string, preset: RenderPreset): void {
    this.presets.set(id, preset);
  }

  async renderWithWatermark(
    watermarkText: string,
    options: RenderOptions = {}
  ): Promise<string> {
    const baseImage = await this.render(options);
    
    // Create canvas for compositing
    const canvas = document.createElement('canvas');
    canvas.width = options.width || 2000;
    canvas.height = options.height || 2000;
    const ctx = canvas.getContext('2d')!;

    // Load base image
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Draw base image
        ctx.drawImage(img, 0, 0);

        // Add watermark
        ctx.font = '48px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(watermarkText, canvas.width / 2, canvas.height - 50);

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = baseImage;
    });
  }

  dispose(): void {
    if (this.renderTarget) {
      this.renderTarget.dispose();
      this.renderTarget = null;
    }
  }
}

export default HighResRenderer;
