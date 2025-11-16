import crypto from 'crypto';
import axios, { type AxiosRequestConfig } from 'axios';
import { Injectable, Logger } from '@nestjs/common';

interface ProxyForwardOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

@Injectable()
export class AppProxy {
  private readonly logger = new Logger(AppProxy.name);

  /**
   * Génère la signature app proxy Shopify à partir des paramètres fournis.
   */
  generateSignature(
    params: Record<string, string | undefined>,
    secret: string
  ): string {
    const sortedParams = Object.keys(params)
      .filter((key) => key !== 'signature' && params[key] !== undefined)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('');

    return crypto.createHmac('sha256', secret).update(sortedParams).digest('hex');
  }

  /**
   * Vérifie que la signature fournie correspond aux paramètres signés par Shopify.
   */
  verifySignature(
    params: Record<string, string | undefined>,
    secret: string
  ): boolean {
    const providedSignature = params.signature;
    if (!providedSignature) {
      this.logger.warn('App proxy signature manquante');
      return false;
    }

    const generatedSignature = this.generateSignature(params, secret);
    const isValid = crypto.timingSafeEqual(
      Buffer.from(providedSignature),
      Buffer.from(generatedSignature)
    );

    if (!isValid) {
      this.logger.warn('Signature app proxy invalide', {
        expected: generatedSignature,
        received: providedSignature,
      });
    }

    return isValid;
  }

  /**
   * Construit une URL signée à partir d'un endpoint App Proxy.
   */
  buildSignedUrl(
    baseUrl: string,
    params: Record<string, string | undefined>,
    secret: string
  ): string {
    const signature = this.generateSignature(params, secret);
    const url = new URL(baseUrl);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    });

    url.searchParams.set('signature', signature);
    return url.toString();
  }

  /**
   * Transfère une requête vers un endpoint privé en conservant la sécurité App Proxy.
   */
  async forward<T = unknown>(
    targetUrl: string,
    params: Record<string, string | undefined>,
    secret: string,
    options: ProxyForwardOptions = {}
  ): Promise<T> {
    const { method = 'GET', body, headers, timeoutMs = 5000 } = options;

    const signedUrl = this.buildSignedUrl(targetUrl, params, secret);

    const axiosConfig: AxiosRequestConfig = {
      method,
      url: signedUrl,
      timeout: timeoutMs,
      headers,
      data: body,
    };

    const response = await axios.request<T>(axiosConfig);
    return response.data;
  }
}


