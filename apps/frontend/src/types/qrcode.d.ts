declare module 'qrcode' {
  export interface QRCodeToDataURLOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    type?: 'image/png' | 'image/jpeg' | 'image/webp';
    quality?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    width?: number;
    scale?: number;
  }

  export function toDataURL(
    text: string,
    options?: QRCodeToDataURLOptions,
    callback?: (error: Error | null | undefined, url: string) => void,
  ): Promise<string>;

  export function toCanvas(
    canvas: HTMLCanvasElement,
    text: string,
    options?: QRCodeToDataURLOptions,
    callback?: (error: Error | null | undefined) => void,
  ): Promise<void>;

  export function toString(
    text: string,
    options?: QRCodeToDataURLOptions,
    callback?: (error: Error | null | undefined, result: string) => void,
  ): Promise<string>;

  export function toBuffer(
    text: string,
    options?: QRCodeToDataURLOptions,
    callback?: (error: Error | null | undefined, buffer: Buffer) => void,
  ): Promise<Buffer>;

  export function create(
    text: string,
    options?: QRCodeToDataURLOptions,
  ): unknown;
}
