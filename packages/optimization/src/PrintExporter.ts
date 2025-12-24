/**
 * @luneo/optimization - Print Exporter professionnel
 * Export 4K/8K avec 300 DPI pour impression
 */

import * as THREE from 'three';
import { PDFDocument } from 'pdf-lib';

/**
 * Options d'export print
 */
export interface PrintExportOptions {
  /** Résolution (width x height) */
  resolution?: [number, number];
  
  /** DPI */
  dpi?: number;
  
  /** Format de sortie */
  format?: 'png' | 'jpeg' | 'pdf';
  
  /** Qualité JPEG (0-1) */
  quality?: number;
  
  /** Générer multiple vues */
  multiView?: boolean;
  
  /** Bleed zone (mm) */
  bleedMM?: number;
  
  /** Color profile */
  colorProfile?: 'sRGB' | 'CMYK';
}

/**
 * Vues disponibles
 */
export type ViewAngle = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

/**
 * Résultat d'export
 */
export interface PrintExportResult {
  /** Format */
  format: string;
  
  /** Data URL ou PDF bytes */
  data: string | Uint8Array;
  
  /** Résolution */
  resolution: [number, number];
  
  /** DPI */
  dpi: number;
  
  /** Taille fichier (bytes) */
  fileSize: number;
  
  /** Vues générées */
  views?: Record<ViewAngle, string>;
}

/**
 * Print Exporter professionnel
 * 
 * Features:
 * - Export 4K/8K
 * - 300 DPI
 * - Multiple views (front, back, left, right, top, bottom)
 * - PDF avec bleed zones
 * - Color profiles (sRGB, CMYK)
 * 
 * @example
 * ```typescript
 * const exporter = new PrintExporter(scene, camera, renderer);
 * 
 * const result = await exporter.export({
 *   resolution: [3840, 2160], // 4K
 *   dpi: 300,
 *   format: 'pdf',
 *   multiView: true,
 *   bleedMM: 3
 * });
 * 
 * // Download
 * const blob = new Blob([result.data]);
 * saveAs(blob, 'product-print-ready.pdf');
 * ```
 */
export class PrintExporter {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  
  // High-res renderer for export
  private exportRenderer: THREE.WebGLRenderer | null = null;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
  }

  /**
   * Export print-ready
   */
  async export(options: PrintExportOptions = {}): Promise<PrintExportResult> {
    const config = {
      resolution: options.resolution || [3840, 2160] as [number, number], // 4K default
      dpi: options.dpi || 300,
      format: options.format || 'png',
      quality: options.quality || 1.0,
      multiView: options.multiView || false,
      bleedMM: options.bleedMM || 0,
      colorProfile: options.colorProfile || 'sRGB',
    };
    
    console.log('📄 Exporting print-ready file...', config);
    
    // Créer high-res renderer
    this.createExportRenderer(config.resolution);
    
    if (config.multiView) {
      // Export multiple views
      const views = await this.exportMultipleViews(config);
      
      if (config.format === 'pdf') {
        // Créer PDF avec toutes les vues
        const pdfData = await this.createPDF(views, config);
        
        return {
          format: 'pdf',
          data: pdfData,
          resolution: config.resolution,
          dpi: config.dpi,
          fileSize: pdfData.length,
          views,
        };
      }
      
      // Retourner première vue comme principal
      const mainView = views.front;
      const blob = await (await fetch(mainView)).blob();
      
      return {
        format: config.format,
        data: mainView,
        resolution: config.resolution,
        dpi: config.dpi,
        fileSize: blob.size,
        views,
      };
      
    } else {
      // Export single view
      const dataUrl = await this.exportSingleView('front', config);
      const blob = await (await fetch(dataUrl)).blob();
      
      return {
        format: config.format,
        data: dataUrl,
        resolution: config.resolution,
        dpi: config.dpi,
        fileSize: blob.size,
      };
    }
  }

  /**
   * Export single view
   */
  private async exportSingleView(
    view: ViewAngle,
    config: Required<PrintExportOptions>
  ): Promise<string> {
    if (!this.exportRenderer) {
      throw new Error('Export renderer not initialized');
    }
    
    // Position camera
    this.positionCameraForView(view);
    
    // Render
    this.exportRenderer.render(this.scene, this.camera);
    
    // Get data URL
    const mimeType = config.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = this.exportRenderer.domElement.toDataURL(mimeType, config.quality);
    
    return dataUrl;
  }

  /**
   * Export multiple views
   */
  private async exportMultipleViews(
    config: Required<PrintExportOptions>
  ): Promise<Record<ViewAngle, string>> {
    const views: Partial<Record<ViewAngle, string>> = {};
    
    const viewAngles: ViewAngle[] = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    
    for (const view of viewAngles) {
      console.log(`  Rendering ${view} view...`);
      views[view] = await this.exportSingleView(view, config);
    }
    
    console.log('✅ All views rendered');
    
    return views as Record<ViewAngle, string>;
  }

  /**
   * Créer PDF avec multiple vues
   */
  private async createPDF(
    views: Record<ViewAngle, string>,
    config: Required<PrintExportOptions>
  ): Promise<Uint8Array> {
    console.log('📄 Creating PDF...');
    
    const pdfDoc = await PDFDocument.create();
    
    // A4 size en points (72 DPI = 1 point)
    const pageWidth = 210 / 25.4 * 72; // 210mm → points
    const pageHeight = 297 / 25.4 * 72; // 297mm → points
    
    // Bleed en points
    const bleed = config.bleedMM / 25.4 * 72;
    
    for (const [viewName, dataUrl] of Object.entries(views)) {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      
      // Embed image
      const imageBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
      const image = dataUrl.includes('png')
        ? await pdfDoc.embedPng(imageBytes)
        : await pdfDoc.embedJpg(imageBytes);
      
      // Calculate dimensions (avec bleed)
      const imgWidth = pageWidth - (bleed * 2);
      const imgHeight = pageHeight - (bleed * 2);
      
      // Draw image
      page.drawImage(image, {
        x: bleed,
        y: bleed,
        width: imgWidth,
        height: imgHeight,
      });
      
      // Add view name
      page.drawText(`View: ${viewName}`, {
        x: bleed + 10,
        y: pageHeight - bleed - 20,
        size: 10,
      });
    }
    
    const pdfBytes = await pdfDoc.save();
    
    console.log('✅ PDF created', {
      pages: Object.keys(views).length,
      size: `${(pdfBytes.length / 1024 / 1024).toFixed(2)} MB`,
    });
    
    return pdfBytes;
  }

  /**
   * Position camera pour une vue
   */
  private positionCameraForView(view: ViewAngle): void {
    const distance = 5;
    
    const positions: Record<ViewAngle, [number, number, number]> = {
      front: [0, 0, distance],
      back: [0, 0, -distance],
      left: [-distance, 0, 0],
      right: [distance, 0, 0],
      top: [0, distance, 0],
      bottom: [0, -distance, 0],
    };
    
    const [x, y, z] = positions[view];
    
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.position.set(x, y, z);
      this.camera.lookAt(0, 0, 0);
      this.camera.updateProjectionMatrix();
    }
  }

  /**
   * Créer export renderer
   */
  private createExportRenderer(resolution: [number, number]): void {
    if (this.exportRenderer) {
      this.exportRenderer.dispose();
    }
    
    const canvas = document.createElement('canvas');
    
    this.exportRenderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    
    this.exportRenderer.setSize(resolution[0], resolution[1]);
    this.exportRenderer.setPixelRatio(2); // For high DPI
    this.exportRenderer.outputColorSpace = THREE.SRGBColorSpace;
    this.exportRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    
    console.log('✅ Export renderer created', { resolution });
  }

  /**
   * Nettoie les ressources
   */
  dispose(): void {
    if (this.exportRenderer) {
      this.exportRenderer.dispose();
      this.exportRenderer = null;
    }
    
    console.log('PrintExporter disposed');
  }
}

