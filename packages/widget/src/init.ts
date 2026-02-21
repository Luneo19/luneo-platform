import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { DesignerApp } from './App';
import { useDesignerStore } from './store/designerStore';
import type { WidgetConfig } from './types/designer.types';

interface LuneoWidget {
  init: (config: WidgetConfig) => void;
  open: (config: Partial<WidgetConfig>) => void;
  close: () => void;
  getDesign: () => unknown;
  destroy: () => void;
}

let root: Root | null = null;
let currentConfig: WidgetConfig | null = null;

const LuneoWidget: LuneoWidget = {
  init(config: WidgetConfig) {
    // Validate config
    if (!config.container) {
      throw new Error('LuneoWidget: container is required');
    }
    if (!config.apiKey) {
      throw new Error('LuneoWidget: apiKey is required');
    }
    if (!config.productId) {
      throw new Error('LuneoWidget: productId is required');
    }
    
    // Get container element
    const container = typeof config.container === 'string'
      ? document.querySelector(config.container)
      : config.container;
    
    if (!container) {
      throw new Error(`LuneoWidget: container "${config.container}" not found`);
    }
    
    currentConfig = config;
    
    // Create React root and render
    root = createRoot(container);
    root.render(
      React.createElement(DesignerApp, {
        apiKey: config.apiKey,
        productId: config.productId,
        locale: config.locale || 'en',
        theme: config.theme || 'light',
        onSave: config.onSave,
        onError: config.onError,
        onReady: config.onReady,
      })
    );
    
    // Call onReady callback
    if (config.onReady) {
      setTimeout(() => config.onReady!(), 100);
    }
  },
  
  open(partialConfig: Partial<WidgetConfig>) {
    if (!currentConfig) {
      throw new Error('LuneoWidget: call init() first');
    }
    
    const config = { ...currentConfig, ...partialConfig };
    this.init(config);
  },
  
  close() {
    if (root) {
      root.unmount();
      root = null;
    }
  },
  
  getDesign() {
    const state = useDesignerStore.getState();
    if (!state.design) return null;
    return {
      design: state.design,
      layers: state.design?.layers ?? [],
      product: state.product,
      json: state.exportAsJSON(),
    };
  },
  
  destroy() {
    this.close();
    currentConfig = null;
  },
};

// Expose to window for script tag usage
if (typeof window !== 'undefined') {
  (window as any).LuneoWidget = LuneoWidget;
}

export { LuneoWidget };
export default LuneoWidget;

