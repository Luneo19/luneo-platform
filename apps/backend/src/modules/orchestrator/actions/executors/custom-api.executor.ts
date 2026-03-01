import { Injectable, Logger } from '@nestjs/common';
import {
  ActionCategory,
  ActionContext,
  ActionDefinition,
  ActionExecutor,
  ActionResult,
} from '../action.interface';

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_SIZE = 512 * 1024; // 512 KB

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  '169.254.169.254',
];

@Injectable()
export class CustomApiExecutor implements ActionExecutor {
  private readonly logger = new Logger(CustomApiExecutor.name);

  readonly actionId = 'custom.api_call';

  readonly definition: ActionDefinition = {
    id: this.actionId,
    name: 'Custom API Call',
    description:
      'Execute a custom HTTP API call to an external service configured by the user',
    category: ActionCategory.CUSTOM,
    requiresAuth: true,
    parameters: [
      {
        name: 'url',
        type: 'string',
        description: 'Target URL for the API call',
        required: true,
      },
      {
        name: 'method',
        type: 'string',
        description: 'HTTP method: GET, POST, PUT, PATCH, or DELETE',
        required: false,
        default: 'GET',
      },
      {
        name: 'headers',
        type: 'string',
        description: 'JSON-encoded HTTP headers',
        required: false,
      },
      {
        name: 'body',
        type: 'string',
        description: 'Request body (JSON string for POST/PUT/PATCH)',
        required: false,
      },
      {
        name: 'queryParams',
        type: 'string',
        description: 'JSON-encoded query parameters',
        required: false,
      },
      {
        name: 'responseFormat',
        type: 'string',
        description: 'Expected response format: json or text',
        required: false,
        default: 'json',
      },
    ],
  };

  async execute(
    params: Record<string, unknown>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      const url = params.url as string;
      const method = (
        (params.method as string) ?? 'GET'
      ).toUpperCase();
      const responseFormat = (params.responseFormat as string) ?? 'json';

      if (!url) {
        return {
          success: false,
          message: 'URL is required',
          error: 'MISSING_URL',
        };
      }

      const validationError = this.validateRequest(url, method);
      if (validationError) return validationError;

      const headers = this.parseJsonParam<Record<string, string>>(
        params.headers,
        {},
      );
      const queryParams = this.parseJsonParam<Record<string, string>>(
        params.queryParams,
        {},
      );

      const finalUrl = this.buildUrl(url, queryParams);

      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Luneo-Agent/1.0',
        'X-Luneo-Agent-Id': context.agentId,
        'X-Luneo-Org-Id': context.organizationId,
        ...headers,
      };

      let body: string | undefined;
      if (params.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        body =
          typeof params.body === 'string'
            ? params.body
            : JSON.stringify(params.body);
      }

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      let response: Response;
      try {
        response = await fetch(finalUrl, {
          method,
          headers: requestHeaders,
          body,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
        return {
          success: false,
          message: 'Response too large (exceeds 512 KB)',
          error: 'RESPONSE_TOO_LARGE',
        };
      }

      const responseText = await response.text();

      if (responseText.length > MAX_RESPONSE_SIZE) {
        return {
          success: false,
          message: 'Response too large (exceeds 512 KB)',
          error: 'RESPONSE_TOO_LARGE',
        };
      }

      let responseData: unknown;
      if (responseFormat === 'json') {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }
      } else {
        responseData = responseText;
      }

      this.logger.log(
        `Custom API call: ${method} ${finalUrl} -> ${response.status} for agent ${context.agentId}`,
      );

      return {
        success: response.ok,
        data: {
          statusCode: response.status,
          statusText: response.statusText,
          body: responseData as Record<string, unknown>,
          headers: Object.fromEntries(response.headers.entries()),
        },
        message: response.ok
          ? `API call successful (${response.status} ${response.statusText})`
          : `API call returned ${response.status}: ${response.statusText}`,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('abort')) {
        return {
          success: false,
          message: `API call timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds`,
          error: 'REQUEST_TIMEOUT',
        };
      }

      this.logger.error(`Custom API call failed: ${errorMessage}`);

      return {
        success: false,
        message: 'Custom API call failed',
        error: errorMessage,
      };
    }
  }

  private validateRequest(url: string, method: string): ActionResult | null {
    if (!ALLOWED_METHODS.includes(method as (typeof ALLOWED_METHODS)[number])) {
      return {
        success: false,
        message: `HTTP method "${method}" is not allowed. Use: ${ALLOWED_METHODS.join(', ')}`,
        error: 'INVALID_METHOD',
      };
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return {
        success: false,
        message: 'Invalid URL format',
        error: 'INVALID_URL',
      };
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return {
        success: false,
        message: 'Only HTTP and HTTPS protocols are allowed',
        error: 'INVALID_PROTOCOL',
      };
    }

    if (BLOCKED_HOSTS.includes(parsedUrl.hostname)) {
      return {
        success: false,
        message: 'Requests to internal/private hosts are not allowed',
        error: 'BLOCKED_HOST',
      };
    }

    return null;
  }

  private buildUrl(
    base: string,
    queryParams: Record<string, string>,
  ): string {
    const url = new URL(base);
    for (const [key, value] of Object.entries(queryParams)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  private parseJsonParam<T>(value: unknown, fallback: T): T {
    if (!value) return fallback;

    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return fallback;
      }
    }

    if (typeof value === 'object') {
      return value as T;
    }

    return fallback;
  }
}
