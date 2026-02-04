import type { DesignData, Layer, TextLayerData, ImageLayerData, ShapeLayerData } from '../types/designer.types';

export class ExportService {
  /**
   * Export design as PNG with full layer rendering
   */
  async exportAsPNG(designData: DesignData, width?: number, height?: number): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }
    
    const w = width || designData.canvas.width;
    const h = height || designData.canvas.height;
    const scaleX = w / designData.canvas.width;
    const scaleY = h / designData.canvas.height;
    
    canvas.width = w;
    canvas.height = h;
    
    // Fill background
    ctx.fillStyle = designData.canvas.backgroundColor;
    ctx.fillRect(0, 0, w, h);
    
    // Sort layers by zIndex
    const sortedLayers = [...designData.layers].sort((a, b) => a.zIndex - b.zIndex);
    
    // Render each layer
    for (const layer of sortedLayers) {
      if (!layer.visible) continue;
      await this.renderLayer(ctx, layer, scaleX, scaleY);
    }
    
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to export as PNG'));
        }
      }, 'image/png', 1.0);
    });
  }
  
  /**
   * Render a single layer to canvas context
   */
  private async renderLayer(
    ctx: CanvasRenderingContext2D,
    layer: Layer,
    scaleX: number,
    scaleY: number
  ): Promise<void> {
    ctx.save();
    
    // Apply opacity
    ctx.globalAlpha = layer.opacity;
    
    // Calculate scaled positions
    const x = layer.x * scaleX;
    const y = layer.y * scaleY;
    const width = layer.width * scaleX;
    const height = layer.height * scaleY;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    // Apply rotation around center
    ctx.translate(centerX, centerY);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
    
    switch (layer.type) {
      case 'text':
        await this.renderTextLayer(ctx, layer, x, y, width, height, scaleX);
        break;
      case 'image':
        await this.renderImageLayer(ctx, layer, x, y, width, height);
        break;
      case 'shape':
        await this.renderShapeLayer(ctx, layer, x, y, width, height, centerX, centerY);
        break;
    }
    
    ctx.restore();
  }
  
  /**
   * Render text layer
   */
  private async renderTextLayer(
    ctx: CanvasRenderingContext2D,
    layer: Layer,
    x: number,
    y: number,
    width: number,
    _height: number,
    scale: number
  ): Promise<void> {
    const data = layer.data as TextLayerData;
    
    const fontSize = data.fontSize * scale;
    ctx.font = `${data.fontStyle} ${data.fontWeight} ${fontSize}px ${data.fontFamily}`;
    ctx.fillStyle = data.color;
    ctx.textBaseline = 'top';
    
    // Handle text alignment
    let textX = x;
    if (data.textAlign === 'center') {
      ctx.textAlign = 'center';
      textX = x + width / 2;
    } else if (data.textAlign === 'right') {
      ctx.textAlign = 'right';
      textX = x + width;
    } else {
      ctx.textAlign = 'left';
    }
    
    // Handle multiline text
    const lines = data.content.split('\n');
    const lineHeight = fontSize * (data.lineHeight || 1.2);
    
    lines.forEach((line, index) => {
      ctx.fillText(line, textX, y + index * lineHeight);
    });
  }
  
  /**
   * Render image layer
   */
  private async renderImageLayer(
    ctx: CanvasRenderingContext2D,
    layer: Layer,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    const data = layer.data as ImageLayerData;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Apply fit mode
        if (data.fit === 'cover') {
          const imgRatio = img.width / img.height;
          const boxRatio = width / height;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          
          if (imgRatio > boxRatio) {
            sw = img.height * boxRatio;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / boxRatio;
            sy = (img.height - sh) / 2;
          }
          
          ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
        } else if (data.fit === 'contain') {
          const imgRatio = img.width / img.height;
          const boxRatio = width / height;
          let dw = width, dh = height, dx = x, dy = y;
          
          if (imgRatio > boxRatio) {
            dh = width / imgRatio;
            dy = y + (height - dh) / 2;
          } else {
            dw = height * imgRatio;
            dx = x + (width - dw) / 2;
          }
          
          ctx.drawImage(img, dx, dy, dw, dh);
        } else {
          ctx.drawImage(img, x, y, width, height);
        }
        resolve();
      };
      
      img.onerror = () => {
        console.warn(`Failed to load image: ${data.url}`);
        resolve(); // Continue rendering other layers
      };
      
      img.src = data.url;
    });
  }
  
  /**
   * Render shape layer
   */
  private async renderShapeLayer(
    ctx: CanvasRenderingContext2D,
    layer: Layer,
    x: number,
    y: number,
    width: number,
    height: number,
    centerX: number,
    centerY: number
  ): Promise<void> {
    const data = layer.data as ShapeLayerData;
    
    ctx.fillStyle = data.fill;
    ctx.strokeStyle = data.stroke;
    ctx.lineWidth = data.strokeWidth;
    
    switch (data.shapeType) {
      case 'rectangle':
        if (data.cornerRadius && data.cornerRadius > 0) {
          this.roundRect(ctx, x, y, width, height, data.cornerRadius);
          ctx.fill();
          if (data.strokeWidth > 0) ctx.stroke();
        } else {
          ctx.fillRect(x, y, width, height);
          if (data.strokeWidth > 0) ctx.strokeRect(x, y, width, height);
        }
        break;
        
      case 'circle':
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.min(width, height) / 2, 0, Math.PI * 2);
        ctx.fill();
        if (data.strokeWidth > 0) ctx.stroke();
        break;
        
      case 'ellipse':
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        if (data.strokeWidth > 0) ctx.stroke();
        break;
        
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(centerX, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.closePath();
        ctx.fill();
        if (data.strokeWidth > 0) ctx.stroke();
        break;
        
      case 'star':
        this.drawStar(ctx, centerX, centerY, 5, width / 2, width / 4);
        ctx.fill();
        if (data.strokeWidth > 0) ctx.stroke();
        break;
        
      case 'polygon':
        const sides = data.sides || 6;
        this.drawPolygon(ctx, centerX, centerY, Math.min(width, height) / 2, sides);
        ctx.fill();
        if (data.strokeWidth > 0) ctx.stroke();
        break;
    }
  }
  
  /**
   * Draw rounded rectangle
   */
  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  
  /**
   * Draw star shape
   */
  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ): void {
    ctx.beginPath();
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }
  
  /**
   * Draw regular polygon
   */
  private drawPolygon(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    sides: number
  ): void {
    ctx.beginPath();
    const angle = (Math.PI * 2) / sides;
    
    ctx.moveTo(cx + radius * Math.cos(-Math.PI / 2), cy + radius * Math.sin(-Math.PI / 2));
    for (let i = 1; i <= sides; i++) {
      ctx.lineTo(
        cx + radius * Math.cos(angle * i - Math.PI / 2),
        cy + radius * Math.sin(angle * i - Math.PI / 2)
      );
    }
    ctx.closePath();
  }
  
  /**
   * Export design as PDF
   */
  async exportAsPDF(designData: DesignData): Promise<Blob> {
    // First export as high-quality PNG
    const pngBlob = await this.exportAsPNG(designData);
    const pngUrl = URL.createObjectURL(pngBlob);
    
    // Dynamic import of jsPDF
    const { jsPDF } = await import('jspdf');
    
    // Convert px to mm (1px ≈ 0.264583mm at 96 DPI)
    const pxToMm = 0.264583;
    const widthMm = designData.canvas.width * pxToMm;
    const heightMm = designData.canvas.height * pxToMm;
    
    const pdf = new jsPDF({
      orientation: widthMm > heightMm ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [widthMm, heightMm],
    });
    
    // Add image to PDF
    pdf.addImage(pngUrl, 'PNG', 0, 0, widthMm, heightMm);
    
    // Cleanup
    URL.revokeObjectURL(pngUrl);
    
    return pdf.output('blob');
  }
  
  /**
   * Export design as SVG
   */
  async exportAsSVG(designData: DesignData): Promise<string> {
    const { width, height, backgroundColor } = designData.canvas;
    const sortedLayers = [...designData.layers].sort((a, b) => a.zIndex - b.zIndex);
    
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>`;
    
    for (const layer of sortedLayers) {
      if (!layer.visible) continue;
      svgContent += this.layerToSVG(layer);
    }
    
    svgContent += '\n</svg>';
    return svgContent;
  }
  
  /**
   * Convert layer to SVG element
   */
  private layerToSVG(layer: Layer): string {
    const transform = layer.rotation !== 0 
      ? ` transform="rotate(${layer.rotation} ${layer.x + layer.width/2} ${layer.y + layer.height/2})"`
      : '';
    const opacity = layer.opacity !== 1 ? ` opacity="${layer.opacity}"` : '';
    
    switch (layer.type) {
      case 'text': {
        const data = layer.data as TextLayerData;
        return `\n  <text x="${layer.x}" y="${layer.y + data.fontSize}" font-family="${data.fontFamily}" font-size="${data.fontSize}" font-weight="${data.fontWeight}" font-style="${data.fontStyle}" fill="${data.color}"${transform}${opacity}>${this.escapeXml(data.content)}</text>`;
      }
      case 'image': {
        const data = layer.data as ImageLayerData;
        return `\n  <image href="${data.url}" x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}"${transform}${opacity}/>`;
      }
      case 'shape': {
        const data = layer.data as ShapeLayerData;
        const stroke = data.strokeWidth > 0 ? ` stroke="${data.stroke}" stroke-width="${data.strokeWidth}"` : '';
        
        if (data.shapeType === 'rectangle') {
          const rx = data.cornerRadius ? ` rx="${data.cornerRadius}"` : '';
          return `\n  <rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" fill="${data.fill}"${stroke}${rx}${transform}${opacity}/>`;
        } else if (data.shapeType === 'circle') {
          const r = Math.min(layer.width, layer.height) / 2;
          return `\n  <circle cx="${layer.x + layer.width/2}" cy="${layer.y + layer.height/2}" r="${r}" fill="${data.fill}"${stroke}${transform}${opacity}/>`;
        } else if (data.shapeType === 'ellipse') {
          return `\n  <ellipse cx="${layer.x + layer.width/2}" cy="${layer.y + layer.height/2}" rx="${layer.width/2}" ry="${layer.height/2}" fill="${data.fill}"${stroke}${transform}${opacity}/>`;
        }
        return '';
      }
      default:
        return '';
    }
  }
  
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  
  /**
   * Export design as JSON
   */
  exportAsJSON(designData: DesignData): string {
    return JSON.stringify(designData, null, 2);
  }
  
  /**
   * Download blob as file
   */
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

