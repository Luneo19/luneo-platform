import type { DesignData } from '../types/designer.types';

export class ExportService {
  async exportAsPNG(designData: DesignData, width?: number, height?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      const w = width || designData.canvas.width;
      const h = height || designData.canvas.height;
      
      canvas.width = w;
      canvas.height = h;
      
      // Fill background
      ctx.fillStyle = designData.canvas.backgroundColor;
      ctx.fillRect(0, 0, w, h);
      
      // Render layers (simplified - in production, use Fabric.js canvas)
      // Note: This is a placeholder - actual rendering should use Fabric.js
      // For now, we just fill the background
      // TODO: Implement proper layer rendering using Fabric.js
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to export as PNG'));
        }
      }, 'image/png');
    });
  }
  
  async exportAsPDF(_designData: DesignData): Promise<Blob> {
    // In production, use jsPDF or similar library
    throw new Error('PDF export not yet implemented');
  }
  
  exportAsJSON(designData: DesignData): string {
    return JSON.stringify(designData, null, 2);
  }
  
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

