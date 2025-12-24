import sharp from 'sharp';
import { CMYKConverter } from './CMYKConverter';
import { BleedCropMarks } from './BleedCropMarks';
import { logger } from '@/lib/logger';

export interface PrintReadyOptions {
  dpi?: number;
  colorMode?: 'RGB' | 'CMYK';
  includeBleed?: boolean;
  bleedSizeMm?: number;
  includeCropMarks?: boolean;
  includeColorBars?: boolean;
  includeRegistrationMarks?: boolean;
  outputFormat?: 'PNG' | 'TIFF' | 'PDF';
  iccProfile?: string;
  compression?: 'none' | 'lzw' | 'zip';
}

export interface PrintReadyResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  dpi: number;
  colorMode: string;
  fileSize: number;
  metadata: any;
}

export class PrintReadyGenerator {
  private cmykConverter: CMYKConverter;
  private bleedCropMarks: BleedCropMarks;

  constructor() {
    this.cmykConverter = new CMYKConverter();
    this.bleedCropMarks = new BleedCropMarks();
  }

  async generatePNG(
    _designData: any,
    _options: { width: number; height: number; dpi: number } = { width: 800, height: 600, dpi: 300 }
  ): Promise<{ success: boolean; imageData?: Buffer; fileSize?: number; error?: string }> {
    try {
      // Create a simple placeholder PNG for now
      const placeholderData = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
      const buffer = Buffer.from(placeholderData.split(',')[1], 'base64');
      
      return {
        success: true,
        imageData: buffer,
        fileSize: buffer.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateSVG(
    _designData: any
  ): Promise<{ success: boolean; svgContent?: string; fileSize?: number; error?: string }> {
    try {
      // Create a simple placeholder SVG for now
      const svgContent = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="white"/>
        <text x="400" y="300" text-anchor="middle" font-family="Arial" font-size="24" fill="black">Design Placeholder</text>
      </svg>`;
      
      return {
        success: true,
        svgContent,
        fileSize: svgContent.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateFromCanvas(
    canvasDataUrl: string,
    options: PrintReadyOptions = {}
  ): Promise<PrintReadyResult> {
    const {
      dpi = 300,
      colorMode = 'CMYK',
      includeBleed = true,
      bleedSizeMm = 3,
      includeCropMarks = true,
      includeColorBars = true,
      includeRegistrationMarks = true,
      outputFormat = 'TIFF',
      iccProfile = 'sRGB',
      compression = 'lzw',
    } = options;

    try {
      // Convert data URL to buffer
      const base64Data = canvasDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const inputBuffer = Buffer.from(base64Data, 'base64');

      // Load image with sharp
      let image = sharp(inputBuffer);
      const metadata = await image.metadata();

      // Calculate dimensions with bleed
      const originalWidthPx = metadata.width || 0;
      const originalHeightPx = metadata.height || 0;
      const bleedPx = Math.round((bleedSizeMm / 25.4) * dpi);
      
      const finalWidth = includeBleed ? originalWidthPx + (bleedPx * 2) : originalWidthPx;
      const finalHeight = includeBleed ? originalHeightPx + (bleedPx * 2) : originalHeightPx;

      // Set DPI
      image = image.withMetadata({
        density: dpi,
      });

      // Extend canvas for bleed if needed
      if (includeBleed) {
        image = image.extend({
          top: bleedPx,
          bottom: bleedPx,
          left: bleedPx,
          right: bleedPx,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        });
      }

      // Convert to CMYK if requested
      let processedBuffer: Buffer;
      
      if (colorMode === 'CMYK') {
        const rgbBuffer = await image.png().toBuffer();
        processedBuffer = await this.cmykConverter.convertBufferToCMYK(rgbBuffer, {
          dpi,
          iccProfile,
        });
      } else {
        processedBuffer = await image.toBuffer();
      }

      // Add crop marks and print marks
      if (includeCropMarks || includeColorBars || includeRegistrationMarks) {
        processedBuffer = await this.bleedCropMarks.addPrintMarks(processedBuffer, {
          width: finalWidth,
          height: finalHeight,
          bleedSizePx: bleedPx,
          dpi,
          includeCropMarks,
          includeColorBars,
          includeRegistrationMarks,
        });
      }

      // Export in requested format
      let finalBuffer: Buffer;
      let finalFormat: string;

      switch (outputFormat) {
        case 'PNG':
          finalBuffer = await sharp(processedBuffer)
            .png({ compressionLevel: 9, quality: 100 })
            .toBuffer();
          finalFormat = 'image/png';
          break;

        case 'TIFF':
          finalBuffer = await sharp(processedBuffer)
            .tiff({ 
              compression: compression as 'lzw' | 'none' | 'jpeg',
              quality: 100,
              xres: dpi,
              yres: dpi,
            })
            .toBuffer();
          finalFormat = 'image/tiff';
          break;

        case 'PDF':
          // For PDF, we'd use a PDF library - placeholder for now
          finalBuffer = processedBuffer;
          finalFormat = 'application/pdf';
          break;

        default:
          finalBuffer = processedBuffer;
          finalFormat = 'image/png';
      }

      return {
        buffer: finalBuffer,
        format: finalFormat,
        width: finalWidth,
        height: finalHeight,
        dpi,
        colorMode,
        fileSize: finalBuffer.length,
        metadata: {
          originalWidth: originalWidthPx,
          originalHeight: originalHeightPx,
          bleedSizeMm,
          bleedSizePx: bleedPx,
          includeBleed,
          includeCropMarks,
          includeColorBars,
          includeRegistrationMarks,
          compression,
          iccProfile,
        },
      };
    } catch (error) {
      logger.error('Error generating print-ready file', {
        error,
        options,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async generateFromKonvaJSON(
    _konvaJSON: string,
    _options: PrintReadyOptions = {}
  ): Promise<PrintReadyResult> {
    // This would render Konva JSON to canvas first
    // For now, throw error as this requires client-side rendering
    throw new Error('Server-side Konva rendering not yet implemented. Use generateFromCanvas with pre-rendered canvas data URL.');
  }

  async generateMultipleFormats(
    canvasDataUrl: string,
    baseOptions: PrintReadyOptions = {}
  ): Promise<Map<string, PrintReadyResult>> {
    const results = new Map<string, PrintReadyResult>();

    // Generate PNG
    const pngResult = await this.generateFromCanvas(canvasDataUrl, {
      ...baseOptions,
      outputFormat: 'PNG',
    });
    results.set('png', pngResult);

    // Generate TIFF
    const tiffResult = await this.generateFromCanvas(canvasDataUrl, {
      ...baseOptions,
      outputFormat: 'TIFF',
      colorMode: 'CMYK',
    });
    results.set('tiff', tiffResult);

    // Generate PDF
    const pdfResult = await this.generateFromCanvas(canvasDataUrl, {
      ...baseOptions,
      outputFormat: 'PDF',
      colorMode: 'CMYK',
    });
    results.set('pdf', pdfResult);

    return results;
  }

  async validatePrintReady(buffer: Buffer): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    info: any;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const metadata = await sharp(buffer).metadata();

      // Check DPI
      const dpi = metadata.density || 0;
      if (dpi < 300) {
        errors.push(`DPI too low: ${dpi} (minimum 300 required)`);
      } else if (dpi < 600) {
        warnings.push(`DPI ${dpi} is acceptable but 600+ is recommended for high-quality prints`);
      }

      // Check dimensions
      const widthMm = ((metadata.width || 0) / dpi) * 25.4;
      const heightMm = ((metadata.height || 0) / dpi) * 25.4;

      if (widthMm < 10 || heightMm < 10) {
        warnings.push(`Small print size: ${widthMm.toFixed(1)}mm x ${heightMm.toFixed(1)}mm`);
      }

      // Check color mode
      if (metadata.space !== 'cmyk') {
        warnings.push('Not in CMYK color space - may cause color shifts during printing');
      }

      // Check file size
      const fileSizeMB = buffer.length / (1024 * 1024);
      if (fileSizeMB > 100) {
        warnings.push(`Large file size: ${fileSizeMB.toFixed(2)}MB`);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        info: {
          width: metadata.width,
          height: metadata.height,
          widthMm,
          heightMm,
          dpi,
          colorMode: metadata.space,
          format: metadata.format,
          fileSizeMB,
        },
      };
    } catch (error) {
      errors.push(`Validation error: ${error}`);
      return { valid: false, errors, warnings, info: null };
    }
  }

  estimateFileSize(width: number, height: number, dpi: number, colorMode: 'RGB' | 'CMYK'): number {
    // Estimate uncompressed file size
    const pixels = width * height;
    const bytesPerPixel = colorMode === 'CMYK' ? 4 : 3;
    const uncompressedBytes = pixels * bytesPerPixel;
    
    // Assume 50% compression for LZW
    return Math.round(uncompressedBytes * 0.5);
  }

  calculatePrintDimensions(widthPx: number, heightPx: number, dpi: number): {
    widthMm: number;
    heightMm: number;
    widthIn: number;
    heightIn: number;
  } {
    const widthIn = widthPx / dpi;
    const heightIn = heightPx / dpi;
    const widthMm = widthIn * 25.4;
    const heightMm = heightIn * 25.4;

    return {
      widthMm: Math.round(widthMm * 100) / 100,
      heightMm: Math.round(heightMm * 100) / 100,
      widthIn: Math.round(widthIn * 100) / 100,
      heightIn: Math.round(heightIn * 100) / 100,
    };
  }

  dispose(): void {
    // Cleanup if needed
  }
}

export default PrintReadyGenerator;
