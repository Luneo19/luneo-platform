'use client';

import { Designer } from './components/Designer/Designer';
import type { WidgetConfig, DesignData } from './types/designer.types';

interface DesignerAppProps {
  apiKey: string;
  productId: string;
  locale?: string;
  theme?: 'light' | 'dark';
  onSave?: (designData: DesignData) => void;
  onError?: (error: Error) => void;
  onReady?: () => void;
}

export function DesignerApp({
  apiKey,
  productId,
  locale = 'en',
  theme = 'light',
  onSave,
  onError,
  onReady,
}: DesignerAppProps) {
  const config: WidgetConfig = {
    container: '#luneo-widget-container',
    apiKey,
    productId,
    locale,
    theme,
    onSave,
    onError,
    onReady,
  };
  
  return (
    <div id="luneo-widget-container" className="h-full w-full">
      <Designer config={config} />
    </div>
  );
}

