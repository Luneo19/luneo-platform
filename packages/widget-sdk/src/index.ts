export interface LuneoWidgetConfig {
  widgetId: string;
  apiUrl?: string;
  position?: 'BOTTOM_RIGHT' | 'BOTTOM_LEFT';
  color?: string;
  autoOpen?: boolean;
  greeting?: string;
}

export interface LuneoWidgetAPI {
  open: () => void;
  close: () => void;
  toggle: () => void;
  sendMessage: (text: string) => void;
  destroy: () => void;
}

declare global {
  interface Window {
    LuneoWidget?: LuneoWidgetAPI;
    __luneo_v2_initialized?: boolean;
    LUNEO_API_URL?: string;
  }
}

export function initLuneoWidget(config: LuneoWidgetConfig): LuneoWidgetAPI {
  if (typeof window === 'undefined') {
    return { open() {}, close() {}, toggle() {}, sendMessage() {}, destroy() {} };
  }

  if (config.apiUrl) {
    window.LUNEO_API_URL = config.apiUrl;
  }

  const existing = document.querySelector('script[data-widget-id="' + config.widgetId + '"]');
  if (existing) {
    return window.LuneoWidget ?? { open() {}, close() {}, toggle() {}, sendMessage() {}, destroy() {} };
  }

  const script = document.createElement('script');
  script.src = (config.apiUrl?.replace('/api/v1', '') || 'https://cdn.luneo.app') + '/widget/v2/luneo-widget.js';
  script.setAttribute('data-widget-id', config.widgetId);
  script.async = true;
  document.body.appendChild(script);

  return new Proxy({} as LuneoWidgetAPI, {
    get(_, prop: string) {
      return function (...args: unknown[]) {
        const api = window.LuneoWidget;
        if (api && typeof (api as Record<string, unknown>)[prop] === 'function') {
          return (api as Record<string, (...a: unknown[]) => unknown>)[prop](...args);
        }
      };
    },
  });
}

export function destroyLuneoWidget(): void {
  if (typeof window !== 'undefined' && window.LuneoWidget) {
    window.LuneoWidget.destroy();
  }
}
