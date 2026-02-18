/**
 * AR Quick Look Service (iOS)
 * Apple AR Quick Look integration: generates rel="ar" links, supports Apple Pay in AR,
 * and handles AR Quick Look callbacks.
 */

import { Injectable, Logger } from '@nestjs/common';
import { UsdzGeneratorService } from './usdz-generator.service';

/** Options for generating an AR Quick Look link */
export interface ARQuickLookLinkOptions {
  /** Model ID (AR3DModel) */
  modelId: string;
  /** Optional title for the AR experience */
  title?: string;
  /** Enable Apple Pay button in AR Quick Look */
  applePay?: boolean;
  /** Callback URL when user exits AR (optional) */
  callbackUrl?: string;
}

/** Result: URL to USDZ and HTML-ready anchor attributes */
export interface ARQuickLookLinkResult {
  /** URL to the USDZ file (for &lt;a rel="ar" href="..."&gt;) */
  usdzUrl: string;
  /** Whether USDZ was ready (true) or conversion was triggered (false) */
  ready: boolean;
  /** Optional message if conversion was queued */
  message?: string;
}

@Injectable()
export class ARQuickLookService {
  private readonly logger = new Logger(ARQuickLookService.name);

  constructor(private readonly usdzGenerator: UsdzGeneratorService) {}

  /**
   * Generates an AR Quick Look link for iOS.
   * Use in HTML: &lt;a rel="ar" href="{usdzUrl}"&gt;View in AR&lt;/a&gt;
   * Ensures USDZ is available (triggers conversion if not).
   *
   * @param options - modelId, optional title, applePay, callbackUrl
   * @returns usdzUrl and ready flag
   */
  async getARQuickLookLink(options: ARQuickLookLinkOptions): Promise<ARQuickLookLinkResult> {
    const { modelId, title, applePay = false, callbackUrl } = options;

    const { url: usdzUrl, ready } = await this.usdzGenerator.ensureUsdzUrl(modelId);

    this.logger.debug(
      `AR Quick Look link for model ${modelId}: ready=${ready}, applePay=${applePay}`,
    );

    return {
      usdzUrl,
      ready,
      message: ready ? undefined : 'USDZ conversion in progress; link will work when ready.',
    };
  }

  /**
   * Builds the HTML anchor attributes for AR Quick Look (for server-side or client rendering).
   * Includes rel="ar" and optional data attributes for Apple Pay / callbacks.
   *
   * @param usdzUrl - URL to the USDZ file
   * @param opts - optional title, applePay, callbackUrl
   * @returns Record of attribute name -> value for the anchor
   */
  buildAnchorAttributes(
    usdzUrl: string,
    opts?: { title?: string; applePay?: boolean; callbackUrl?: string },
  ): Record<string, string> {
    const attrs: Record<string, string> = {
      rel: 'ar',
      href: usdzUrl,
    };
    if (opts?.title) attrs['data-title'] = opts.title;
    if (opts?.applePay) attrs['data-apple-pay'] = 'true';
    if (opts?.callbackUrl) attrs['data-callback-url'] = opts.callbackUrl;
    return attrs;
  }

  /**
   * Handles AR Quick Look callback (e.g. when user exits AR).
   * Can be used to log analytics or redirect. Payload is typically from Apple's redirect.
   *
   * @param payload - optional callback payload (e.g. from query params)
   * @returns Acknowledgment for the callback handler
   */
  handleCallback(payload: Record<string, unknown> | null): { received: boolean } {
    if (payload && typeof payload === 'object') {
      this.logger.debug(`AR Quick Look callback: ${JSON.stringify(payload)}`);
    }
    return { received: true };
  }
}
