/**
 * Luneo Widget SDK
 * 
 * Embed SDK for integrating Luneo AI design widget into third-party websites.
 * Supports secure iframe embedding with JWT token authentication and postMessage handshake.
 */

export interface LuneoWidgetConfig {
  /** Shop domain (e.g., "myshop.myshopify.com") */
  shop: string;
  /** Token endpoint URL (e.g., "https://api.luneo.app/api/embed/token") */
  tokenUrl: string;
  /** Container element or selector where widget will be mounted */
  container: HTMLElement | string;
  /** Widget iframe URL (defaults to CDN) */
  widgetUrl?: string;
  /** Callback when widget is ready */
  onReady?: () => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
}

export interface TokenResponse {
  token: string;
  nonce: string;
  expiresIn: number;
}

export interface HandshakeMessage {
  type: 'handshake' | 'ready' | 'error';
  nonce?: string;
  token?: string;
  error?: string;
}

/**
 * Luneo Widget SDK
 */
export class LuneoWidget {
  private config: Required<LuneoWidgetConfig>;
  private iframe: HTMLIFrameElement | null = null;
  private nonce: string | null = null;
  private token: string | null = null;
  private messageHandler: ((event: MessageEvent) => void) | null = null;
  private isReady = false;

  constructor(config: LuneoWidgetConfig) {
    // Validate required config
    if (!config.shop) {
      throw new Error('LuneoWidget: shop is required');
    }
    if (!config.tokenUrl) {
      throw new Error('LuneoWidget: tokenUrl is required');
    }
    if (!config.container) {
      throw new Error('LuneoWidget: container is required');
    }

    // Set defaults
    this.config = {
      widgetUrl: config.widgetUrl || 'https://widget.luneo.app',
      onReady: config.onReady || (() => {}),
      onError: config.onError || ((err) => console.error('LuneoWidget error:', err)),
      ...config,
    };
  }

  /**
   * Initialize the widget
   */
  async init(): Promise<void> {
    try {
      // Get container element
      const container = this.getContainer();
      if (!container) {
        throw new Error(`Container not found: ${this.config.container}`);
      }

      // Obtain short-lived embed JWT token
      const tokenData = await this.fetchToken();
      this.token = tokenData.token;
      this.nonce = tokenData.nonce;

      // Create iframe with sandbox attributes
      this.iframe = this.createIframe(tokenData);

      // Setup postMessage handshake
      this.setupHandshake();

      // Append iframe to container
      container.appendChild(this.iframe);

      // Wait for handshake completion
      await this.waitForHandshake();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.config.onError(err);
      throw err;
    }
  }

  /**
   * Destroy the widget instance
   */
  destroy(): void {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }

    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
      this.iframe = null;
    }

    this.isReady = false;
    this.token = null;
    this.nonce = null;
  }

  /**
   * Get container element
   */
  private getContainer(): HTMLElement | null {
    if (typeof this.config.container === 'string') {
      return document.querySelector(this.config.container);
    }
    return this.config.container;
  }

  /**
   * Fetch embed token from backend
   */
  private async fetchToken(): Promise<TokenResponse> {
    const url = new URL(this.config.tokenUrl);
    url.searchParams.set('shop', this.config.shop);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.token || !data.nonce) {
      throw new Error('Invalid token response: missing token or nonce');
    }

    return {
      token: data.token,
      nonce: data.nonce,
      expiresIn: data.expiresIn || 300, // Default 5 minutes
    };
  }

  /**
   * Create iframe with sandbox attributes
   */
  private createIframe(tokenData: TokenResponse): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    
    // Build widget URL with token
    const widgetUrl = new URL(this.config.widgetUrl);
    widgetUrl.searchParams.set('token', tokenData.token);
    widgetUrl.searchParams.set('nonce', tokenData.nonce);
    widgetUrl.searchParams.set('shop', this.config.shop);

    iframe.src = widgetUrl.toString();
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals');
    iframe.setAttribute('allow', 'camera; microphone; geolocation');
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.minHeight = '600px';
    iframe.title = 'Luneo AI Design Widget';

    return iframe;
  }

  /**
   * Setup postMessage handshake
   */
  private setupHandshake(): void {
    this.messageHandler = (event: MessageEvent) => {
      // Verify origin
      const widgetOrigin = new URL(this.config.widgetUrl).origin;
      if (event.origin !== widgetOrigin) {
        console.warn(`LuneoWidget: Ignoring message from unexpected origin: ${event.origin}`);
        return;
      }

      try {
        const message = event.data as HandshakeMessage;

        if (message.type === 'handshake' && message.nonce === this.nonce) {
          // Send token back to iframe
          this.sendMessage({
            type: 'handshake',
            nonce: this.nonce!,
            token: this.token!,
          });
        } else if (message.type === 'ready') {
          this.isReady = true;
          this.config.onReady();
        } else if (message.type === 'error') {
          throw new Error(message.error || 'Unknown error from widget');
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.config.onError(err);
      }
    };

    window.addEventListener('message', this.messageHandler);
  }

  /**
   * Send message to iframe
   */
  private sendMessage(message: HandshakeMessage): void {
    if (!this.iframe || !this.iframe.contentWindow) {
      throw new Error('Iframe not ready');
    }

    const widgetOrigin = new URL(this.config.widgetUrl).origin;
    this.iframe.contentWindow.postMessage(message, widgetOrigin);
  }

  /**
   * Wait for handshake completion with timeout
   */
  private waitForHandshake(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Handshake timeout: widget did not respond'));
      }, 10000); // 10 second timeout

      const checkReady = () => {
        if (this.isReady) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };

      checkReady();
    });
  }

  /**
   * Static initialization helper
   */
  static init(config: LuneoWidgetConfig): Promise<LuneoWidget> {
    const widget = new LuneoWidget(config);
    return widget.init().then(() => widget);
  }
}

// Export default instance creator
export default LuneoWidget;
