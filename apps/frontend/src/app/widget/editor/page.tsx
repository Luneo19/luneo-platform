'use client';

import { useEffect, useRef } from 'react';
// WidgetConfig type definition
interface WidgetConfig {
  container: HTMLElement;
  apiKey: string;
  productId: string;
  locale: string;
  theme: 'light' | 'dark';
  onSave?: (designData: any) => void;
  onError?: (error: { message: string }) => void;
  onReady?: () => void;
}

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
          container: containerRef.current as HTMLElement,
          apiKey: process.env.NEXT_PUBLIC_API_KEY || '',
          productId: 'demo-product',
          locale: 'fr',
          theme: 'light',
          onSave: (designData) => {
            // Widget callback - logging acceptable for external widget debugging
            if (process.env.NODE_ENV === 'development') {
              console.log('Design saved:', designData);
            }
            alert('Design sauvegardé avec succès!');
          },
          onError: (error) => {
            // Widget callback - logging acceptable for external widget debugging
            if (process.env.NODE_ENV === 'development') {
              console.error('Widget error:', error);
            }
            alert(`Erreur: ${error.message}`);
          },
          onReady: () => {
            // Widget callback - logging acceptable for external widget debugging
            if (process.env.NODE_ENV === 'development') {
              console.log('Widget ready');
            }
          },
        };

        window.LuneoWidget.init(config);
        widgetInitialized.current = true;
      }
    };
    script.onerror = () => {
      // Widget script loading error - use logger if available
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load widget script');
      }
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






