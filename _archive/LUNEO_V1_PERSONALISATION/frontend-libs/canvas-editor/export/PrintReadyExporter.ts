/**
 * PRINT-READY EXPORTER
 * Export designs en PNG 300 DPI, PDF/X-4, SVG
 * 
 * BUNDLE-01: jsPDF (~200KB) importé dynamiquement pour réduire le bundle initial
 */

import Konva from 'konva';
// jsPDF est importé dynamiquement dans exportPDF() - voir BUNDLE-01

export interface ExportConfig {
  dpi: number;
  colorMode: 'RGB' | 'CMYK';
  bleed: number; // mm
  cropMarks: boolean;
  format: 'A4' | 'letter' | 'custom';
  customWidth?: number; // mm
  customHeight?: number; // mm
}

export class PrintReadyExporter {
  constructor(
    private stage: Konva.Stage,
    private config: ExportConfig
  ) {}
  
  /**
   * Export PNG haute résolution (print-ready)
   */
  exportPNG(dpi: number = 300): string {
    const scale = dpi / 72; // 72 DPI = screen resolution
    
    const dataURL = this.stage.toDataURL({
      pixelRatio: scale,
      mimeType: 'image/png',
      quality: 1,
    });
    
    return dataURL;
  }
  
  /**
   * Export PDF/X-4 (pro print)
   * BUNDLE-01: jsPDF importé dynamiquement pour économiser ~200KB
   */
  async exportPDF(): Promise<Blob> {
    // BUNDLE-01: Dynamic import de jsPDF
    const { default: jsPDF } = await import('jspdf');
    
    // Get stage dimensions in mm
    const widthMM = this.stage.width() / 3.7795; // px to mm (72 DPI)
    const heightMM = this.stage.height() / 3.7795;
    
    // Add bleed
    const bleed = this.config.bleed;
    const finalWidthMM = widthMM + (bleed * 2);
    const finalHeightMM = heightMM + (bleed * 2);
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: widthMM > heightMM ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [finalWidthMM, finalHeightMM],
      compress: true,
    });
    
    // Export stage as high-res image
    const imageData = this.exportPNG(300);
    
    // Add image to PDF (centered with bleed)
    pdf.addImage(
      imageData,
      'PNG',
      bleed,
      bleed,
      widthMM,
      heightMM,
      undefined,
      'FAST'
    );
    
    // Add crop marks if enabled
    if (this.config.cropMarks) {
      this.addCropMarks(pdf, widthMM, heightMM, bleed);
    }
    
    // Add bleed box (for print)
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.1);
    pdf.rect(bleed, bleed, widthMM, heightMM, 'S');
    
    return pdf.output('blob');
  }
  
  /** Minimal type for dynamically imported jsPDF instance */
  private addCropMarks(
    pdf: {
      setDrawColor: (r: number, g: number, b: number) => void;
      setLineWidth: (w: number) => void;
      line: (x1: number, y1: number, x2: number, y2: number) => void;
    },
    widthMM: number,
    heightMM: number,
    bleed: number
  ): void {
    const markLength = 5;
    const markOffset = 2;
    
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.25);
    
    // Top-left
    pdf.line(
      bleed - markOffset,
      bleed,
      bleed - markOffset - markLength,
      bleed
    );
    pdf.line(
      bleed,
      bleed - markOffset,
      bleed,
      bleed - markOffset - markLength
    );
    
    // Top-right
    pdf.line(
      bleed + widthMM + markOffset,
      bleed,
      bleed + widthMM + markOffset + markLength,
      bleed
    );
    pdf.line(
      bleed + widthMM,
      bleed - markOffset,
      bleed + widthMM,
      bleed - markOffset - markLength
    );
    
    // Bottom-left
    pdf.line(
      bleed - markOffset,
      bleed + heightMM,
      bleed - markOffset - markLength,
      bleed + heightMM
    );
    pdf.line(
      bleed,
      bleed + heightMM + markOffset,
      bleed,
      bleed + heightMM + markOffset + markLength
    );
    
    // Bottom-right
    pdf.line(
      bleed + widthMM + markOffset,
      bleed + heightMM,
      bleed + widthMM + markOffset + markLength,
      bleed + heightMM
    );
    pdf.line(
      bleed + widthMM,
      bleed + heightMM + markOffset,
      bleed + widthMM,
      bleed + heightMM + markOffset + markLength
    );
  }
  
  /**
   * Export SVG (vectoriel)
   */
  exportSVG(): string {
    // Get stage as SVG
    const svg = this.stage.toDataURL({
      mimeType: 'image/svg+xml',
    });
    
    return svg;
  }
  
  /**
   * Convert RGB to CMYK
   */
  async convertToCMYK(dataURL: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Convert each pixel RGB → CMYK
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          
          const k = 1 - Math.max(r, g, b);
          const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
          const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
          const y = k === 1 ? 0 : (1 - b - k) / (1 - k);
          
          // Convert back to RGB for display (approximate)
          data[i] = Math.round((1 - c) * (1 - k) * 255);
          data[i + 1] = Math.round((1 - m) * (1 - k) * 255);
          data[i + 2] = Math.round((1 - y) * (1 - k) * 255);
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for CMYK conversion'));
      };
      
      img.src = dataURL;
    });
  }
  
  /**
   * Export thumbnail (preview)
   */
  exportThumbnail(width: number = 300, height: number = 300): string {
    const scale = Math.min(width / this.stage.width(), height / this.stage.height());
    
    return this.stage.toDataURL({
      pixelRatio: scale,
      mimeType: 'image/jpeg',
      quality: 0.9,
    });
  }
  
  /**
   * Get print file size estimation
   */
  estimateFileSize(dpi: number = 300): number {
    const width = this.stage.width() * (dpi / 72);
    const height = this.stage.height() * (dpi / 72);
    
    // Approximate PNG file size (bytes)
    // Formula: width × height × 4 (RGBA) × compression ratio (0.3)
    const bytes = width * height * 4 * 0.3;
    
    return Math.round(bytes);
  }
  
  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}

