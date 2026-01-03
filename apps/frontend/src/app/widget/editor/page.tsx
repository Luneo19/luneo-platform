'use client';

import { useEffect, useRef } from 'react';
import type { WidgetConfig } from '@luneo/widget-editor/types/designer.types';

export default function WidgetEditorPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetInitialized = useRef(false);

  useEffect(() => {
    if (widgetInitialized.current || !containerRef.current) return;

    // Load widget script
    const script = document.createElement('script');
    script.src = process.env.NEXT_PUBLIC_WIDGET_URL || 'https://cdn.luneo.app/widget/v1/luneo-widget.iife.js';
    script.async = true;
    script.onload = () => {
      if (window.LuneoWidget && containerRef.current) {
        const config: WidgetConfig = {
          container: containerRef.current,
          apiKey: process.env.NEXT_PUBLIC_API_KEY || '',
          productId: 'demo-product',
          locale: 'fr',
          theme: 'light',
          onSave: (designData) => {
            console.log('Design saved:', designData);
            alert('Design sauvegardé avec succès!');
          },
          onError: (error) => {
            console.error('Widget error:', error);
            alert(`Erreur: ${error.message}`);
          },
          onReady: () => {
            console.log('Widget ready');
          },
        };

        window.LuneoWidget.init(config);
        widgetInitialized.current = true;
      }
    };
    script.onerror = () => {
      console.error('Failed to load widget script');
    };
    document.head.appendChild(script);

    return () => {
      if (window.LuneoWidget) {
        window.LuneoWidget.destroy();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-4">Éditeur Widget Luneo</h1>
        <div ref={containerRef} className="w-full h-[800px] border border-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

