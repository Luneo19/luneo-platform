declare module 'pdfkit' {
  import { Readable } from 'stream';
  class PDFDocument extends Readable {
    constructor(options?: Record<string, unknown>);
    font(src: string, size?: number): this;
    fontSize(size: number): this;
    text(text: string, x?: number, y?: number, options?: Record<string, unknown>): this;
    image(src: string | Buffer, x?: number, y?: number, options?: Record<string, unknown>): this;
    rect(x: number, y: number, w: number, h: number): this;
    fill(color?: string): this;
    stroke(color?: string): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    end(): void;
    [key: string]: unknown;
  }
  export = PDFDocument;
}
