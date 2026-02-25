import { useEffect, useRef, useCallback } from 'react';
import { initLuneoWidget, destroyLuneoWidget, LuneoWidgetConfig, LuneoWidgetAPI } from './index';

export type { LuneoWidgetConfig, LuneoWidgetAPI };

export interface LuneoWidgetProps extends LuneoWidgetConfig {
  onReady?: (api: LuneoWidgetAPI) => void;
}

export function LuneoWidget({ onReady, ...config }: LuneoWidgetProps) {
  const apiRef = useRef<LuneoWidgetAPI | null>(null);

  useEffect(() => {
    const api = initLuneoWidget(config);
    apiRef.current = api;

    if (onReady) {
      const check = setInterval(() => {
        if (window.LuneoWidget) {
          clearInterval(check);
          onReady(window.LuneoWidget);
        }
      }, 100);
      const timeout = setTimeout(() => clearInterval(check), 10000);
      return () => { clearInterval(check); clearTimeout(timeout); };
    }
  }, [config.widgetId]);

  useEffect(() => {
    return () => { destroyLuneoWidget(); };
  }, []);

  return null;
}

export function useLuneoWidget(): LuneoWidgetAPI | null {
  if (typeof window !== 'undefined') {
    return window.LuneoWidget ?? null;
  }
  return null;
}
