import JSZip from 'jszip';
import { logger } from '@/lib/logger';

export interface ProductionFile {
  name: string;
  url: string;
  type: 'pdf' | 'png' | 'svg' | 'dxf';
}

export async function zipProductionFiles(files: ProductionFile[], orderId: string): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder(`order-${orderId}-production-files`);

  if (!folder) {
    throw new Error('Failed to create ZIP folder');
  }

  // Download and add each file to ZIP
  for (const file of files) {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      folder.file(file.name, blob);
    } catch (error) {
      logger.error('Failed to add file to ZIP', {
        error,
        fileName: file.name,
        fileUrl: file.url,
        fileType: file.type,
        orderId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Add README with instructions
  const readme = `
LUNEO PRODUCTION FILES
=====================

Order ID: ${orderId}
Generated: ${new Date().toISOString()}

FILES INCLUDED:
${files.map((f) => `- ${f.name} (${f.type.toUpperCase()})`).join('\n')}

PRINTING INSTRUCTIONS:
- PDF files are ready for professional printing (PDF/X-4 standard)
- PNG files are 300 DPI high-resolution images
- SVG files are vector graphics for scalable printing
- DXF files are for laser cutting/engraving

For support, contact: support@luneo.app
`;

  folder.file('README.txt', readme);

  // Generate ZIP blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return zipBlob;
}

export async function createZipDownloadUrl(zipBlob: Blob, _filename: string): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.readAsDataURL(zipBlob);
  });
}

export function downloadZip(zipBlob: Blob, filename: string): void {
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

