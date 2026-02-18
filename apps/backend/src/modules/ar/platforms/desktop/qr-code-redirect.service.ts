/**
 * QR Code Redirect Service (Desktop)
 * Generates desktop experience: show QR code that redirects user to mobile AR (view by platform).
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Options for generating the redirect experience */
export interface QRRedirectOptions {
  /** Target URL that the short link or viewer will resolve to (e.g. /ar/viewer/:modelId) */
  targetPath: string;
  /** Optional short code (e.g. from ARQRCode) for /ar/view/:shortCode */
  shortCode?: string;
  /** Optional title for the landing page */
  title?: string;
}

/** Result: URLs and config for desktop QR redirect flow */
export interface QRRedirectResult {
  /** Full URL to display in QR code (mobile users scan and open this) */
  qrTargetUrl: string;
  /** Full URL of the desktop landing page (optional; for embed or redirect) */
  landingPageUrl: string;
  /** Title for the landing page */
  title: string;
}

@Injectable()
export class QRCodeRedirectService {
  private readonly logger = new Logger(QRCodeRedirectService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Builds the URL that should be encoded in the QR code (for mobile).
   * When scanned on mobile, the client will hit this URL and get platform-specific redirect.
   *
   * @param options - targetPath (e.g. /ar/viewer/:modelId), optional shortCode, title
   * @returns qrTargetUrl, landingPageUrl, title
   */
  getRedirectConfig(options: QRRedirectOptions): QRRedirectResult {
    const baseUrl = this.getBaseUrl();
    const { targetPath, shortCode, title = 'View in AR' } = options;

    const path = shortCode ? `/ar/view/${shortCode}` : targetPath;
    const qrTargetUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const landingPageUrl = qrTargetUrl;

    this.logger.debug(`QR redirect: ${qrTargetUrl}`);

    return {
      qrTargetUrl,
      landingPageUrl,
      title,
    };
  }

  /**
   * Returns the URL where desktop users land (e.g. to show "Scan QR code" page).
   * Same as landingPageUrl from getRedirectConfig; exposed for direct use.
   */
  getLandingPageUrl(shortCodeOrPath: string): string {
    const baseUrl = this.getBaseUrl();
    const path = shortCodeOrPath.startsWith('/') ? shortCodeOrPath : `/${shortCodeOrPath}`;
    return `${baseUrl}${path}`;
  }

  private getBaseUrl(): string {
    const url = this.configService.get<string>('app.url') ?? this.configService.get<string>('APP_URL');
    return (url || 'http://localhost:3000').replace(/\/$/, '');
  }
}
